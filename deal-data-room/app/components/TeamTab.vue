<template>
  <div class="team-tab">

    <!-- Two-column: Internal team + External advisors -->
    <div class="team-grid">

      <!-- ── Internal Deal Team ── -->
      <div class="card">
        <div class="card-header">
          <span class="card-label">Deal Team</span>
          <button v-if="isAdmin && !editingInternal" class="btn-edit" @click="startEditInternal">Edit</button>
          <div v-if="editingInternal" class="header-actions">
            <button class="btn-cancel" @click="cancelInternal">Cancel</button>
            <button class="btn-save" :disabled="saving" @click="saveTeam">
              <span v-if="saving" class="mini-spinner"></span>
              <span v-else>Save</span>
            </button>
          </div>
        </div>

        <!-- View mode -->
        <template v-if="!editingInternal">
          <div v-if="!internal.length" class="empty-msg">No internal team members listed.</div>
          <div v-for="(m, i) in internal" :key="m.email ?? i" class="member-row">
            <div class="avatar" :style="avatarStyle(i)">{{ initials(m.name) }}</div>
            <div class="member-info">
              <div class="member-name">{{ m.name }}</div>
              <div class="member-sub">{{ m.email }}</div>
            </div>
            <span class="member-role">{{ m.role }}</span>
          </div>
        </template>

        <!-- Edit mode -->
        <template v-else>
          <div v-for="(m, i) in draftInternal" :key="i" class="edit-row">
            <div class="edit-fields">
              <input v-model="m.name"  class="edit-input" placeholder="Full name" />
              <input v-model="m.role"  class="edit-input" placeholder="Role" />
              <input v-model="m.email" class="edit-input" placeholder="Email" />
            </div>
            <button class="btn-remove-row" @click="draftInternal.splice(i, 1)" title="Remove">✕</button>
          </div>
          <button class="btn-add-row" @click="draftInternal.push({ name: '', role: '', email: '' })">+ Add Member</button>
          <div v-if="teamError" class="team-error">{{ teamError }}</div>
        </template>
      </div>

      <!-- ── External Advisors ── -->
      <div class="card">
        <div class="card-header">
          <span class="card-label">External Advisors</span>
          <button v-if="isAdmin && !editingExternal" class="btn-edit" @click="startEditExternal">Edit</button>
          <div v-if="editingExternal" class="header-actions">
            <button class="btn-cancel" @click="cancelExternal">Cancel</button>
            <button class="btn-save" :disabled="saving" @click="saveTeam">
              <span v-if="saving" class="mini-spinner"></span>
              <span v-else>Save</span>
            </button>
          </div>
        </div>

        <!-- View mode -->
        <template v-if="!editingExternal">
          <div v-if="!external.length" class="empty-msg">No external advisors listed.</div>
          <div v-for="(a, i) in external" :key="a.email ?? i" class="member-row">
            <div class="avatar" :style="avatarStyle(i + 4)">{{ initials(a.name) }}</div>
            <div class="member-info">
              <div class="member-name">{{ a.name }}</div>
              <div class="member-sub">{{ a.firm }}</div>
            </div>
            <span class="member-role">{{ a.role }}</span>
          </div>
        </template>

        <!-- Edit mode -->
        <template v-else>
          <div v-for="(a, i) in draftExternal" :key="i" class="edit-row">
            <div class="edit-fields">
              <input v-model="a.name" class="edit-input" placeholder="Full name" />
              <input v-model="a.role" class="edit-input" placeholder="Role" />
              <input v-model="a.firm" class="edit-input" placeholder="Firm / Company" />
              <input v-model="a.email" class="edit-input" placeholder="Email (optional)" />
            </div>
            <button class="btn-remove-row" @click="draftExternal.splice(i, 1)" title="Remove">✕</button>
          </div>
          <button class="btn-add-row" @click="draftExternal.push({ name: '', role: '', firm: '', email: '' })">+ Add Advisor</button>
          <div v-if="teamError" class="team-error">{{ teamError }}</div>
        </template>
      </div>
    </div>

    <!-- ── Document Activity Log ── -->
    <div class="card log-card">
      <div class="card-header" style="margin-bottom:14px">
        <span class="card-label" style="margin-bottom:0">Document Access Log</span>
        <button class="btn-edit" @click="loadLog">↻ Refresh</button>
      </div>

      <div v-if="logLoading" class="empty-msg">Loading…</div>
      <div v-else-if="!activityLog.length" class="empty-msg">No activity recorded yet.</div>
      <div v-for="entry in activityLog" :key="entry.id" class="log-row">
        <span class="log-icon" :class="iconClass(entry.action)">{{ iconChar(entry.action) }}</span>
        <span class="log-body">
          <strong class="log-user">{{ entry.user_label }}</strong>
          <span class="log-action">{{ entry.action }}</span>
          <span v-if="entry.target_name" class="log-target">{{ entry.target_name }}</span>
        </span>
        <span class="log-type-badge" :class="entry.target_type">{{ entry.target_type }}</span>
        <span class="log-time">{{ formatDate(entry.created_at) }}</span>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ dealId: string }>()

