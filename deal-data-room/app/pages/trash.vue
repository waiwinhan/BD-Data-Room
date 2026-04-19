<template>
  <div>
    <div class="page-header">
      <div class="page-header-row">
        <div>
          <div class="page-title">
            <NuxtLink to="/" class="back-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </NuxtLink>
            Trash
          </div>
          <div class="page-subtitle">Deals moved to trash. Restore or permanently delete them.</div>
        </div>
      </div>
    </div>

    <div class="trash-content">
      <!-- empty state -->
      <div v-if="deals.length === 0" class="empty-state">
        <div class="empty-icon">🗑️</div>
        Trash is empty.
      </div>

      <!-- deal rows -->
      <div v-for="deal in deals" :key="deal.id" class="trash-row">
        <div class="trash-row-info">
          <div class="trash-deal-name">{{ deal.name }}</div>
          <div class="trash-deal-meta">{{ deal.ref }} · {{ deal.location }}</div>
          <div class="trash-deal-sub">RM {{ deal.ndv }}M NDV · {{ deal.landAcres }} ac · Trashed {{ formatDate(deal.trashedAt) }}</div>
        </div>
        <div class="trash-row-actions">
          <button class="btn-restore" :disabled="busy === deal.id" @click="restore(deal)">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Restore
          </button>
          <button class="btn-delete" :disabled="busy === deal.id" @click="permanentDelete(deal)">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Delete Forever
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const { data, refresh } = await useFetch('/api/deals/trashed')
const deals = computed(() => (data.value as any[]) ?? [])
const busy = ref<string | null>(null)

function formatDate(ts: string) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function restore(deal: any) {
  busy.value = deal.id
  await $fetch(`/api/${deal.id}/restore`, { method: 'PUT' })
  await refresh()
  busy.value = null
}

async function permanentDelete(deal: any) {
  if (!confirm(`Permanently delete "${deal.name}"? This cannot be undone.`)) return
  busy.value = deal.id
  await $fetch(`/api/${deal.id}`, { method: 'DELETE' })
  await refresh()
  busy.value = null
}
</script>

<style scoped>
.page-header {
  padding: 32px 28px 0;
  max-width: 1280px; margin: 0 auto; width: 100%;
}
.page-header-row { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 20px; }
.page-title {
  font-size: 22px; font-weight: 600; color: var(--text);
  letter-spacing: -0.4px; display: flex; align-items: center; gap: 8px;
}
.page-subtitle { font-size: 13px; color: var(--muted); margin-top: 3px; }

.back-link {
  display: inline-flex; align-items: center;
  color: var(--muted); text-decoration: none;
  padding: 4px; border-radius: 6px; transition: color 0.15s;
}
.back-link:hover { color: var(--text); }

.trash-content {
  max-width: 1280px; margin: 0 auto; width: 100%;
  padding: 0 28px 40px;
  display: flex; flex-direction: column; gap: 10px;
}

.empty-state {
  text-align: center; padding: 80px 20px;
  color: var(--muted); font-size: 13px;
}
.empty-icon { font-size: 36px; margin-bottom: 12px; opacity: 0.4; }

.trash-row {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 16px 20px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius);
  animation: fadeUp 0.25s ease both;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.trash-row-info { flex: 1; min-width: 0; }
.trash-deal-name { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
.trash-deal-meta { font-size: 11.5px; color: var(--muted); font-family: 'DM Mono', monospace; margin-bottom: 4px; }
.trash-deal-sub  { font-size: 11px; color: var(--faint); }

.trash-row-actions { display: flex; gap: 8px; flex-shrink: 0; }

.btn-restore {
  display: inline-flex; align-items: center; gap: 5px;
  height: 30px; padding: 0 12px;
  border: 1px solid var(--border2); border-radius: var(--radius-sm);
  background: var(--surface2); font-family: 'DM Sans', sans-serif;
  font-size: 12px; font-weight: 500; color: var(--text);
  cursor: pointer; transition: all 0.15s;
}
.btn-restore:hover:not(:disabled) { background: var(--surface); border-color: var(--text); }
.btn-restore:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-delete {
  display: inline-flex; align-items: center; gap: 5px;
  height: 30px; padding: 0 12px;
  border: 1px solid rgba(163,45,45,0.25); border-radius: var(--radius-sm);
  background: var(--red-bg); font-family: 'DM Sans', sans-serif;
  font-size: 12px; font-weight: 500; color: var(--red);
  cursor: pointer; transition: all 0.15s;
}
.btn-delete:hover:not(:disabled) { background: #fecaca; border-color: var(--red); }
.btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
