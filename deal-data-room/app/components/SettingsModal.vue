<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
        <div class="modal">

          <!-- Header -->
          <div class="modal-header">
            <div>
              <div class="modal-title">Settings</div>
              <div class="modal-sub">Manage branding, security, and deal defaults</div>
            </div>
            <button class="modal-close" @click="$emit('close')">✕</button>
          </div>

          <!-- Tab nav -->
          <div class="tab-nav">
            <button
              v-for="t in tabs" :key="t.id"
              class="tab-btn" :class="{ active: activeTab === t.id }"
              @click="activeTab = t.id"
            >{{ t.label }}</button>
          </div>

          <div class="modal-body">

            <!-- ── BRANDING ── -->
            <div v-if="activeTab === 'branding'">
              <!-- Non-admin lock -->
              <div v-if="sessionLabel !== 'Admin'" class="lock-notice">
                🔒 You are logged in as <strong>{{ sessionLabel }}</strong>. Only Admin can change branding.
              </div>

              <template v-else>
                <div class="field">
                  <label class="field-label">Room Name</label>
                  <input v-model="form.roomName" class="field-input" placeholder="e.g. Wai Berhad" />
                </div>

                <div class="field" style="margin-top:14px">
                  <label class="field-label">Logo</label>
                  <div class="logo-area">
                    <div class="logo-preview">
                      <img v-if="form.logoDataUrl" :src="form.logoDataUrl" alt="logo" class="logo-img" />
                      <div v-else class="logo-placeholder">{{ initials }}</div>
                    </div>
                    <div class="logo-actions">
                      <button class="btn-upload" @click="triggerLogoUpload">Upload Logo</button>
                      <button v-if="form.logoDataUrl" class="btn-remove" @click="form.logoDataUrl = ''">Remove</button>
                      <input ref="logoInput" type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style="display:none" @change="handleLogoFile" />
                      <div class="logo-hint">PNG, JPG or SVG · Max 2 MB · Displayed at 30×30 px</div>
                    </div>
                  </div>
                </div>

                <div v-if="brandError" class="form-error" style="margin-top:14px">{{ brandError }}</div>
                <div v-if="brandSuccess" class="form-success" style="margin-top:14px">Branding saved.</div>

                <div class="section-actions">
                  <button class="btn-submit" :disabled="saving" @click="saveBranding">
                    <span v-if="saving" class="spinner"></span>
                    <span v-else>Save Branding</span>
                  </button>
                </div>
              </template>
            </div>

            <!-- ── SECURITY ── -->
            <div v-if="activeTab === 'security'">
              <div class="info-box">
                Each password slot grants full access to the data room. Only the <strong>Admin</strong> account can manage passwords.
              </div>

              <!-- Non-admin lock message -->
              <div v-if="sessionLabel !== 'Admin'" class="lock-notice">
                🔒 You are logged in as <strong>{{ sessionLabel }}</strong>. Password management is restricted to Admin only.
              </div>

              <!-- Admin-only section -->
              <template v-else>
                <!-- Admin password verification -->
                <div class="verify-box">
                  <div class="field">
                    <label class="field-label">Confirm Admin Password</label>
                    <div class="pwd-wrap">
                      <input
                        v-model="adminConfirmPwd"
                        :type="showAdminPwd ? 'text' : 'password'"
                        class="field-input"
                        placeholder="Enter your Admin password to make changes"
                      />
                      <button type="button" class="pwd-eye" @click="showAdminPwd = !showAdminPwd">
                        <svg v-if="showAdminPwd" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </div>
                    <div class="field-hint">Required before adding, editing, or removing any password.</div>
                  </div>
                </div>

                <!-- Password slots list -->
                <div class="slots-header">
                  <span class="field-label">Access Passwords</span>
                  <button class="btn-add-slot" @click="showAddForm = !showAddForm">
                    {{ showAddForm ? 'Cancel' : '+ Add Password' }}
                  </button>
                </div>

                <!-- Add password form -->
                <div v-if="showAddForm" class="slot-form">
                  <div class="slot-form-row">
                    <div class="field" style="flex:1">
                      <label class="field-label">Label</label>
                      <input v-model="addForm.label" class="field-input" placeholder="e.g. Investor, Partner" />
                    </div>
                    <div class="field" style="flex:1.5">
                      <label class="field-label">New Password</label>
                      <div class="pwd-wrap">
                        <input v-model="addForm.password" :type="showAddPwd ? 'text' : 'password'" class="field-input" placeholder="Min. 6 characters" />
                        <button type="button" class="pwd-eye" @click="showAddPwd = !showAddPwd">
                          <svg v-if="showAddPwd" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div v-if="addError" class="form-error" style="margin-top:8px">{{ addError }}</div>
                  <div class="slot-form-actions">
                    <button class="btn-submit" :disabled="saving" style="height:30px;font-size:12px;padding:0 14px" @click="addPasswordSlot">
                      <span v-if="saving" class="spinner"></span>
                      <span v-else>Save</span>
                    </button>
                  </div>
                </div>

                <!-- Slots list -->
                <div class="slots-list">
                  <div v-for="slot in passwordSlots" :key="slot.label" class="slot-row">
                    <template v-if="editingSlot === slot.label">
                      <!-- Edit mode -->
                      <div class="slot-edit-row">
                        <div class="field" style="flex:1">
                          <label class="field-label">Label</label>
                          <input v-model="editForm.newLabel" class="field-input field-input-sm" :disabled="slot.label === 'Admin'" />
                        </div>
                        <div class="field" style="flex:1.5">
                          <label class="field-label">New Password <span style="font-weight:400;text-transform:none">(leave blank to keep)</span></label>
                          <div class="pwd-wrap">
                            <input v-model="editForm.newPassword" :type="showEditPwd ? 'text' : 'password'" class="field-input field-input-sm" placeholder="New password (optional)" />
                            <button type="button" class="pwd-eye" @click="showEditPwd = !showEditPwd">
                              <svg v-if="showEditPwd" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                              <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div v-if="editError" class="form-error" style="margin-top:6px;font-size:11px">{{ editError }}</div>
                      <div class="slot-edit-actions">
                        <button class="btn-ghost" @click="cancelEdit">Cancel</button>
                        <button class="btn-submit" :disabled="saving" style="height:28px;font-size:12px;padding:0 12px" @click="saveSlotEdit(slot.label)">
                          <span v-if="saving" class="spinner"></span>
                          <span v-else>Save</span>
                        </button>
                      </div>
                    </template>
                    <template v-else>
                      <!-- View mode -->
                      <div class="slot-info">
                        <span class="slot-label">{{ slot.label }}</span>
                        <span v-if="slot.label === 'Admin'" class="slot-admin-badge">Admin</span>
                        <span class="slot-pwd">••••••••</span>
                      </div>
                      <div class="slot-actions">
                        <button class="btn-ghost" @click="startEdit(slot.label)">Edit</button>
                        <button
                          v-if="slot.label !== 'Admin'"
                          class="btn-danger-ghost"
                          @click="removeSlot(slot.label)"
                        >Remove</button>
                      </div>
                    </template>
                  </div>
                </div>

                <div v-if="securitySuccess" class="form-success" style="margin-top:14px">{{ securitySuccess }}</div>
                <div v-if="securityError"  class="form-error"   style="margin-top:14px">{{ securityError }}</div>
              </template>
            </div>

            <!-- ── ACCESS LOG ── -->
            <div v-if="activeTab === 'access-log'">
              <div class="log-toolbar">
                <span class="field-label" style="margin:0">Last 100 login attempts</span>
                <button class="btn-ghost" @click="loadLog">↻ Refresh</button>
              </div>
              <div v-if="logLoading" class="log-empty">Loading…</div>
              <div v-else-if="!accessLog.length" class="log-empty">No login attempts recorded yet.</div>
              <div v-else class="log-table-wrap">
                <table class="log-table">
                  <thead>
                    <tr>
                      <th>Date / Time</th>
                      <th>Label</th>
                      <th>IP Address</th>
                      <th>Browser</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in accessLog" :key="row.id" :class="{ 'row-fail': !row.success }">
                      <td class="log-date">{{ formatDate(row.created_at) }}</td>
                      <td><span class="slot-badge">{{ row.label }}</span></td>
                      <td class="log-ip">{{ row.ip }}</td>
                      <td class="log-ua">{{ parseUA(row.user_agent) }}</td>
                      <td>
                        <span class="status-badge" :class="row.success ? 'ok' : 'fail'">
                          {{ row.success ? '✓ Success' : '✗ Failed' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- ── DEFAULTS ── -->
            <div v-if="activeTab === 'defaults'">
              <div class="info-box">
                These values pre-fill the "Add New Deal" form. You can always override per deal.
              </div>
              <div class="field" style="margin-top:16px">
                <label class="field-label">Default Hurdle IRR (%)</label>
                <div class="input-with-unit">
                  <input v-model="form.defaultHurdleRate" type="number" min="0" max="100" step="0.5" class="field-input" />
                  <span class="unit-label">%</span>
                </div>
                <div class="field-hint">New deals will default to this hurdle rate. Standard is 15%.</div>
              </div>

              <div v-if="defaultsError" class="form-error" style="margin-top:14px">{{ defaultsError }}</div>
              <div v-if="defaultsSuccess" class="form-success" style="margin-top:14px">Defaults saved.</div>

              <div class="section-actions">
                <button class="btn-submit" :disabled="saving" @click="saveDefaults">
                  <span v-if="saving" class="spinner"></span>
                  <span v-else>Save Defaults</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ show: boolean }>()
const emit  = defineEmits<{ close: [], updated: [] }>()

const tabs = [
  { id: 'branding',   label: 'Branding'   },
  { id: 'security',   label: 'Security'   },
  { id: 'access-log', label: 'Access Log' },
  { id: 'defaults',   label: 'Defaults'   },
]
const activeTab = ref('branding')

const saving         = ref(false)
const brandError     = ref('')
const brandSuccess   = ref(false)
const defaultsError  = ref('')
const defaultsSuccess = ref(false)

// Security
const { session }    = useUserSession()
const sessionLabel   = computed(() => (session.value as any)?.user?.label ?? '')
const passwordSlots  = ref<{ label: string }[]>([])
const securityError  = ref('')
const securitySuccess = ref('')
const showAddForm    = ref(false)
const addForm        = reactive({ label: '', password: '' })
const addError       = ref('')
const editingSlot    = ref('')
const editForm       = reactive({ newLabel: '', newPassword: '' })
const editError      = ref('')
const adminConfirmPwd = ref('')
const showAdminPwd   = ref(false)
const showAddPwd     = ref(false)
const showEditPwd    = ref(false)

// Access log
const accessLog  = ref<any[]>([])
const logLoading = ref(false)

const form    = reactive({ roomName: '', logoDataUrl: '', defaultHurdleRate: 15 })
const logoInput = ref<HTMLInputElement>()

const initials = computed(() =>
  (form.roomName || 'BR').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
)

// Load settings when modal opens or tab changes
watch(() => props.show, async (v) => {
  if (!v) return
  activeTab.value = 'branding'
  resetMessages()
  await loadSettings()
})

watch(activeTab, async (tab) => {
  if (tab === 'access-log') await loadLog()
})

function resetMessages() {
  brandError.value = ''; brandSuccess.value = false
  defaultsError.value = ''; defaultsSuccess.value = false
  securityError.value = ''; securitySuccess.value = ''
  showAddForm.value = false; editingSlot.value = ''
  addForm.label = ''; addForm.password = ''
  addError.value = ''; editError.value = ''
  adminConfirmPwd.value = ''; showAdminPwd.value = false
  showAddPwd.value = false; showEditPwd.value = false
}

async function loadSettings() {
  try {
    const s = await $fetch('/api/settings') as any
    form.roomName          = s.roomName         ?? 'Deal Data Room'
    form.logoDataUrl       = s.logoDataUrl       ?? ''
    form.defaultHurdleRate = s.defaultHurdleRate ?? 15
    passwordSlots.value    = s.passwordSlots     ?? [{ label: 'Admin' }]
  } catch {}
}

async function loadLog() {
  logLoading.value = true
  try {
    accessLog.value = await $fetch('/api/auth/access-log') as any[]
  } catch { accessLog.value = [] }
  finally { logLoading.value = false }
}

// Close on Escape
onMounted(() => {
  const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && props.show) emit('close') }
  window.addEventListener('keydown', handler)
  onUnmounted(() => window.removeEventListener('keydown', handler))
})

