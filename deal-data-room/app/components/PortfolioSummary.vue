<template>
  <div class="summary-strip">
    <div class="sum-card">
      <div class="sum-label">Total Pipeline GDV</div>
      <div class="sum-value">{{ formatGDV(portfolio.totalGDV) }}</div>
      <div class="sum-sub">Across {{ portfolio.dealCount }} active deals</div>
    </div>
    <div class="sum-card">
      <div class="sum-label">Avg. Projected IRR</div>
      <div class="sum-value">{{ portfolio.avgIRR.toFixed(1) }}%</div>
      <div class="sum-sub">Above 15% hurdle rate</div>
    </div>
    <div class="sum-card">
      <div class="sum-label">Total Land Area</div>
      <div class="sum-value">{{ portfolio.totalLandAcres.toFixed(1) }} ac</div>
      <div class="sum-sub">Freehold &amp; leasehold mix</div>
    </div>
    <div class="sum-card">
      <div class="sum-label">Pending Board Sign-off</div>
      <div class="sum-value">{{ portfolio.pendingBoardCount }} deals</div>
      <div class="sum-sub">Est. May – Jun 2026</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  portfolio: {
    totalGDV: number
    avgIRR: number
    totalLandAcres: number
    pendingBoardCount: number
    dealCount: number
  }
}>()

function formatGDV(rmMillions: number): string {
  if (rmMillions >= 1000) return `RM ${(rmMillions / 1000).toFixed(2)}B`
  return `RM ${rmMillions}M`
}
</script>

<style scoped>
.summary-strip {
  display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 10px;
  padding: 0 28px 24px;
  max-width: 1280px; margin: 0 auto; width: 100%;
}
.sum-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 12px 16px;
  box-shadow: var(--shadow);
}
.sum-label { font-size: 10.5px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4px; font-weight: 500; }
.sum-value { font-size: 18px; font-weight: 600; color: var(--text); letter-spacing: -0.3px; }
.sum-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }
</style>
