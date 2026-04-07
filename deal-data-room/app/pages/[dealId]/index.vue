<template>
  <div>
    <!-- DEAL HEADER -->
    <div class="deal-header">
      <div class="dh-inner">
        <div class="dh-top">
          <!-- Left: name + meta -->
          <div>
            <div class="deal-name">{{ meta?.name ?? dealId }}</div>
            <div class="deal-meta">
              <span class="deal-ref">{{ meta?.ref }}</span>
              <span class="sep-dot">·</span>
              <span>{{ meta?.location }}</span>
              <span class="sep-dot">·</span>
              <span>{{ meta?.tenure }} · {{ meta?.landArea }} ac</span>
            </div>
          </div>
          <!-- Right: badges -->
          <div class="deal-badges">
            <span v-if="isRestricted" class="badge badge-red">Restricted</span>
            <span class="badge" :class="stageBadge">{{ meta?.stage }}</span>
            <NuxtLink to="/" class="btn-back">← All Deals</NuxtLink>
          </div>
        </div>

        <!-- TAB BAR -->
        <div class="tab-bar" role="tablist">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab"
            :class="{ active: activeTab === tab.key }"
            role="tab"
            :aria-selected="activeTab === tab.key"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- TAB CONTENT -->
    <div class="tab-content">
      <Transition name="fade-up" mode="out-in">
        <OverviewTab   v-if="activeTab === 'overview'"   :meta="meta" />
        <DocumentsTab  v-else-if="activeTab === 'documents'"  />
        <FinancialsTab v-else-if="activeTab === 'financials'" />
        <RiskTab       v-else-if="activeTab === 'risk'"       />
        <TeamTab       v-else-if="activeTab === 'team'"       />
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const dealId = route.params.dealId as string

const { data: meta, error } = await useFetch(`/api/${dealId}/meta`)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Deal not found' })
}

// Check restricted from deals list
const { data: dealsData } = await useFetch('/api/deals')
const isRestricted = computed(() => {
  const deals = (dealsData.value as any)?.deals ?? []
  return deals.find((d: any) => d.id === dealId)?.restricted ?? false
})

const stageBadgeMap: Record<string, string> = {
  'Active DD':    'badge-green',
  'Under Review': 'badge-amber',
  'Signed':       'badge-purple',
  'On Hold':      'badge-grey',
}
const stageBadge = computed(() => stageBadgeMap[(meta.value as any)?.stage] ?? 'badge-grey')

const tabs = [
  { key: 'overview',   label: 'Overview' },
  { key: 'documents',  label: 'Documents' },
  { key: 'financials', label: 'Financials' },
  { key: 'risk',       label: 'Risk & Legal' },
  { key: 'team',       label: 'Deal Team' },
]
const activeTab = ref('overview')
</script>

<style scoped>
/* ── DEAL HEADER ── */
.deal-header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky; top: 52px; z-index: 90;
}
.dh-inner {
  padding: 16px 28px 0;
  max-width: 1280px; margin: 0 auto; width: 100%;
}
.dh-top {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 14px;
}
.deal-name {
  font-size: 18px; font-weight: 600; color: var(--text);
  letter-spacing: -0.3px; margin-bottom: 4px;
}
.deal-meta {
  font-size: 12px; color: var(--muted);
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.deal-ref { font-family: 'DM Mono', monospace; }
.sep-dot { color: var(--faint); }
.deal-badges { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }

/* badges (global vars from layout) */
.badge { font-size: 11px; font-weight: 500; padding: 3px 9px; border-radius: 20px; letter-spacing: 0.02em; }
.badge-green  { background: var(--green-bg);  color: var(--green-txt); }
.badge-amber  { background: var(--amber-bg);  color: var(--amber); }
.badge-purple { background: var(--purple-bg); color: var(--purple); }
.badge-red    { background: var(--red-bg);    color: var(--red); }
.badge-grey   { background: var(--surface2);  color: var(--muted); border: 1px solid var(--border); }

.btn-back {
  height: 28px; padding: 0 12px;
  border: 1px solid var(--border2); border-radius: var(--radius-sm);
  background: transparent; font-family: 'DM Sans', sans-serif;
  font-size: 12px; font-weight: 500; color: var(--muted);
  cursor: pointer; transition: all 0.15s;
  display: inline-flex; align-items: center; text-decoration: none;
}
.btn-back:hover { background: var(--surface2); color: var(--text); }

/* ── TAB BAR ── */
.tab-bar { display: flex; }
.tab {
  font-size: 13px; font-weight: 400; color: var(--muted);
  padding: 10px 16px; cursor: pointer;
  border: none; background: transparent;
  border-bottom: 2px solid transparent;
  transition: color 0.15s; white-space: nowrap; user-select: none;
  font-family: 'DM Sans', sans-serif;
}
.tab:hover { color: var(--text); }
.tab.active { color: var(--text); font-weight: 500; border-bottom-color: var(--text); }

/* ── TAB CONTENT ── */
.tab-content {
  padding: 24px 28px;
  max-width: 1280px; margin: 0 auto; width: 100%;
}

/* ── TRANSITIONS ── */
.fade-up-enter-active,
.fade-up-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.fade-up-enter-from   { opacity: 0; transform: translateY(6px); }
.fade-up-leave-to     { opacity: 0; transform: translateY(-4px); }
</style>