// ── Logo upload ──────────────────────────────────────────────────────────────
function triggerLogoUpload() { logoInput.value?.click() }

function handleLogoFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) { brandError.value = 'Logo must be under 2 MB.'; return }
  const reader = new FileReader()
  reader.onload = () => { form.logoDataUrl = reader.result as string }
  reader.readAsDataURL(file)
  if (logoInput.value) logoInput.value.value = ''
}

// ── Save branding ────────────────────────────────────────────────────────────
async function saveBranding() {
  brandError.value = ''; brandSuccess.value = false
  if (!form.roomName.trim()) { brandError.value = 'Room name cannot be empty.'; return }
  saving.value = true
  try {
    await $fetch('/api/settings', { method: 'PUT', body: { roomName: form.roomName, logoDataUrl: form.logoDataUrl } })
    brandSuccess.value = true
    emit('updated')
    setTimeout(() => { brandSuccess.value = false }, 3000)
  } catch (err: any) {
    brandError.value = err.data?.statusMessage || err.message || 'Failed to save.'
  } finally { saving.value = false }
}

// ── Password slot management ─────────────────────────────────────────────────
async function addPasswordSlot() {
  addError.value = ''
  if (!adminConfirmPwd.value) { addError.value = 'Enter your Admin password above to confirm.'; return }
  if (!addForm.label.trim())  { addError.value = 'Label is required.'; return }
  if (addForm.password.length < 6) { addError.value = 'Password must be at least 6 characters.'; return }
  saving.value = true
  try {
    await $fetch('/api/settings', { method: 'PUT', body: {
      adminPassword: adminConfirmPwd.value,
      addPassword: { label: addForm.label.trim(), password: addForm.password },
    }})
    await loadSettings()
    showAddForm.value = false
    addForm.label = ''; addForm.password = ''
    securitySuccess.value = 'Password added.'
    setTimeout(() => { securitySuccess.value = '' }, 3000)
  } catch (err: any) {
    addError.value = err.data?.statusMessage || err.message || 'Failed to add.'
  } finally { saving.value = false }
}

