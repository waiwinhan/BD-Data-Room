<template>
  <Teleport to="body">
    <Transition name="welcome-fade">
      <div v-if="visible" class="welcome-overlay" @click.self="close">
        <div class="welcome-modal">
          <button class="welcome-close" @click="close" aria-label="Close">✕</button>
          <img :src="gifSrc" alt="Welcome" class="welcome-gif" />
          <div v-if="message" class="welcome-message">{{ message }}</div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const visible = ref(false)
const gifSrc  = ref('/welcome.gif')
const message = ref('')

onMounted(async () => {
  if (!sessionStorage.getItem('show_welcome')) return
  sessionStorage.removeItem('show_welcome')

  try {
    const s = await $fetch('/api/settings') as any
    if (s.welcomeGifDataUrl) gifSrc.value  = s.welcomeGifDataUrl
    if (s.welcomeMessage)    message.value = s.welcomeMessage
  } catch {}

  visible.value = true
})

function close() {
  visible.value = false
}
</script>

<style scoped>
.welcome-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0, 0, 0, 0.65);
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
}

.welcome-modal {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  max-width: 480px;
  width: 90vw;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4);
  background: #000;
}

.welcome-gif {
  display: block;
  width: 100%;
  height: auto;
}

.welcome-message {
  padding: 14px 20px;
  font-size: 13px; line-height: 1.55;
  color: rgba(255,255,255,0.85);
  text-align: center;
  background: rgba(0,0,0,0.75);
}

.welcome-close {
  position: absolute; top: 12px; right: 12px; z-index: 1;
  width: 32px; height: 32px;
  border: none; border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff; font-size: 14px; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
  line-height: 1;
}
.welcome-close:hover { background: rgba(0, 0, 0, 0.75); }

.welcome-fade-enter-active,
.welcome-fade-leave-active { transition: opacity 0.3s ease; }
.welcome-fade-enter-from,
.welcome-fade-leave-to { opacity: 0; }
</style>
