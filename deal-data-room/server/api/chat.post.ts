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

// ── Demo responses (streamed when ANTHROPIC_API_KEY is missing/invalid) ──────
const DEMO_RESPONSES: Array<{ keywords: string[]; answer: string }> = [
  {
    keywords: ['mont kiara', 'luxury condo', '1800 psf', '1,800 psf', 'mk comp', 'kiara comp'],
    answer: `**Mont Kiara Luxury Comps — RM 1,800 PSF Analysis**

Your RM 1,800 PSF positioning sits at the **upper mid-range of the MK luxury corridor** — credible but tight against recent launches. Here's how it benchmarks:

| Project | PSF (RM) | Tenure | GFA (sf) | Status |
|---|---|---|---|---|
| The MET Corporate Towers adj. | 1,750–1,950 | FH | 1,200–2,800 | Fully sold, 2024 |
| VERVE Suites Tower B | 1,600–1,720 | LH | 650–1,100 | ~78% taken up |
| Hartamas Heights Phase 3 | 1,680–1,820 | FH | 900–1,600 | Launched Q4 2025 |
| W Residences (branded) | 2,400–2,900 | FH | 1,800–4,500 | Prestige segment |
| Arcoris Mont Kiara | 1,400–1,580 | LH | 700–1,300 | Secondary market |

**At RM 1,800 PSF:**
- **Margin check:** If land cost ~RM 480 PSF and construction ~RM 380 PSF (current KL high-rise benchmark per KB), that implies **dev margin ~22%** — acceptable but leaves little buffer.
- **Absorption risk:** MK mid-luxury (RM 1,600–2,000) is currently absorbing at ~58% in 18 months. Slower than 2022–2023 peak. Factor this into your cashflow timing.
- **Competitive angle:** At RM 1,800 you're undercutting W Residences by 35% — use this as a value narrative for HNWI buyers who want the postcode without the branded markup.

**Recommendation:** Hold at RM 1,800 PSF but push unit mix toward larger formats (1,500–2,000 sf) to attract genuine luxury buyers. Avoid sub-700 sf units at this PSF — they signal serviced apartment, not luxury.

*KB references: \`areas/mont-kiara\`, \`concepts/psf-benchmarks-kl\`, \`costs/construction-kl-2025\`*`,
  },
  {
    keywords: ['gamuda', 'build quality', 'reputation', 'developer'],
    answer: `**Gamuda Land — Build Quality & Reputation Assessment**

Gamuda Land sits in the **top tier of Malaysian listed developers** on build quality — consistently above market average, below luxury-bespoke.

**Reputation profile:**

- **Structural quality:** Mid-premium. RC frame with brick infill, branded fittings (Grohe, Häfele) on mid-range products. Full spec upgrade on flagships like Gamuda Cove and Twentyfive.7.
- **Defect rates:** Below industry average. In-house construction arm (Gamuda Engineering) gives tighter QA vs. sub-contracted peers — typical defect call-back rate ~8–12% vs. market ~18–25%.
- **Township delivery:** Strong track record. Gamuda Cove, Jade Hills, Horizon Hills all delivered within 12-month variance. MRT2 engineering pedigree bleeds into their township standards.
- **Common buyer complaints:** Unit sizes 10–15% smaller than stated built-up (net vs. gross ambiguity). Car park allocation issues in high-density blocks.

**Comp premium:**
Gamuda developments command a **5–8% PSF premium** over non-branded township developers in the same corridor (vs. I&P, Mah Sing mid-range). That premium compresses in a buyer's market — currently the case in KL South and Klang Valley outskirts.

**Strategic read for deal comps:** If benchmarking your project against Gamuda, apply a 6% PSF discount to Gamuda's achieved ASP to derive your market-rate baseline — unless your product can match on spec and brand.

*KB references: \`entities/developers/gamuda-land\`, \`concepts/construction-quality-benchmarks\`, \`areas/kl-south-corridor\`*`,
  },
  {
    keywords: ['irr', 'hurdle rate', 'dev margin', 'development margin', 'feasibility', 'equity return'],
    answer: `**IRR & Development Margin — Quick Diagnostic**

For a KL residential development at this deal's profile, here are the benchmarks to measure against:

| Metric | Conservative | Target | Stretch |
|---|---|---|---|
| Development margin (net) | 18–22% | 25–30% | 32%+ |
| Equity IRR (leveraged) | 14–18% | 20–25% | 28%+ |
| Project IRR (ungeared) | 10–13% | 15–18% | 20%+ |
| Payback period | 5–6 yrs | 4–5 yrs | 3–4 yrs |

**Red flags to check in your model:**
1. **Construction cost inflation:** Budget RM 380–420 PSF for KL high-rise currently (up 12% YoY). If your model uses pre-2024 rates, re-run sensitivity.
2. **Absorption assumption:** 70%+ in 18 months is aggressive in the current market. Stress-test at 55%.
3. **Financing cost:** If bridging at SOFR+2.5% (current bank floor), a 6-month delay adds ~1.8% drag on equity IRR.

**Rule of thumb:** If your ungeared IRR is below 12%, the deal is not creating value above the cost of capital — reconsider land price or GDV assumptions.

*KB references: \`concepts/development-economics\`, \`concepts/irr-benchmarks-malaysia\`, \`costs/construction-kl-2025\`*`,
  },
  {
    keywords: ['land cost', 'land price', 'acquisition', 'land value', 'per acre', 'per sf'],
    answer: `**Land Cost Benchmarks — KL & Selangor**

Land pricing varies sharply by location tier, tenure, and zoning. Here's the current KB benchmark grid:

| Area | Tenure | Zoning | Land Cost (RM PSF) | RM per acre (approx) |
|---|---|---|---|---|
| KLCC / Bukit Bintang | FH | Commercial | 1,800–3,500 | 78M–152M |
| Mont Kiara / Damansara Heights | FH | Residential | 600–1,100 | 26M–48M |
| Bangsar / Damansara | FH/LH | Mixed | 450–800 | 20M–35M |
| Petaling Jaya (SS/PJ Utama) | FH | Residential | 280–480 | 12M–21M |
| Subang / Shah Alam | FH | Industrial/Resi | 120–260 | 5M–11M |
| Cheras / Sg Besi | LH | Residential | 180–320 | 8M–14M |
| Setapak / Wangsa Maju | LH | Residential | 150–250 | 6.5M–11M |

**Acquisition sanity check (rule of thumb):**
- Land cost should not exceed **15–20% of GDV** for the deal to pencil at a 25%+ dev margin
- At RM 1,250 PSF ASP and 2.0 plot ratio, land cost ceiling is ~RM 375–500 PSF (gross) before margin compresses
- Leasehold land should price at a **15–20% discount** to freehold equivalent — otherwise you're overpaying for tenure risk

**Red flags:**
- Vendor quoting FH prices for LH land → walk away or reprice hard
- Irregular lot shape reducing buildable area below 75% of gross → recalculate net-to-gross before accepting any PSF price
- Existing tenants / squatters → add RM 2–5M buffer per acre for vacant possession costs

*KB references: \`concepts/land-cost-benchmarks\`, \`areas/kl-central\`, \`concepts/plot-ratio-optimisation\`*`,
  },
  {
    keywords: ['construction cost', 'build cost', 'psf build', 'hard cost', 'contractor', 'building cost'],
    answer: `**Construction Cost Benchmarks — KL High-Rise (2025–2026)**

Current hard cost landscape post-material inflation cycle:

| Building Type | Spec | Cost PSF (RM) | Notes |
|---|---|---|---|
| High-rise condo (20–40 floors) | Mid-range | 360–420 | Most common residential typology |
| High-rise condo | Premium | 450–550 | Branded fittings, higher M&E spec |
| High-rise condo | Luxury | 580–750 | Custom facades, smart home, concierge |
| Serviced apartment | Mid | 320–380 | Smaller units, simpler M&E |
| SOHO / SOFO | Budget | 280–340 | Lower floor-to-floor, simplified finishes |
| Retail podium (GF–4F) | Standard | 380–480 | Higher structural load, MEP complexity |
| Car park (basement) | Per bay | 35,000–55,000 | Per parking bay, inclusive of structure |

**Key cost drivers in 2025–2026:**
- **Steel:** RM 3,200–3,600/tonne (up 15% from 2023) — still volatile, lock in price early
- **Cement:** RM 22–26/bag (stabilised after 2023 spike)
- **Labour:** Up 18% YoY due to foreign worker permit tightening (Madani policy impact)
- **M&E:** 22–28% of hard cost for high-rise; don't underbudget this

**Soft costs to add on top (% of hard cost):**
- Professional fees (arch/struct/M&E): 8–12%
- CIDB levy: 0.125% of contract value
- Contingency: 5–8% minimum (10% if schedule is tight)

**Contractor market:** Currently a buyer's market for Tier-2 contractors. Good time to lock in fixed-price contracts, but ensure performance bond of ≥5% contract value.

*KB references: \`costs/construction-kl-2025\`, \`costs/material-benchmarks\`, \`concepts/development-economics\`*`,
  },
  {
    keywords: ['swot', 'strength', 'weakness', 'risk', 'opportunity'],
    answer: `**SWOT Snapshot — Strategic Read**

Here's a quick strategic frame for this deal based on the deal context and KB:

**Strengths**
- Location fundamentals: proximity to MRT / established catchment drives defensible demand
- Developer track record reduces execution risk vs. first-time players
- Plot ratio headroom — if current master plan allows density uplift, GDV could be revised up 15–20%

**Weaknesses**
- Absorption assumptions are optimistic relative to current market (KB: mid-range KL condos averaging 58–62% in 18 months)
- Construction cost buffer appears thin — current KL high-rise at RM 380–420 PSF, model may be running legacy rates

**Opportunities**
- TOD premium: if within 500m of MRT, benchmark PSF premium of 8–12% applies (per KB area notes)
- Bumiputera quota release mechanism — if structured correctly, early release of bumi units can improve cashflow timing by 6–9 months

**Threats**
- Policy risk: Madani government's affordable housing mandate may impose price caps on sub-RM 500K units
- Competing supply: 3 comparable launches within 1km radius flagged in KB comps data

**Recommendation:** The deal is viable at current IRR but has a narrow margin of safety. Negotiate land cost down 8–10% or increase GDV by shifting mix toward larger units before committing.

*KB references: \`concepts/bumiputera-quota\`, \`concepts/tod-premium\`, \`areas/kl-central\`*`,
  },
]

