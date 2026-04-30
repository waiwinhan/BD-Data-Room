/**
 * POST /api/chat — Streaming chat endpoint for the floating AI assistant.
 *
 * Body: { message: string, threadId?: string, dealId?: string | null }
 *
 * Stream protocol (SSE-like, one event per line, no event names):
 *   data: { "type": "thread", "threadId": "...", "title": "..." }
 *   data: { "type": "delta", "text": "..." }
 *   data: { "type": "usage", "input": n, "output": n, "cacheCreate": n, "cacheRead": n }
 *   data: { "type": "done" }
 *   data: { "type": "error", "message": "..." }
 */

import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are the Strategic AI Co-Pilot for Wai Win Han, a Kuala Lumpur–based property developer and investor.

You combine the analytical sharpness of a McKinsey strategy consultant, a Goldman Sachs investment banker, and a real-estate development strategist. You answer in clear business English — concise, structured (headings + bullets when useful), and decision-oriented.

Always prioritise: Clarity → Strategy → Financial Logic → Execution.

You have access to two grounded knowledge sources, attached below as system context:
1. The "malaysia-property" knowledge base — Wai's curated notes on KL micromarkets, developers, projects, construction-cost benchmarks, policy/legal concepts, and source clippings.
2. The "current deal" context (only present when Wai is viewing a specific deal page).

GROUNDING RULES:
- Prefer facts from the KB and the current deal over general knowledge. When you cite a fact from the KB, reference the note id (e.g. "per entities/developers/gamuda-land").
- If the KB and the deal data don't cover something, say so plainly — do not fabricate Malaysian market figures or developer reputations.
- When asked to compare a deal to comparables, look for matching area / asset class / tier in the KB and reason from those.
- Numbers from the deal context are authoritative for the current deal.

OUTPUT STYLE:
- Default to concise responses. Use Situation → Considerations → Options → Recommendation only when the question is a real decision.
- Use Markdown. Tables for comps. Bullets for lists.
- For financial reasoning, show the math briefly (PSF, IRR sensitivity, margin) — don't just state conclusions.
- Avoid corporate filler. Wai dislikes verbose preambles.`

interface ChatRequestBody {
  message: string
  threadId?: string | null
  dealId?: string | null
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.anthropicApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'ANTHROPIC_API_KEY not configured' })
  }

  const session = await getUserSession(event)
  const userLabel = (session as any)?.user?.label
  if (!userLabel) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  const body = await readBody<ChatRequestBody>(event)
  const userMessage = (body?.message ?? '').trim()
  if (!userMessage) throw createError({ statusCode: 400, statusMessage: 'message is required' })

  const sb = useSupabase()

  // ── Resolve or create thread ─────────────────────────────────────────────
  let threadId = body.threadId ?? null
  let isNewThread = false
  if (threadId) {
    const { data: t } = await sb
      .from('chat_threads')
      .select('id, user_label')
      .eq('id', threadId)
      .single()
    if (!t || (t as any).user_label !== userLabel) threadId = null
  }
  if (!threadId) {
    const initialTitle = userMessage.length > 60 ? userMessage.slice(0, 57) + '…' : userMessage
    const { data: created, error: createErr } = await sb
      .from('chat_threads')
      .insert({
        user_label: userLabel,
        title: initialTitle,
        deal_id: body.dealId ?? null,
      })
      .select('id')
      .single()
    if (createErr || !created) {
      throw createError({ statusCode: 500, statusMessage: `Failed to create thread: ${createErr?.message}` })
    }
    threadId = (created as any).id
    isNewThread = true
  }

  // ── Load history ─────────────────────────────────────────────────────────
  const { data: historyRows } = await sb
    .from('chat_messages')
    .select('role, content')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(60)

  const history = ((historyRows ?? []) as any[])
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content as string }))

  // Persist the new user message before streaming (so it's visible if stream fails)
  await sb.from('chat_messages').insert({
    thread_id: threadId,
    role: 'user',
    content: userMessage,
    deal_id: body.dealId ?? null,
  })

  // ── Build context blocks ─────────────────────────────────────────────────
  const retriever = createRetriever()
  const kb = await retriever.getContext({ query: userMessage })

  let dealBlock: string | null = null
  if (body.dealId) {
    try {
      dealBlock = await buildDealContext(body.dealId)
    } catch {
      dealBlock = null
    }
  }

  const systemBlocks: any[] = [
    { type: 'text', text: SYSTEM_PROMPT },
    {
      type: 'text',
      text: `## MALAYSIA-PROPERTY KNOWLEDGE BASE (${kb.noteCount} notes, version ${kb.version})\n\n${kb.blocks[0].content}`,
      cache_control: { type: 'ephemeral' },
    },
  ]
  if (dealBlock) {
    systemBlocks.push({
      type: 'text',
      text: dealBlock,
      cache_control: { type: 'ephemeral' },
    })
  }

  // ── SSE response setup ───────────────────────────────────────────────────
  setResponseHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setResponseHeader(event, 'Connection', 'keep-alive')
  setResponseHeader(event, 'X-Accel-Buffering', 'no')

  const res = event.node.res
  function emit(payload: any) {
    res.write(`data: ${JSON.stringify(payload)}\n\n`)
  }

  emit({ type: 'thread', threadId, isNew: isNewThread })

  const client = new Anthropic({ apiKey: config.anthropicApiKey })

  let fullText = ''
  let usage = { input: 0, output: 0, cacheCreate: 0, cacheRead: 0 }

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemBlocks,
      messages: [
        ...history,
        { role: 'user', content: userMessage },
      ],
    })

    stream.on('text', (delta: string) => {
      fullText += delta
      emit({ type: 'delta', text: delta })
    })

    const finalMessage: any = await stream.finalMessage()
    if (finalMessage?.usage) {
      usage = {
        input:       finalMessage.usage.input_tokens         ?? 0,
        output:      finalMessage.usage.output_tokens        ?? 0,
        cacheCreate: finalMessage.usage.cache_creation_input_tokens ?? 0,
        cacheRead:   finalMessage.usage.cache_read_input_tokens     ?? 0,
      }
    }
    emit({ type: 'usage', ...usage })

    // Persist assistant message
    if (fullText.trim()) {
      await sb.from('chat_messages').insert({
        thread_id: threadId,
        role: 'assistant',
        content: fullText,
        deal_id: body.dealId ?? null,
      })
    }

    // Auto-title: replace placeholder with a Haiku-generated title once we have an exchange
    if (isNewThread && fullText.trim()) {
      try {
        const titleRes = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 24,
          messages: [
            {
              role: 'user',
              content: `Summarise this conversation as a short chat title (max 6 words, no quotes, no trailing punctuation):\n\nUser: ${userMessage}\n\nAssistant: ${fullText.slice(0, 600)}`,
            },
          ],
        })
        const title = ((titleRes.content[0] as any)?.text ?? '').trim().replace(/^["']|["']$/g, '').slice(0, 80)
        if (title) {
          await sb.from('chat_threads').update({ title }).eq('id', threadId)
          emit({ type: 'thread', threadId, title })
        }
      } catch { /* non-fatal */ }
    }

    emit({ type: 'done' })
  } catch (err: any) {
    emit({ type: 'error', message: err?.message ?? 'unknown error' })
  } finally {
    res.end()
  }
})