const { session } = useUserSession()
const isAdmin = computed(() => (session.value as any)?.user?.label === 'Admin')

const { data: meta, refresh } = await useFetch<any>(`/api/${props.dealId}/meta`)

const internal = computed(() => meta.value?.team?.internal ?? [])
const external = computed(() => meta.value?.team?.external ?? [])

// ── Edit state ────────────────────────────────────────────────────────────────
const editingInternal = ref(false)
const editingExternal = ref(false)
const draftInternal   = ref<any[]>([])
const draftExternal   = ref<any[]>([])
const saving   = ref(false)
const teamError = ref('')

function startEditInternal() {
  draftInternal.value = internal.value.map((m: any) => ({ ...m }))
  editingInternal.value = true
  teamError.value = ''
}

function startEditExternal() {
  draftExternal.value = external.value.map((a: any) => ({ ...a }))
  editingExternal.value = true
  teamError.value = ''
}

function cancelInternal() { editingInternal.value = false; teamError.value = '' }
function cancelExternal() { editingExternal.value = false; teamError.value = '' }

async function saveTeam() {
  teamError.value = ''
  saving.value = true
  try {
    await $fetch(`/api/${props.dealId}/team`, {
      method: 'PUT',
      body: {
        internal: editingInternal.value ? draftInternal.value.filter(m => m.name.trim()) : internal.value,
        external: editingExternal.value ? draftExternal.value.filter(a => a.name.trim()) : external.value,
      },
    })
    await refresh()
    editingInternal.value = false
    editingExternal.value = false
    await loadLog()
  } catch (err: any) {
    teamError.value = err.data?.statusMessage || err.message || 'Failed to save.'
  } finally {
    saving.value = false
  }
}

// ── Activity log ──────────────────────────────────────────────────────────────
const activityLog = ref<any[]>([])
const logLoading  = ref(false)

async function loadLog() {
  logLoading.value = true
  try {
    activityLog.value = await $fetch(`/api/${props.dealId}/activity-log`) as any[]
  } catch { activityLog.value = [] }
  finally { logLoading.value = false }
}

onMounted(loadLog)

function iconChar(action: string) {
  if (action === 'uploaded')   return '↑'
  if (action === 'deleted')    return '✕'
  if (action === 'updated')    return '✎'
  if (action.startsWith('status')) return '⟳'
  return '•'
}

function iconClass(action: string) {
  if (action === 'uploaded')   return 'ic-upload'
  if (action === 'deleted')    return 'ic-delete'
  if (action === 'updated')    return 'ic-update'
  if (action.startsWith('status')) return 'ic-status'
  return 'ic-default'
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true })
}

// ── Avatars ───────────────────────────────────────────────────────────────────
const PALETTE = [
  { bg: '#C0DD97', fg: '#3B6D11' }, { bg: '#B5D4F4', fg: '#185FA5' },
  { bg: '#F4C0D1', fg: '#993556' }, { bg: '#FAEEDA', fg: '#854F0B' },
  { bg: '#CED8F6', fg: '#534AB7' }, { bg: '#9FE1CB', fg: '#0F6E56' },
  { bg: '#F7C1C1', fg: '#A32D2D' }, { bg: '#D3D1C7', fg: '#5F5E5A' },
]

function avatarStyle(i: number) {
  const c = PALETTE[i % PALETTE.length]
  return { background: c.bg, color: c.fg }
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}
</script>

<style scoped>
.team-tab { display: flex; flex-direction: column; gap: 20px; }

.team-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
}
@media (max-width: 700px) { .team-grid { grid-template-columns: 1fr; } }

.card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 10px; padding: 20px;
}
.log-card { padding: 20px; }