function startEdit(label: string) {
  editingSlot.value = label
  editForm.newLabel = label
  editForm.newPassword = ''
  editError.value = ''
  showEditPwd.value = false
}

function cancelEdit() {
  editingSlot.value = ''
  editError.value = ''
}

async function saveSlotEdit(label: string) {
  editError.value = ''
  if (!adminConfirmPwd.value) { editError.value = 'Enter your Admin password above to confirm.'; return }
  if (!editForm.newLabel.trim()) { editError.value = 'Label cannot be empty.'; return }
  if (editForm.newPassword && editForm.newPassword.length < 6) { editError.value = 'Password must be at least 6 characters.'; return }
  saving.value = true
  try {
    await $fetch('/api/settings', {
      method: 'PUT',
      body: {
        adminPassword: adminConfirmPwd.value,
        updatePassword: { label, newLabel: editForm.newLabel, newPassword: editForm.newPassword || undefined },
      },
    })
    await loadSettings()
    editingSlot.value = ''
    securitySuccess.value = 'Password updated.'
    setTimeout(() => { securitySuccess.value = '' }, 3000)
  } catch (err: any) {
    editError.value = err.data?.statusMessage || err.message || 'Failed to update.'
  } finally { saving.value = false }
}

async function removeSlot(label: string) {
  if (!adminConfirmPwd.value) { securityError.value = 'Enter your Admin password above to confirm.'; return }
  if (!confirm(`Remove "${label}" password? Users with this password will be locked out.`)) return
  securityError.value = ''
  saving.value = true
  try {
    await $fetch('/api/settings', { method: 'PUT', body: { adminPassword: adminConfirmPwd.value, removePassword: label } })
    await loadSettings()
    securitySuccess.value = `"${label}" removed.`
    setTimeout(() => { securitySuccess.value = '' }, 3000)
  } catch (err: any) {
    securityError.value = err.data?.statusMessage || err.message || 'Failed to remove.'
  } finally { saving.value = false }
}

