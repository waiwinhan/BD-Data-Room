<template>
  <!-- Floating launcher button -->
  <button
    v-show="!open"
    class="chat-fab"
    type="button"
    aria-label="Open AI assistant"
    @click="onOpen"
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <span class="chat-fab-pulse"></span>
  </button>

  <!-- Expanded panel -->
  <div v-show="open" class="chat-panel" role="dialog" aria-label="AI Assistant">
    <header class="chat-header">
      <div class="chat-header-left">
        <div class="chat-header-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2 L13.5 8.5 L20 10 L13.5 11.5 L12 18 L10.5 11.5 L4 10 L10.5 8.5 Z"/>
          </svg>
        </div>
        <div>
          <div class="chat-header-title">Strategic Co-Pilot</div>
          <div class="chat-header-sub">
            KB · {{ threads.length }} chats
            <span v-if="dealLabel" class="chat-deal-chip">📌 {{ dealLabel }}</span>
          </div>
        </div>
      </div>
      <div class="chat-header-actions">
        <button class="chat-icon-btn" type="button" title="Chat history" @click="showHistory = !showHistory">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9"/><polyline points="3 4 3 12 11 12"/>
          </svg>
        </button>
        <button class="chat-icon-btn" type="button" title="New chat" @click="onNew">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <button class="chat-icon-btn" type="button" title="Close" @click="open = false">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- History dropdown -->
    <div v-if="showHistory" class="chat-history">
      <div class="chat-history-head">Recent chats</div>
      <div v-if="!threads.length" class="chat-history-empty">No chats yet — ask anything to start.</div>
      <button
        v-for="t in threads"
        :key="t.id"
        type="button"
        class="chat-history-item"
        :class="{ active: t.id === threadId }"
        @click="onPickThread(t.id)"
      >
        <span class="chat-history-title">{{ t.title || 'New chat' }}</span>
        <span class="chat-history-meta">{{ formatRelative(t.updated_at) }}</span>
      </button>
    </div>

    <!-- Messages -->
    <div ref="scrollEl" class="chat-body">
      <div v-if="!messages.length" class="chat-empty">
        <div class="chat-empty-title">Ask anything about Malaysian property.</div>
        <div class="chat-empty-sub">Grounded in your knowledge base ({{ totalNotes }} notes) {{ dealLabel ? '+ this deal' : '' }}.</div>
        <div class="chat-suggestions">
          <button v-for="s in suggestions" :key="s" type="button" class="chat-suggestion" @click="send(s)">{{ s }}</button>
        </div>
      </div>

      <div v-for="(m, i) in messages" :key="i" class="chat-msg" :class="m.role">
        <div class="chat-msg-bubble" v-html="renderMarkdown(m.content)"></div>
        <span v-if="m.pending && !m.content" class="chat-typing">
          <i></i><i></i><i></i>
        </span>
      </div>

      <div v-if="errorMsg" class="chat-error">⚠️ {{ errorMsg }}</div>
    </div>

    <!-- Composer -->
    <form class="chat-input" @submit.prevent="onSubmit">
      <textarea
        v-model="input"
        placeholder="Ask the co-pilot…"
        rows="1"
        :disabled="streaming"
        @keydown="onKeydown"
        ref="inputEl"
      ></textarea>
      <button type="submit" :disabled="!input.trim() || streaming" aria-label="Send">
        <svg v-if="!streaming" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        <span v-else class="chat-spinner"></span>
      </button>
    </form>

    <div v-if="lastUsage && (lastUsage.cacheRead || lastUsage.cacheCreate)" class="chat-meta">
      <span v-if="lastUsage.cacheRead">cache read: {{ lastUsage.cacheRead.toLocaleString() }} tok</span>
      <span v-else-if="lastUsage.cacheCreate">cache primed: {{ lastUsage.cacheCreate.toLocaleString() }} tok</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const {
  open, messages, threads, threadId, streaming, errorMsg, lastUsage,
  loadThreads, openThread, newThread, sendMessage,
} = useChat()

const input = ref('')
const showHistory = ref(false)
const scrollEl = ref<HTMLElement | null>(null)
const inputEl  = ref<HTMLTextAreaElement | null>(null)

