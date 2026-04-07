<template>
  <div>
    <!-- PAGE HEADER -->
    <div class="page-header">
      <div class="page-header-row">
        <div>
          <div class="page-title">Active Deals</div>
          <div class="page-subtitle">Property acquisitions &amp; joint ventures under due diligence or negotiation</div>
        </div>
      </div>
    </div>

    <!-- FILTER BAR -->
    <FilterBar
      :deals="allDeals"
      v-model:activeFilter="activeFilter"
      v-model:searchQuery="searchQuery"
    />

    <!-- PORTFOLIO SUMMARY -->
    <PortfolioSummary v-if="portfolio" :portfolio="{ ...portfolio, dealCount: allDeals.length }" />

    <!-- STATUS LEGEND -->
    <div class="status-legend">
      <span class="legend-title">Status</span>
      <span class="legend-item">
        <span class="legend-dot" style="background:#60A5FA" />
        <span class="legend-label"><strong>Active DD</strong> — Deal under active due diligence</span>
      </span>
      <span class="legend-item">
        <span class="legend-dot" style="background:#F5C85A" />
        <span class="legend-label"><strong>KIV</strong> — Keep in view, pending evaluation</span>
      </span>
      <span class="legend-item">
        <span class="legend-dot" style="background:#5DCAA5" />
        <span class="legend-label"><strong>Approved</strong> — Deal approved and signed</span>
      </span>
      <span class="legend-item">
        <span class="legend-dot" style="background:#F87171" />
        <span class="legend-label"><strong>Rejected</strong> — Deal not proceeding</span>
      </span>
      <span class="legend-divider" />
      <span class="legend-item">
        <span class="legend-dot legend-dot-outline" style="border-color:#F87171" />
        <span class="legend-label"><strong>Confidential</strong> — Sensitive deal, restricted access</span>
      </span>
    </div>

    <!-- DEAL GRID -->
    <div class="deal-grid">
      <DealCard
        v-for="(deal, i) in filteredDeals"
        :key="deal.id"
        :deal="deal"
        :delay="0.05 + i * 0.05"
      />

      <!-- empty state -->
      <div v-if="filteredDeals.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        No deals match your filter.
      </div>

      <!-- add deal card -->
      <div class="add-card" @click="alert('Add new deal — coming in Phase 4')">
        <span class="add-icon">＋</span>
        Add new deal
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { data } = await useFetch('/api/deals')

const allDeals = computed(() => (data.value as any)?.deals ?? [])
const portfolio = computed(() => (data.value as any)?.portfolio ?? null)

const activeFilter = ref('all')
const searchQuery = ref('')

const stageFilterMap: Record<string, string> = {
  dd:       'Active DD',
  kiv:      'KIV',
  approved: 'Approved',
  rejected: 'Rejected',
}

const filteredDeals = computed(() => {
  let deals = allDeals.value
  if (activeFilter.value !== 'all') {
    const stage = stageFilterMap[activeFilter.value]
    deals = deals.filter((d: any) => d.stage === stage)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    deals = deals.filter((d: any) =>
      d.name.toLowerCase().includes(q) || d.location.toLowerCase().includes(q)
    )
  }
  return deals
})
</script>

<style scoped>
.page-header {
  padding: 32px 28px 0;
  max-width: 1280px; margin: 0 auto; width: 100%;
}
.page-header-row { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 20px; }
.page-title { font-size: 22px; font-weight: 600; color: var(--text); letter-spacing: -0.4px; }
.page-subtitle { font-size: 13px; color: var(--muted); margin-top: 3px; }

.deal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 14px;
  padding: 0 28px 40px;
  max-width: 1280px; margin: 0 auto; width: 100%;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center; padding: 60px 20px;
  color: var(--muted); font-size: 13px;
}
.empty-icon { font-size: 32px; margin-bottom: 12px; opacity: 0.4; }

.add-card {
  background: transparent;
  border: 1.5px dashed var(--border2);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  min-height: 200px; gap: 8px;
  color: var(--muted); font-size: 13px; font-weight: 500;
}
.add-card:hover { background: var(--surface); border-color: var(--text); color: var(--text); box-shadow: var(--shadow); }
.add-icon { font-size: 24px; opacity: 0.5; }

/* ── STATUS LEGEND ── */
.status-legend {
  display: flex; align-items: center; flex-wrap: wrap; gap: 6px 16px;
  padding: 0 28px 16px;
  max-width: 1280px; margin: 0 auto; width: 100%;
}
.legend-title {
  font-size: 11px; font-weight: 600; color: var(--muted);
  text-transform: uppercase; letter-spacing: 0.07em; margin-right: 4px;
}
.legend-item {
  display: inline-flex; align-items: center; gap: 6px;
}
.legend-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  display: inline-block;
}
.legend-dot-outline {
  background: transparent !important;
  border: 2px solid;
}
.legend-label {
  font-size: 11.5px; color: var(--muted);
}
.legend-label strong {
  color: var(--text); font-weight: 600;
}
.legend-divider {
  display: inline-block;
  width: 1px; height: 14px;
  background: var(--border2);
  margin: 0 4px;
  vertical-align: middle;
}
</style>