// ── Save defaults ────────────────────────────────────────────────────────────
async function saveDefaults() {
  defaultsError.value = ''; defaultsSuccess.value = false
  const rate = parseFloat(String(form.defaultHurdleRate))
  if (isNaN(rate) || rate < 0 || rate > 100) { defaultsError.value = 'Enter a valid rate between 0 and 100.'; return }
  saving.value = true
  try {
    await $fetch('/api/settings', { method: 'PUT', body: { defaultHurdleRate: rate } })
    defaultsSuccess.value = true
    setTimeout(() => { defaultsSuccess.value = false }, 3000)
  } catch (err: any) {
    defaultsError.value = err.data?.statusMessage || err.message || 'Failed to save.'
  } finally { saving.value = false }
}

// ── Access log helpers ────────────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
}

function parseUA(ua: string) {
  if (!ua) return '—'
  if (/iPhone|iPad|iOS/.test(ua))   return ua.includes('Safari') ? 'Safari / iOS'   : 'iOS'
  if (/Android/.test(ua))           return ua.includes('Chrome') ? 'Chrome / Android' : 'Android'
  if (/Edg\//.test(ua))             return 'Edge'
  if (/Chrome\//.test(ua))          return 'Chrome'
  if (/Firefox\//.test(ua))         return 'Firefox'
  if (/Safari\//.test(ua))          return 'Safari'
  return ua.slice(0, 40)
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(26,25,22,0.55); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.modal {
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.18);
  width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto;
}

/* Header */
.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid var(--border);
}
.modal-title { font-size: 16px; font-weight: 600; color: var(--text); letter-spacing: -0.3px; }
.modal-sub   { font-size: 12px; color: var(--muted); margin-top: 3px; }
.modal-close {
  width: 28px; height: 28px; border-radius: 6px;
  border: 1px solid var(--border2); background: transparent;
  font-size: 12px; color: var(--muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0;
}
.modal-close:hover { background: var(--surface2); color: var(--text); }

/* Tab nav */
.tab-nav {
  display: flex; gap: 0; padding: 0 24px;
  border-bottom: 1px solid var(--border);
}
.tab-btn {
  height: 38px; padding: 0 14px; border: none; background: transparent;
  font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
  color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent;
  margin-bottom: -1px; transition: all 0.15s;
}
.tab-btn:hover { color: var(--text); }
.tab-btn.active { color: var(--text); border-bottom-color: var(--text); font-weight: 600; }

/* Body */
.modal-body { padding: 20px 24px 24px; }

/* Fields */
.field        { display: flex; flex-direction: column; gap: 5px; }
.field-label  { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
.field-input  {
  height: 34px; padding: 0 10px;
  border: 1.5px solid var(--border2); border-radius: var(--radius-sm);
  background: var(--surface2); font-family: 'DM Sans', sans-serif;
  font-size: 13px; color: var(--text); outline: none; width: 100%;
  transition: border-color 0.15s;
}
.field-input-sm { height: 30px; font-size: 12px; }
.field-input:focus { border-color: var(--text); }
.field-hint { font-size: 11px; color: var(--faint); margin-top: 4px; }

.input-with-unit { position: relative; }
.input-with-unit .field-input { padding-right: 32px; }
.unit-label {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  font-size: 12px; color: var(--muted); pointer-events: none;
}

/* Logo area */
.logo-area { display: flex; align-items: center; gap: 16px; }
.logo-preview {
  width: 56px; height: 56px; border-radius: 10px;
  border: 1.5px solid var(--border2); background: var(--surface2);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden;
}
.logo-img { width: 100%; height: 100%; object-fit: contain; }
.logo-placeholder { font-size: 14px; font-weight: 700; color: var(--text); letter-spacing: 0.04em; }
.logo-actions { display: flex; flex-direction: column; gap: 6px; }
.btn-upload {
  height: 30px; padding: 0 12px;
  border: 1.5px solid var(--border2); border-radius: var(--radius-sm);
  background: transparent; font-family: 'DM Sans', sans-serif;
  font-size: 12px; font-weight: 500; color: var(--text); cursor: pointer; transition: all 0.15s;
}
.btn-upload:hover { background: var(--surface2); }
.btn-remove {
  height: 26px; padding: 0 10px; border: none; border-radius: var(--radius-sm);
  background: transparent; font-family: 'DM Sans', sans-serif;
  font-size: 11px; color: var(--red); cursor: pointer;
}
.btn-remove:hover { background: var(--red-bg); }
.logo-hint { font-size: 11px; color: var(--faint); }

/* Info box */
.info-box {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 10px 12px;
  font-size: 12px; color: var(--muted); line-height: 1.5;
}

/* Lock notice */
.lock-notice {
  margin-top: 14px; padding: 12px 14px;
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: var(--radius-sm); font-size: 13px; color: var(--muted); line-height: 1.5;
}

/* Admin verify box */
.verify-box {
  margin-top: 14px; padding: 12px 14px;
  background: var(--surface2); border: 1px solid var(--border2);
  border-radius: var(--radius-sm);
}

/* Password toggle */
.pwd-wrap { position: relative; }
.pwd-wrap .field-input { padding-right: 36px; }
.pwd-eye {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  border: none; background: transparent; padding: 0; cursor: pointer;
  color: var(--muted); display: flex; align-items: center; transition: color 0.15s;
}
.pwd-eye:hover { color: var(--text); }

/* Admin badge */
.slot-admin-badge {
  display: inline-block; padding: 1px 6px; border-radius: 20px;
  background: #1a1a1a; color: #fff;
  font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
}

/* Slots */
.slots-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 16px; margin-bottom: 8px;
}
.btn-add-slot {
  height: 26px; padding: 0 10px;
  border: 1.5px solid var(--border2); border-radius: var(--radius-sm);
  background: transparent; font-family: 'DM Sans', sans-serif;
  font-size: 11px; font-weight: 600; color: var(--text); cursor: pointer; transition: all 0.15s;
}
.btn-add-slot:hover { background: var(--surface2); }

.slot-form {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 12px; margin-bottom: 10px;
}
.slot-form-row { display: flex; gap: 10px; }
.slot-form-actions { display: flex; justify-content: flex-end; margin-top: 10px; }

.slots-list { display: flex; flex-direction: column; gap: 6px; }
.slot-row {
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  padding: 10px 12px; background: var(--surface2);
}
.slot-info { display: flex; align-items: center; gap: 12px; }
.slot-label { font-size: 13px; font-weight: 600; color: var(--text); }
.slot-pwd   { font-size: 12px; color: var(--faint); letter-spacing: 0.1em; }
.slot-actions { display: flex; gap: 6px; margin-top: 8px; justify-content: flex-end; }
.slot-edit-row { display: flex; gap: 10px; }
.slot-edit-actions { display: flex; gap: 6px; justify-content: flex-end; margin-top: 8px; }

.btn-ghost {
  height: 26px; padding: 0 10px; border: 1px solid var(--border2); border-radius: var(--radius-sm);
  background: transparent; font-family: 'DM Sans', sans-serif;
  font-size: 11px; color: var(--muted); cursor: pointer; transition: all 0.15s;
}
.btn-ghost:hover { background: var(--surface); color: var(--text); }
.btn-danger-ghost {
  height: 26px; padding: 0 10px; border: 1px solid transparent; border-radius: var(--radius-sm);
  background: transparent; font-family: 'DM Sans', sans-serif;
  font-size: 11px; color: var(--red); cursor: pointer; transition: all 0.15s;
}
.btn-danger-ghost:hover:not(:disabled) { background: var(--red-bg); }
.btn-danger-ghost:disabled { opacity: 0.35; cursor: not-allowed; }

/* Access log */
.log-toolbar {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;
}
.log-empty { text-align: center; padding: 32px 0; font-size: 13px; color: var(--faint); }
.log-table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius-sm); }
.log-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.log-table th {
  padding: 8px 10px; text-align: left;
  font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--muted); background: var(--surface2); border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.log-table td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.log-table tbody tr:last-child td { border-bottom: none; }
.log-table tbody tr.row-fail { background: var(--red-bg); }
.log-date { white-space: nowrap; color: var(--muted); font-size: 11px; }
.log-ip   { font-family: monospace; font-size: 11px; color: var(--muted); }
.log-ua   { color: var(--muted); font-size: 11px; white-space: nowrap; }

.slot-badge {
  display: inline-block; padding: 2px 7px; border-radius: 20px;
  background: var(--surface); border: 1px solid var(--border2);
  font-size: 11px; font-weight: 600; color: var(--text);
}
.status-badge {
  display: inline-block; padding: 2px 7px; border-radius: 20px;
  font-size: 11px; font-weight: 600;
}
.status-badge.ok   { background: var(--green-bg); color: var(--green-txt); }
.status-badge.fail { background: var(--red-bg);   color: var(--red); }

/* Feedback */
.form-error {
  font-size: 12px; color: var(--red); background: var(--red-bg);
  border: 1px solid rgba(163,45,45,0.2); border-radius: var(--radius-sm); padding: 8px 12px;
}
.form-success {
  font-size: 12px; color: var(--green-txt); background: var(--green-bg);
  border: 1px solid rgba(29,158,117,0.2); border-radius: var(--radius-sm); padding: 8px 12px;
}

/* Actions */
.section-actions { display: flex; justify-content: flex-end; margin-top: 20px; }
.btn-submit {
  height: 34px; padding: 0 18px; border: none; border-radius: var(--radius-sm);
  background: var(--text); color: #fff;
  font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s; display: inline-flex; align-items: center; gap: 6px;
}
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

/* Spinner */
.spinner {
  width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Transition */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s, transform 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.97) translateY(8px); }
.modal-enter-to, .modal-leave-from { opacity: 1; transform: scale(1) translateY(0); }
</style>
