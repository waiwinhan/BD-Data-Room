<template>
  <div class="tab-placeholder">
    <div class="ph-icon">📊</div>
    <div class="ph-title">Financials</div>
    <div class="ph-sub">GDV, IRR, cost doughnut, cashflow chart, sensitivity table from Excel — coming in M06</div>
  </div>
</template>

<style scoped>
.tab-placeholder {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 320px; gap: 10px; color: var(--muted);
}
.ph-icon { font-size: 36px; opacity: 0.4; }
.ph-title { font-size: 16px; font-weight: 600; color: var(--text); }
.ph-sub { font-size: 12.5px; color: var(--muted); text-align: center; max-width: 360px; }
</style>
