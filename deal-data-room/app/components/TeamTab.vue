<template>
  <div class="team-tab">

    <!-- Two-column: BRDB team + External advisors -->
    <div class="team-grid">

      <!-- BRDB Deal Team -->
      <div class="card">
        <div class="card-label">BRDB Deal Team</div>
        <div v-if="!internal.length" class="empty-msg">No internal team members listed.</div>
        <div
          v-for="(member, i) in internal"
          :key="member.email ?? i"
          class="member-row"
        >
          <div class="avatar" :style="avatarStyle(i)">{{ initials(member.name) }}</div>
          <div class="member-info">
            <div class="member-name">{{ member.name }}</div>
            <div class="member-sub">{{ member.email }}</div>
          </div>
          <span class="member-role">{{ member.role }}</span>
        </div>
      </div>

      <!-- External Advisors -->
      <div class="card">
        <div class="card-label">External Advisors</div>
        <div v-if="!external.length" class="empty-msg">No external advisors listed.</div>
        <div
          v-for="(advisor, i) in external"
          :key="advisor.email ?? i"
          class="member-row"
        >
          <div class="avatar" :style="avatarStyle(i + 4)">{{ initials(advisor.name) }}</div>
          <div class="member-info">
            <div class="member-name">{{ advisor.name }}</div>
            <div class="member-sub">{{ advisor.firm }}</div>
          </div>
          <span class="member-role">{{ advisor.role }}</span>
        </div>
      </div>
    </div>

    <!-- Document Access Log -->
    <div class="card log-card">
      <div class="card-label">Document Access Log</div>
      <div v-if="!accessLog.length" class="empty-msg">No activity recorded yet.</div>
      <div v-for="(entry, i) in accessLog" :key="i" class="log-row">
        <span class="log-action-icon" :class="entry.action">
          {{ entry.action === 'uploaded' ? '↑' : entry.action === 'downloaded' ? '↓' : '👁' }}
        </span>
        <span class="log-body">
          <strong>{{ entry.user }}</strong>
          {{ entry.action }}
          <span class="log-file">{{ entry.file }}</span>
        </span>
        <span class="log-time">{{ relativeTime(entry.timestamp) }}</span>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ dealId: string }>()

const { data: meta } = await useFetch<any>(`/api/${props.dealId}/meta`)

const internal  = computed(() => meta.value?.team?.internal  ?? [])
const external  = computed(() => meta.value?.team?.external  ?? [])
const accessLog = computed(() => meta.value?.accessLog ?? [])

// Avatar palette — 8 colours, offset for external advisors
const PALETTE = [
  { bg: '#C0DD97', fg: '#3B6D11' },
  { bg: '#B5D4F4', fg: '#185FA5' },
  { bg: '#F4C0D1', fg: '#993556' },
  { bg: '#FAEEDA', fg: '#854F0B' },
  { bg: '#CED8F6', fg: '#534AB7' },
  { bg: '#9FE1CB', fg: '#0F6E56' },
  { bg: '#F7C1C1', fg: '#A32D2D' },
  { bg: '#D3D1C7', fg: '#5F5E5A' },
]

function avatarStyle(index: number) {
  const c = PALETTE[index % PALETTE.length]
  return { background: c.bg, color: c.fg }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

function relativeTime(ts: string): string {
  const now  = new Date()
  const date = new Date(ts)
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / 86_400_000)
  const time = date.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: false })

  if (days === 0) return `Today ${time}`
  if (days === 1) return `Yesterday ${time}`
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + time
}
</script>

<style scoped>
.team-tab { display: flex; flex-direction: column; gap: 20px; }

.team-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 700px) { .team-grid { grid-template-columns: 1fr; } }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
}
.log-card { padding: 20px; }

.card-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin-bottom: 14px;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.member-row:last-child { border-bottom: none; }

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.member-info { flex: 1; min-width: 0; }
.member-name { font-size: 13.5px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.member-sub  { font-size: 11.5px; color: var(--muted); margin-top: 1px; }

.member-role {
  font-size: 11.5px;
  color: var(--muted);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px 8px;
  white-space: nowrap;
}

.empty-msg { font-size: 12.5px; color: var(--muted); padding: 8px 0; }

/* Access log */
.log-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}
.log-row:last-child { border-bottom: none; }

.log-action-icon {
  font-size: 12px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-style: normal;
}
.log-action-icon.uploaded   { background: #dbeafe; color: #1d4ed8; }
.log-action-icon.viewed     { background: #f0fdf4; color: #166534; }
.log-action-icon.downloaded { background: #fef9c3; color: #854d0e; }

.log-body { flex: 1; color: var(--text); line-height: 1.4; }
.log-file  { color: var(--accent, #2563eb); font-style: italic; }

.log-time {
  font-size: 11.5px;
  color: var(--muted);
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