const totalNotes = ref(115)
const suggestions = [
  "What's Gamuda Land's typical build quality reputation?",
  'Compare Mont Kiara comps for a luxury condo at RM 1,800 PSF.',
  'Construction cost benchmark for landed houses in Klang Valley?',
  'Latest data centre developments in Johor — any signal for industrial land?',
]

// dealId from /[dealId] route — strip leading slash
const dealId = computed<string | null>(() => {
  const id = (route.params as any)?.dealId
  if (typeof id === 'string' && id) return id
  return null
})
const dealLabel = computed(() => dealId.value ?? '')

async function onOpen() {
  open.value = true
  if (!threads.value.length) await loadThreads()
  await nextTick()
  inputEl.value?.focus()
}

function onNew() {
  newThread()
  showHistory.value = false
  nextTick(() => inputEl.value?.focus())
}

async function onPickThread(id: string) {
  showHistory.value = false
  await openThread(id)
  await nextTick()
  scrollToBottom()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    onSubmit()
  }
}

async function onSubmit() {
  if (!input.value.trim() || streaming.value) return
  const text = input.value
  input.value = ''
  await send(text)
}

async function send(text: string) {
  await sendMessage(text, dealId.value)
}

function scrollToBottom() {
  const el = scrollEl.value
  if (el) el.scrollTop = el.scrollHeight
}

watch(() => messages.value.map(m => m.content).join('|'), () => {
  nextTick(scrollToBottom)
})

watch(open, (v) => {
  if (v) nextTick(scrollToBottom)
})

onMounted(() => {
  // Pre-warm thread list so the history panel is responsive
  loadThreads()
})

// ── Tiny markdown renderer (headings, bold, italic, code, lists, links) ──
function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderMarkdown(text: string): string {
  if (!text) return ''
  const lines = text.split('\n')
  const out: string[] = []
  let inCode = false
  let codeLang = ''
  let codeBuf: string[] = []
  let inList = false
  let listType: 'ul' | 'ol' | null = null

  function flushList() {
    if (inList && listType) { out.push(`</${listType}>`); inList = false; listType = null }
  }

  for (const raw of lines) {
    const line = raw

    // Fenced code
    const fence = line.match(/^```(\w*)\s*$/)
    if (fence) {
      if (inCode) {
        out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`)
        codeBuf = []; inCode = false; codeLang = ''
      } else {
        flushList()
        inCode = true
        codeLang = fence[1] ?? ''
      }
      continue
    }
    if (inCode) { codeBuf.push(line); continue }

    // Headings
    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      flushList()
      const lvl = Math.min(h[1].length + 2, 6)
      out.push(`<h${lvl}>${inlineMd(h[2])}</h${lvl}>`)
      continue
    }

    // Lists
    const ul = line.match(/^\s*[-*]\s+(.*)$/)
    const ol = line.match(/^\s*\d+\.\s+(.*)$/)
    if (ul) {
      if (!inList || listType !== 'ul') { flushList(); out.push('<ul>'); inList = true; listType = 'ul' }
      out.push(`<li>${inlineMd(ul[1])}</li>`)
      continue
    }
    if (ol) {
      if (!inList || listType !== 'ol') { flushList(); out.push('<ol>'); inList = true; listType = 'ol' }
      out.push(`<li>${inlineMd(ol[1])}</li>`)
      continue
    }

    if (line.trim() === '') {
      flushList()
      out.push('')
      continue
    }

    flushList()
    out.push(`<p>${inlineMd(line)}</p>`)
  }
  if (inCode) out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`)
  flushList()
  return out.join('\n')
}

function inlineMd(s: string): string {
  let str = escapeHtml(s)
  str = str.replace(/`([^`]+)`/g, '<code>$1</code>')
  str = str.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  str = str.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  str = str.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  return str
}

function formatRelative(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString()
}
</script>

