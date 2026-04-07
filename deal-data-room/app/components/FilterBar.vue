<template>
  <div class="filter-bar">
    <button
      v-for="pill in pills"
      :key="pill.key"
      class="filter-pill"
      :class="{ active: activeFilter === pill.key }"
      @click="$emit('update:activeFilter', pill.key)"
    >
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
  'Under Review': 'review',
  'Signed': 'signed',
  'On Hold': 'hold',
}

const pills = computed(() => {
  const counts: Record<string, number> = { all: props.deals.length, dd: 0, review: 0, signed: 0, hold: 0 }
  for (const d of props.deals) {
    const key = stageMap[d.stage]
    if (key) counts[key]++
  }
  return [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'dd', label: 'Active DD', count: counts.dd },
    { key: 'review', label: 'Under Review', count: counts.review },
    { key: 'signed', label: 'Signed', count: counts.signed },
    { key: 'hold', label: 'On Hold', count: counts.hold },
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
  height: 30px; padding: 0 14px;
  border: 1px solid var(--border2); border-radius: 20px;
  background: transparent; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; color: var(--muted);
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.filter-pill:hover { background: var(--surface); color: var(--text); }
.filter-pill.active { background: var(--text); color: #fff; border-color: var(--text); }
.filter-count {
  display: inline-flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; border-radius: 50%;
  background: rgba(255,255,255,0.25); font-size: 10px; font-weight: 600;
  margin-left: 4px;
}
.filter-count.dark { background: rgba(0,0,0,0.10); color: var(--text); }
.filter-sep { flex: 1; }
.search-wrap { position: relative; }
.search-input {
  height: 30px; padding: 0 12px 0 30px; width: 200px;
  border: 1px solid var(--border2); border-radius: var(--radius-sm);
  background: var(--surface); font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--text);
  outline: none; transition: border-color 0.15s;
}
.search-input:focus { border-color: var(--text); }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--faint); pointer-events: none; }
</style>
