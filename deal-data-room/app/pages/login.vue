<template>
  <div class="login-wrap">
    <div class="login-card">

      <!-- Logo -->
      <div class="login-logo">
        <div class="logo-mark">{{ initials }}</div>
        <div class="login-brand">
          <div class="login-brand-name">{{ roomName }}</div>
          <div class="login-brand-sub">Deal Data Room</div>
        </div>
      </div>

      <div class="login-divider"></div>

      <!-- NDA Notice -->
      <div class="nda-notice">
        <div class="nda-icon">⚠</div>
        <div class="nda-text">
          <strong>Confidential Access Only.</strong>
          By entering this data room, you confirm that you are bound by a
          Non-Disclosure Agreement with {{ roomName }} and are authorised
          to access this material.
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="submit">
        <div class="field-label">Access Password</div>
        <div class="pwd-wrap">
          <input
            ref="inputRef"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="login-input"
            :class="{ 'login-input--error': error }"
            placeholder="Enter data room password"
            autocomplete="current-password"
            @input="error = ''"
          />
          <button type="button" class="pwd-eye" @click="showPassword = !showPassword">
            <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        <div v-if="error" class="login-error">{{ error }}</div>

        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading" class="login-spinner"></span>
          {{ loading ? 'Verifying…' : 'Enter Data Room' }}
        </button>
      </form>

      <div class="login-footer">
        Access issues? Contact your deal team administrator.
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const password     = ref('')
const error        = ref('')
const loading      = ref(false)
const showPassword = ref(false)
const inputRef     = ref<HTMLInputElement | null>(null)

const roomName = ref('BRDB Berhad')
const initials = computed(() =>
  roomName.value.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
)

const { fetch: refreshSession } = useUserSession()

onMounted(async () => {
  inputRef.value?.focus()
  try {
    const s = await $fetch('/api/settings') as any
    if (s.roomName) roomName.value = s.roomName
  } catch {}
})

async function submit() {
  if (!password.value) { error.value = 'Please enter the access password.'; return }
  loading.value = true
  error.value   = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { password: password.value } })
    // Refresh session state client-side before navigating so middleware sees it
    await refreshSession()
    await navigateTo('/')
  } catch (err: any) {
    error.value = err?.data?.message ?? 'Incorrect password. Please try again.'
    password.value = ''
    nextTick(() => inputRef.value?.focus())
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  background: #F4F2EE;
  display: flex; align-items: center; justify-content: center;
  font-family: 'DM Sans', sans-serif;
  padding: 24px;
}

.login-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 14px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05);
  padding: 36px 40px;
  width: 100%; max-width: 420px;
  display: flex; flex-direction: column; gap: 20px;
}

.login-logo { display: flex; align-items: center; gap: 12px; }
.logo-mark {
  width: 38px; height: 38px;
  background: #1A1916; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #fff; letter-spacing: 0.04em;
  flex-shrink: 0;
}
.login-brand-name { font-size: 15px; font-weight: 700; color: #1A1916; }
.login-brand-sub  { font-size: 12px; color: #7A7770; }

.login-divider { height: 1px; background: rgba(0,0,0,0.07); }

.nda-notice {
  display: flex; gap: 12px; align-items: flex-start;
  background: #FEF3E2;
  border: 1px solid rgba(133,79,11,0.18);
  border-radius: 8px;
  padding: 12px 14px;
}
.nda-icon { font-size: 14px; color: #854F0B; flex-shrink: 0; margin-top: 1px; }
.nda-text { font-size: 12px; color: #854F0B; line-height: 1.55; }
.nda-text strong { font-weight: 600; }

.field-label { font-size: 11px; font-weight: 600; color: #7A7770; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 6px; }

.login-input {
  width: 100%; height: 40px;
  border: 1px solid rgba(0,0,0,0.14); border-radius: 8px;
  padding: 0 14px; font-size: 14px; font-family: 'DM Sans', sans-serif;
  background: #fff; color: #1A1916; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.login-input:focus { border-color: #185FA5; box-shadow: 0 0 0 3px rgba(24,95,165,0.12); }
.login-input--error { border-color: #A32D2D; }
.login-input--error:focus { box-shadow: 0 0 0 3px rgba(163,45,45,0.12); }

.login-error { font-size: 12px; color: #A32D2D; margin-top: 6px; }

.login-btn {
  width: 100%; height: 42px; margin-top: 14px;
  background: #1A1916; color: #fff; border: none;
  border-radius: 8px; font-family: 'DM Sans', sans-serif;
  font-size: 14px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: opacity 0.15s;
}
.login-btn:hover:not(:disabled) { opacity: 0.82; }
.login-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.login-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.login-footer { font-size: 11.5px; color: #B0ADA8; text-align: center; }

.pwd-wrap { position: relative; }
.pwd-wrap .login-input { padding-right: 42px; }
.pwd-eye {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  border: none; background: transparent; padding: 0; cursor: pointer;
  color: #B0ADA8; display: flex; align-items: center; transition: color 0.15s;
}
.pwd-eye:hover { color: #1A1916; }
</style>