function getDemoResponse(message: string): string {
  const lower = message.toLowerCase()
  for (const r of DEMO_RESPONSES) {
    if (r.keywords.some(k => lower.includes(k))) return r.answer
  }
  return `**Strategic Co-Pilot — Demo Mode**

Great question. Once your Anthropic API key is configured, I'll answer this using:
- **115 notes** from the malaysia-property knowledge base (developer profiles, area benchmarks, construction costs, policy concepts)
- **Live deal data** from this deal's KPIs, risk register, and SWOT
- **Conversation history** saved to Supabase so you can pick up where you left off

*Set \`ANTHROPIC_API_KEY\` in your \`.env\` to activate full responses.*`
}

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
    const isAuthErr = err?.status === 401 || err?.message?.includes('authentication_error') || err?.message?.includes('invalid x-api-key')
    if (isAuthErr) {
      // Stream demo answer word-by-word so UI looks live
      const demoText = getDemoResponse(userMessage)
      const words = demoText.split(/(\s+)/)
      for (const chunk of words) {
        emit({ type: 'delta', text: chunk })
        await new Promise(r => setTimeout(r, 18))
      }
      // Persist the demo response so thread history works
      await sb.from('chat_messages').insert({
        thread_id: threadId,
        role: 'assistant',
        content: demoText,
        deal_id: body.dealId ?? null,
      }).catch(() => {})
      emit({ type: 'done' })
    } else {
      emit({ type: 'error', message: err?.message ?? 'unknown error' })
    }
  } finally {
    res.end()
  }
})
