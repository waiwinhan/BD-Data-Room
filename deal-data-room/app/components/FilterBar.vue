<template>
  <div class="filter-bar">
    <button
      v-for="pill in pills"
      :key="pill.key"
      class="filter-pill"
      :class="{ active: activeFilter === pill.key }"
      :style="activeFilter === pill.key && pill.color ? { background: pill.color, borderColor: pill.color, color: '#fff' } : {}"
      @click="$emit('update:activeFilter', pill.key)"
    >
      <span v-if="pill.color" class="pill-dot" :style="{ background: activeFilter === pill.key ? 'rgba(255,255,255,0.7)' : pill.color }" />
      {{ pill.label }}
      <span class="filter-count" :class="{ dark: activeFilter !== pill.key }">{{ pill.count }}</span>
    </button>

    <div class="filter-sep"></div>

    <div class="search-wrap">
      <span class="search-icon">⌕</span>
      <input
        class="search-input"
        type="text"
        placeholder="Search deals…"
        :value="searchQuery"
        @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  deals: any[]
  activeFilter: string
  searchQuery: string
}>()

defineEmits<{
  'update:activeFilter': [value: string]
  'update:searchQuery': [value: string]
}>()

const stageMap: Record<string, string> = {
  'Active DD': 'dd',
  'KIV':       'kiv',
  'Approved':  'approved',
  'Rejected':  'rejected',
}

// Stage colours — must match DealCard stageMap
const stageColors: Record<string, string> = {
  dd:       '#60A5FA',  // Active DD — blue
  kiv:      '#F5C85A',  // KIV — amber
  approved: '#5DCAA5',  // Approved — green
  rejected: '#F87171',  // Rejected — red
}

const pills = computed(() => {
  const counts: Record<string, number> = { all: props.deals.length, dd: 0, kiv: 0, approved: 0, rejected: 0 }
  for (const d of props.deals) {
    const key = stageMap[d.stage]
    if (key) counts[key]++
  }
  return [
    { key: 'all',      label: 'All',       count: counts.all,      color: null },
    { key: 'dd',       label: 'Active DD', count: counts.dd,       color: stageColors.dd },
    { key: 'kiv',      label: 'KIV',       count: counts.kiv,      color: stageColors.kiv },
    { key: 'approved', label: 'Approved',  count: counts.approved, color: stageColors.approved },
    { key: 'rejected', label: 'Rejected',  count: counts.rejected, color: stageColors.rejected },
  ]
})
</script>

<style scoped>
.filter-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 0 28px 20px;
  max-width: 1280px; margin: 0 auto; width: 100%;
}
.filter-pill {
  height: 30px; padding: 0 12px;
  border: 1px solid var(--border2); border-radius: 20px;
  background: transparent; font-family: 'DM Sans', sans-serif;
  font-size: 12px; font-weight: 500; color: var(--muted);
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
  display: inline-flex; align-items: center; gap: 5px;
}
.filter-pill:hover { background: var(--surface); color: var(--text); }
.filter-pill.active { color: #fff; border-color: var(--text); }
/* fallback active (All pill) */
.filter-pill.active:not([style*="background"]) { background: var(--text); }

.pill-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  transition: background 0.15s;
}
.filter-count {
  display: inline-flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; border-radius: 50%;
  background: rgba(255,255,255,0.25); font-size: 10px; font-weight: 600;
  margin-left: 2px;
}
.filter-count.dark { background: rgba(0,0,0,0.10); color: var(--text); }
.filter-sep { flex: 1; }
.search-wrap { position: relative; }
.search-input {
  height: 30px; padding: 0 12px 0 30px; width: 200px;
  border: 1px solid var(--border2); border-radius: var(--radius-sm);
  background: var(--surface); font-family: 'DM Sans', sans-serif;
  font-size: 12px; color: var(--text); outline: none; transition: border-color 0.15s;
}
.search-input:focus { border-color: var(--text); }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--faint); pointer-events: none; }
</style>