<style scoped>
.chat-fab {
  position: fixed; bottom: 24px; right: 24px; z-index: 200;
  width: 52px; height: 52px; border-radius: 50%;
  background: var(--text); color: #fff;
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 20px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.10);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.chat-fab:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.22); }
.chat-fab:active { transform: translateY(0); }
.chat-fab-pulse {
  position: absolute; inset: 0; border-radius: 50%;
  background: var(--green); opacity: 0;
  animation: chatPulse 2.6s ease-out infinite;
  pointer-events: none;
}
@keyframes chatPulse {
  0%   { transform: scale(1);   opacity: 0.35; }
  80%  { transform: scale(1.6); opacity: 0; }
  100% { transform: scale(1.6); opacity: 0; }
}

.chat-panel {
  position: fixed; bottom: 24px; right: 24px; z-index: 200;
  width: 420px; height: 620px;
  max-height: calc(100vh - 48px);
  background: var(--surface); border: 1px solid var(--border2); border-radius: 14px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.18), 0 6px 20px rgba(0,0,0,0.12);
  display: flex; flex-direction: column;
  overflow: hidden;
  font-family: 'DM Sans', sans-serif;
  color: var(--text);
}

.chat-header {
  flex: 0 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
.chat-header-left { display: flex; align-items: center; gap: 10px; }
.chat-header-icon {
  width: 30px; height: 30px; border-radius: 8px;
  background: var(--text); color: #fff;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.chat-header-title { font-weight: 600; font-size: 13px; line-height: 1.2; }
.chat-header-sub { font-size: 11px; color: var(--muted); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.chat-deal-chip {
  background: var(--green-bg); color: var(--green-txt);
  padding: 1px 8px; border-radius: 999px; font-size: 10.5px; font-weight: 500;
}
.chat-header-actions { display: flex; align-items: center; gap: 4px; }
.chat-icon-btn {
  width: 28px; height: 28px; border-radius: 6px;
  border: 1px solid transparent; background: transparent;
  color: var(--muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.chat-icon-btn:hover { background: var(--surface2); color: var(--text); border-color: var(--border); }

.chat-history {
  flex: 0 0 auto;
  border-bottom: 1px solid var(--border);
  background: var(--surface2);
  max-height: 220px; overflow-y: auto;
  padding: 6px 0;
}
.chat-history-head {
  font-size: 10.5px; font-weight: 600;
  color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em;
  padding: 6px 14px;
}
.chat-history-empty {
  padding: 8px 14px 12px; font-size: 12px; color: var(--muted);
}
.chat-history-item {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  width: 100%; padding: 7px 14px;
  border: none; background: transparent; cursor: pointer; text-align: left;
  font-family: inherit; color: var(--text);
}
.chat-history-item:hover, .chat-history-item.active { background: rgba(0,0,0,0.04); }
.chat-history-title { font-size: 12.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
.chat-history-meta { font-size: 10.5px; color: var(--faint); flex-shrink: 0; }

.chat-body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 16px 14px;
  display: flex; flex-direction: column; gap: 12px;
  background: var(--surface2);
}
.chat-empty {
  text-align: center;
  margin: auto 0;
  padding: 12px;
}
.chat-empty-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
.chat-empty-sub { font-size: 12px; color: var(--muted); margin-bottom: 14px; }
.chat-suggestions {
  display: flex; flex-direction: column; gap: 6px; margin: 0 auto; max-width: 320px;
}
.chat-suggestion {
  font-family: inherit; font-size: 12px; color: var(--text);
  background: var(--surface); border: 1px solid var(--border);
  padding: 8px 10px; border-radius: 8px; cursor: pointer;
  text-align: left; line-height: 1.35;
  transition: all 0.15s;
}
.chat-suggestion:hover { border-color: var(--border2); background: #fff; }

.chat-msg { display: flex; max-width: 100%; }
.chat-msg.user { justify-content: flex-end; }
.chat-msg.assistant { justify-content: flex-start; }
.chat-msg-bubble {
  max-width: 85%;
  padding: 9px 12px;
  border-radius: 12px;
  font-size: 13px; line-height: 1.5;
  white-space: normal;
  word-wrap: break-word;
}
.chat-msg.user .chat-msg-bubble {
  background: var(--text); color: #fff;
  border-bottom-right-radius: 4px;
}
.chat-msg.assistant .chat-msg-bubble {
  background: var(--surface); color: var(--text);
  border: 1px solid var(--border);
  border-bottom-left-radius: 4px;
}
.chat-msg-bubble :deep(p) { margin: 0; }
.chat-msg-bubble :deep(p + p),
.chat-msg-bubble :deep(p + ul),
.chat-msg-bubble :deep(p + ol),
.chat-msg-bubble :deep(ul + p),
.chat-msg-bubble :deep(ol + p),
.chat-msg-bubble :deep(p + h3),
.chat-msg-bubble :deep(p + h4) { margin-top: 8px; }
.chat-msg-bubble :deep(ul),
.chat-msg-bubble :deep(ol) { padding-left: 20px; margin: 6px 0; }
.chat-msg-bubble :deep(li) { margin: 2px 0; }
.chat-msg-bubble :deep(h3),
.chat-msg-bubble :deep(h4),
.chat-msg-bubble :deep(h5) { margin: 10px 0 4px; font-weight: 600; }
.chat-msg-bubble :deep(h3) { font-size: 14px; }
.chat-msg-bubble :deep(h4),
.chat-msg-bubble :deep(h5) { font-size: 13px; }
.chat-msg-bubble :deep(code) {
  background: rgba(0,0,0,0.06); padding: 1px 5px; border-radius: 4px;
  font-family: 'DM Mono', monospace; font-size: 12px;
}
.chat-msg.user .chat-msg-bubble :deep(code) { background: rgba(255,255,255,0.15); }
.chat-msg-bubble :deep(pre) {
  background: rgba(0,0,0,0.04); padding: 8px 10px; border-radius: 6px;
  overflow-x: auto; margin: 6px 0;
}
.chat-msg-bubble :deep(pre code) {
  background: transparent; padding: 0; font-size: 11.5px;
}
.chat-msg-bubble :deep(strong) { font-weight: 600; }
.chat-msg-bubble :deep(a) { color: var(--blue); text-decoration: underline; }

.chat-typing {
  display: inline-flex; gap: 3px; align-items: center;
  padding: 9px 12px;
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
  border-bottom-left-radius: 4px;
}
.chat-typing i {
  width: 5px; height: 5px; border-radius: 50%; background: var(--faint);
  animation: chatTyping 1.2s infinite ease-in-out;
}
.chat-typing i:nth-child(2) { animation-delay: 0.15s; }
.chat-typing i:nth-child(3) { animation-delay: 0.3s; }
@keyframes chatTyping {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30%           { transform: translateY(-4px); opacity: 1; }
}

.chat-error {
  font-size: 12px; color: var(--red);
  background: var(--red-bg); border: 1px solid rgba(163,45,45,0.18);
  padding: 8px 10px; border-radius: 8px;
}

.chat-input {
  flex: 0 0 auto;
  display: flex; align-items: flex-end; gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border);
  background: var(--surface);
}
.chat-input textarea {
  flex: 1; resize: none;
  min-height: 36px; max-height: 140px;
  padding: 9px 11px;
  border: 1px solid var(--border); border-radius: 8px;
  font-family: inherit; font-size: 13px; line-height: 1.4; color: var(--text);
  background: var(--surface2);
  outline: none; transition: border 0.15s;
}
.chat-input textarea:focus { border-color: var(--text); background: var(--surface); }
.chat-input button {
  flex-shrink: 0;
  width: 36px; height: 36px; border-radius: 8px;
  background: var(--text); color: #fff; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: opacity 0.15s;
}
.chat-input button:disabled { opacity: 0.35; cursor: not-allowed; }

.chat-spinner {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff;
  animation: chatSpin 0.7s linear infinite;
}
@keyframes chatSpin { to { transform: rotate(360deg); } }

.chat-meta {
  flex: 0 0 auto;
  font-size: 10.5px; color: var(--faint);
  padding: 0 14px 8px;
  display: flex; gap: 10px;
}

@media (max-width: 540px) {
  .chat-panel {
    right: 8px; left: 8px; bottom: 8px;
    width: auto; height: calc(100vh - 16px); max-height: none;
  }
  .chat-fab { right: 16px; bottom: 16px; }
}
</style>
