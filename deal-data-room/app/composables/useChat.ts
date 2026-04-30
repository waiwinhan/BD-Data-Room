/**
 * useChat — global state + streaming SSE client for the floating chatbot.
 *
 * Wraps a fetch+ReadableStream call to /api/chat. State is shared via useState()
 * so the widget keeps its messages while the user navigates between deals.
 */

export interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
}

export interface ChatThreadSummary {
  id: string
  title: string
  deal_id: string | null
  updated_at: string
}

export function useChat() {
  const open       = useState<boolean>('chat:open', () => false)
  const threadId   = useState<string | null>('chat:threadId', () => null)
  const messages   = useState<ChatMessage[]>('chat:messages', () => [])
  const threads    = useState<ChatThreadSummary[]>('chat:threads', () => [])
  const streaming  = useState<boolean>('chat:streaming', () => false)
  const errorMsg   = useState<string | null>('chat:error', () => null)
  const lastUsage  = useState<{ cacheRead: number; cacheCreate: number; input: number; output: number } | null>('chat:usage', () => null)

  async function loadThreads() {
    try {
      threads.value = await $fetch<ChatThreadSummary[]>('/api/chat/threads')
    } catch (err: any) {
      console.warn('loadThreads failed', err)
    }
  }

  async function openThread(id: string) {
    if (streaming.value) return
    threadId.value = id
    messages.value = []
    errorMsg.value = null
    try {
      const res = await $fetch<{ thread: any; messages: ChatMessage[] }>(`/api/chat/${id}/messages`)
      messages.value = (res.messages ?? []).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      }))
    } catch (err: any) {
      errorMsg.value = err?.statusMessage ?? err?.message ?? 'Failed to load thread'
    }
  }

  function newThread() {
    if (streaming.value) return
    threadId.value = null
    messages.value = []
    errorMsg.value = null
    lastUsage.value = null
  }

  async function deleteThread(id: string) {
    try {
      await $fetch(`/api/chat/${id}`, { method: 'DELETE' })
      threads.value = threads.value.filter(t => t.id !== id)
      if (threadId.value === id) newThread()
    } catch (err: any) {
      errorMsg.value = err?.statusMessage ?? err?.message ?? 'Failed to delete'
    }
  }

  async function sendMessage(content: string, dealId?: string | null) {
    if (!content.trim() || streaming.value) return
    errorMsg.value = null
    streaming.value = true

    messages.value.push({ role: 'user', content })
    messages.value.push({ role: 'assistant', content: '', pending: true })
    const assistantIdx = messages.value.length - 1

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          threadId: threadId.value,
          dealId: dealId ?? null,
        }),
      })

      if (!response.ok || !response.body) {
        const text = await response.text().catch(() => '')
        throw new Error(text || `HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const rawLine of lines) {
          const line = rawLine.trim()
          if (!line.startsWith('data:')) continue
          const json = line.slice(5).trim()
          if (!json) continue
          let evt: any
          try { evt = JSON.parse(json) } catch { continue }

          if (evt.type === 'thread') {
            if (evt.threadId) threadId.value = evt.threadId
            if (evt.title && threads.value.length) {
              const t = threads.value.find(x => x.id === evt.threadId)
              if (t) t.title = evt.title
            }
          } else if (evt.type === 'delta' && typeof evt.text === 'string') {
            const m = messages.value[assistantIdx]
            if (m) {
              m.content += evt.text
              m.pending = false
            }
          } else if (evt.type === 'usage') {
            lastUsage.value = {
              input: evt.input ?? 0,
              output: evt.output ?? 0,
              cacheCreate: evt.cacheCreate ?? 0,
              cacheRead: evt.cacheRead ?? 0,
            }
          } else if (evt.type === 'error') {
            errorMsg.value = evt.message ?? 'Stream error'
          } else if (evt.type === 'done') {
            // handled by stream end
          }
        }
      }
    } catch (err: any) {
      errorMsg.value = err?.message ?? 'Request failed'
      const m = messages.value[assistantIdx]
      if (m && !m.content) m.content = '⚠️ Failed to get response. Please try again.'
      if (m) m.pending = false
    } finally {
      streaming.value = false
      const last = messages.value[messages.value.length - 1]
      if (last) last.pending = false
      // Refresh threads list so newly-created thread + auto-title show up
      loadThreads()
    }
  }

  return {
    open,
    threadId,
    messages,
    threads,
    streaming,
    errorMsg,
    lastUsage,
    loadThreads,
    openThread,
    newThread,
    deleteThread,
    sendMessage,
  }
}
