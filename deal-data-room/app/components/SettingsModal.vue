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
            </div>

            <!-- ── SECURITY ── -->
            <div v-if="activeTab === 'security'">
              <div class="info-box">
                This is a shared password used by all authorised users to access the data room.
              </div>
              <div class="field" style="margin-top:16px">
                <label class="field-label">Current Password</label>
                <div class="pwd-wrap">
                  <input v-model="pwd.current" :type="showPwd.current ? 'text' : 'password'" class="field-input" placeholder="Enter current password" autocomplete="current-password" />
                  <button type="button" class="pwd-eye" @click="showPwd.current = !showPwd.current">
                    <svg v-if="showPwd.current" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>
              <div class="field" style="margin-top:14px">
                <label class="field-label">New Password</label>
                <div class="pwd-wrap">
                  <input v-model="pwd.next" :type="showPwd.next ? 'text' : 'password'" class="field-input" placeholder="Min. 6 characters" autocomplete="new-password" />
                  <button type="button" class="pwd-eye" @click="showPwd.next = !showPwd.next">
                    <svg v-if="showPwd.next" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>
              <div class="field" style="margin-top:14px">
                <label class="field-label">Confirm New Password</label>
                <div class="pwd-wrap">
                  <input v-model="pwd.confirm" :type="showPwd.confirm ? 'text' : 'password'" class="field-input" placeholder="Repeat new password" autocomplete="new-password" />
                  <button type="button" class="pwd-eye" @click="showPwd.confirm = !showPwd.confirm">
                    <svg v-if="showPwd.confirm" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>

              <div v-if="pwdError" class="form-error" style="margin-top:14px">{{ pwdError }}</div>
              <div v-if="pwdSuccess" class="form-success" style="margin-top:14px">Password updated successfully.</div>

              <div class="section-actions">
                <button class="btn-submit" :disabled="saving" @click="savePassword">
                  <span v-if="saving" class="spinner"></span>
                  <span v-else>Update Password</span>
                </button>
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
                <div class="field-hint">New deals will default to this hurdle rate. BRDB standard is 15%.</div>
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
  { id: 'branding',  label: 'Branding'  },
  { id: 'security',  label: 'Security'  },
  { id: 'defaults',  label: 'Defaults'  },
]
const activeTab = ref('branding')

const saving         = ref(false)
const brandError     = ref('')
const brandSuccess   = ref(false)
const pwdError       = ref('')
const pwdSuccess     = ref(false)
const defaultsError  = ref('')
const defaultsSuccess = ref(false)

const form    = reactive({ roomName: '', logoDataUrl: '', defaultHurdleRate: 15 })
const pwd     = reactive({ current: '', next: '', confirm: '' })
const showPwd = reactive({ current: false, next: false, confirm: false })

const logoInput = ref<HTMLInputElement>()

const initials = computed(() =>
  (form.roomName || 'BR').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
)

// Load settings when modal opens
watch(() => props.show, async (v) => {
  if (!v) return
  activeTab.value = 'branding'
  brandError.value = ''; brandSuccess.value = false
  pwdError.value   = ''; pwdSuccess.value   = false
  defaultsError.value = ''; defaultsSuccess.value = false
  pwd.current = ''; pwd.next = ''; pwd.confirm = ''
  try {
    const s = await $fetch('/api/settings') as any
    form.roomName         = s.roomName         ?? 'BRDB Berhad'
    form.logoDataUrl      = s.logoDataUrl       ?? ''
    form.defaultHurdleRate = s.defaultHurdleRate ?? 15
  } catch {}
})

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
    brandError.value = err.data?.statusMessage || err.statusMessage || err.message || 'Failed to save.'
  } finally {
    saving.value = false
  }
}

// ── Save password ────────────────────────────────────────────────────────────
async function savePassword() {
  pwdError.value = ''; pwdSuccess.value = false
  if (!pwd.current) { pwdError.value = 'Enter your current password.'; return }
  if (pwd.next.length < 6) { pwdError.value = 'New password must be at least 6 characters.'; return }
  if (pwd.next !== pwd.confirm) { pwdError.value = 'Passwords do not match.'; return }
  saving.value = true
  try {
    await $fetch('/api/settings', { method: 'PUT', body: { currentPassword: pwd.current, newPassword: pwd.next } })
    pwdSuccess.value = true
    pwd.current = ''; pwd.next = ''; pwd.confirm = ''
    setTimeout(() => { pwdSuccess.value = false }, 3000)
  } catch (err: any) {
    pwdError.value = err.data?.statusMessage || err.statusMessage || err.message || 'Failed to update password.'
  } finally {
    saving.value = false
  }
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
    defaultsError.value = err.data?.statusMessage || err.statusMessage || err.message || 'Failed to save.'
  } finally {
    saving.value = false
  }
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
  width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto;
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

/* Password toggle */
.pwd-wrap { position: relative; }
.pwd-wrap .field-input { padding-right: 36px; }
.pwd-eye {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  border: none; background: transparent; padding: 0; cursor: pointer;
  color: var(--muted); display: flex; align-items: center; transition: color 0.15s;
}
.pwd-eye:hover { color: var(--text); }

/* Info box */
.info-box {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 10px 12px;
  font-size: 12px; color: var(--muted); line-height: 1.5;
}

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