/* Card header with edit button */
.card-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.card-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--muted);
}
.btn-edit {
  height: 24px; padding: 0 10px;
  border: 1px solid var(--border2); border-radius: 5px;
  background: transparent; font-family: 'DM Sans', sans-serif;
  font-size: 11px; font-weight: 500; color: var(--muted); cursor: pointer; transition: all 0.15s;
}
.btn-edit:hover { background: var(--surface2); color: var(--text); }

.header-actions { display: flex; gap: 6px; }
.btn-cancel {
  height: 24px; padding: 0 10px;
  border: 1px solid var(--border2); border-radius: 5px;
  background: transparent; font-family: 'DM Sans', sans-serif;
  font-size: 11px; color: var(--muted); cursor: pointer;
}
.btn-save {
  height: 24px; padding: 0 10px;
  border: none; border-radius: 5px;
  background: var(--text); color: #fff;
  font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600;
  cursor: pointer; display: inline-flex; align-items: center; gap: 4px;
}
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

/* Member rows */
.member-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0; border-bottom: 1px solid var(--border);
}
.member-row:last-child { border-bottom: none; }

.avatar {
  width: 38px; height: 38px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; flex-shrink: 0;
}
.member-info { flex: 1; min-width: 0; }
.member-name { font-size: 13.5px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.member-sub  { font-size: 11.5px; color: var(--muted); margin-top: 1px; }
.member-role {
  font-size: 11.5px; color: var(--muted);
  background: var(--bg); border: 1px solid var(--border);
  border-radius: 4px; padding: 2px 8px; white-space: nowrap;
}

/* Edit rows */
.edit-row {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 8px 0; border-bottom: 1px solid var(--border);
}
.edit-row:last-of-type { border-bottom: none; }
.edit-fields { display: flex; flex-direction: column; gap: 5px; flex: 1; }
.edit-input {
  height: 30px; padding: 0 8px;
  border: 1px solid var(--border2); border-radius: 5px;
  background: var(--surface2); font-family: 'DM Sans', sans-serif;
  font-size: 12px; color: var(--text); outline: none; width: 100%;
  transition: border-color 0.15s;
}
.edit-input:focus { border-color: var(--text); }
.btn-remove-row {
  width: 22px; height: 22px; margin-top: 4px; flex-shrink: 0;
  border: none; border-radius: 4px; background: transparent;
  font-size: 11px; color: var(--muted); cursor: pointer; transition: all 0.15s;
}
.btn-remove-row:hover { background: var(--red-bg); color: var(--red); }
.btn-add-row {
  margin-top: 10px; height: 28px; padding: 0 12px;
  border: 1.5px dashed var(--border2); border-radius: 5px;
  background: transparent; font-family: 'DM Sans', sans-serif;
  font-size: 11px; color: var(--muted); cursor: pointer; width: 100%;
  transition: all 0.15s;
}
.btn-add-row:hover { border-color: var(--text); color: var(--text); background: var(--surface2); }
.team-error { margin-top: 8px; font-size: 11px; color: var(--red); }

.empty-msg { font-size: 12.5px; color: var(--muted); padding: 8px 0; }

/* Activity log */
.log-row {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 0; border-bottom: 1px solid var(--border); font-size: 12.5px;
}
.log-row:last-child { border-bottom: none; }

.log-icon {
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-style: normal; font-weight: 700;
}
.ic-upload  { background: #dbeafe; color: #1d4ed8; }
.ic-delete  { background: #fee2e2; color: #b91c1c; }
.ic-update  { background: #d1fae5; color: #065f46; }
.ic-status  { background: #fef3c7; color: #92400e; }
.ic-default { background: var(--surface2); color: var(--muted); }

.log-body { flex: 1; color: var(--text); line-height: 1.4; display: flex; align-items: baseline; gap: 5px; flex-wrap: wrap; }
.log-user   { font-weight: 600; }
.log-action { color: var(--muted); font-size: 12px; }
.log-target { color: var(--accent, #2563eb); font-style: italic; font-size: 12px; }

.log-type-badge {
  font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
  padding: 1px 6px; border-radius: 20px; white-space: nowrap; flex-shrink: 0;
}
.log-type-badge.document { background: #eff6ff; color: #3b82f6; }
.log-type-badge.team     { background: #f0fdf4; color: #16a34a; }
.log-type-badge.risk     { background: #fff7ed; color: #ea580c; }
.log-type-badge.info     { background: var(--surface2); color: var(--muted); }

.log-time { font-size: 11px; color: var(--muted); white-space: nowrap; flex-shrink: 0; }

/* Spinner */
.mini-spinner {
  width: 10px; height: 10px;
  border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
