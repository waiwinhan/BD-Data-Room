<template>
  <div class="error-wrap">
    <div class="error-card">
      <div class="error-logo">
        <div class="logo-mark">BR</div>
        <div class="error-brand">
          <div class="error-brand-name">BRDB Berhad</div>
          <div class="error-brand-sub">Deal Data Room</div>
        </div>
      </div>

      <div class="error-divider"></div>

      <div class="error-code">{{ error.statusCode }}</div>
      <div class="error-title">{{ errorTitle }}</div>
      <div class="error-message">{{ errorMessage }}</div>

      <div class="error-actions">
        <button class="btn-primary" @click="handleError">← Back to Deal List</button>
        <button class="btn-sm" @click="clearError({ redirect: '/login' })">Login</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; message?: string } }>()

const errorTitle = computed(() => {
  if (props.error.statusCode === 404) return 'Deal Not Found'
  if (props.error.statusCode === 401) return 'Access Denied'
  if (props.error.statusCode === 403) return 'Forbidden'
  return 'Something Went Wrong'
})

const errorMessage = computed(() => {
  if (props.error.statusCode === 404) return 'The deal you\'re looking for doesn\'t exist or has been removed from the data room.'
  if (props.error.statusCode === 401) return 'You don\'t have permission to access this resource. Please log in.'
  return props.error.message ?? 'An unexpected error occurred. Please try again or contact your administrator.'
})

function handleError() {
  clearError({ redirect: '/' })
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

.error-wrap {
  min-height: 100vh;
  background: #F4F2EE;
  display: flex; align-items: center; justify-content: center;
  font-family: 'DM Sans', sans-serif;
  padding: 24px;
}
.error-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 14px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  padding: 36px 40px;
  width: 100%; max-width: 420px;
  display: flex; flex-direction: column; gap: 16px;
  text-align: center;
}
.error-logo { display: flex; align-items: center; gap: 12px; justify-content: center; }
.logo-mark {
  width: 34px; height: 34px;
  background: #1A1916; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #fff;
}
.error-brand-name { font-size: 14px; font-weight: 700; color: #1A1916; text-align: left; }
.error-brand-sub  { font-size: 11px; color: #7A7770; text-align: left; }
.error-divider { height: 1px; background: rgba(0,0,0,0.07); }
.error-code { font-size: 48px; font-weight: 700; color: rgba(0,0,0,0.08); line-height: 1; }
.error-title { font-size: 18px; font-weight: 700; color: #1A1916; margin-top: -8px; }
.error-message { font-size: 13px; color: #7A7770; line-height: 1.6; }
.error-actions { display: flex; gap: 8px; justify-content: center; margin-top: 4px; }
.btn-primary {
  height: 36px; padding: 0 16px;
  background: #1A1916; color: #fff; border: none;
  border-radius: 8px; font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: opacity 0.15s;
}
.btn-primary:hover { opacity: 0.82; }
.btn-sm {
  height: 36px; padding: 0 14px;
  border: 1px solid rgba(0,0,0,0.14); border-radius: 8px;
  background: transparent; font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 500; color: #7A7770; cursor: pointer; transition: all 0.15s;
}
.btn-sm:hover { background: #F4F2EE; color: #1A1916; }
</style>
