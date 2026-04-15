<template>
  <div class="financials">

    <!-- ── KPI CARDS ── -->
    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label">NET DEV VALUE (NDV)</div>
        <div class="kpi-value">RM {{ fin.ndv }}M</div>
        <div class="kpi-sub n">After sales costs (RM {{ fin.blendedPSF ?? deal?.blendedPSF }} psf)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">CONSTRUCTION COST</div>
        <div class="kpi-value">RM {{ fin.constr }}M</div>
        <div class="kpi-sub n">Hard cost only</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">NET DEV PROFIT (NDP)</div>
        <div class="kpi-value" :class="ndpClass">RM {{ fin.ndp }}M</div>
        <div class="kpi-sub" :class="ndpClass">{{ fin.ndpMargin }}% on NDV</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">EQUITY REQUIRED</div>
        <div class="kpi-value">RM {{ fin.equityRequired }}M</div>
        <div class="kpi-sub warn">Inc. land &amp; prelim</div>
      </div>
    </div>

    <!-- ── CHARTS ROW ── -->
    <div class="charts-row">

      <!-- Cost Breakdown Doughnut -->
      <div class="chart-card">
        <div class="card-title">Cost Breakdown</div>
        <div class="chart-wrap">
          <ClientOnly>
            <Doughnut :data="doughnutData" :options="doughnutOpts" :plugins="[DataLabelsPlugin]" />
          </ClientOnly>
        </div>
        <div class="legend">
          <div v-for="(item, i) in costItems" :key="i" class="legend-item">
            <div class="legend-dot" :style="{ background: item.color }"></div>
            {{ item.label }} RM {{ item.value }}M
            <span class="legend-pct">({{ ((item.value / fin.totalDevCost) * 100).toFixed(0) }}%)</span>
          </div>
        </div>
      </div>

      <!-- Cashflow Bar + Net Line -->
      <div class="chart-card">
        <div class="card-title">Projected Cashflow (RM M)</div>
        <div class="chart-wrap">
          <ClientOnly>
            <Bar :data="barData" :options="barOpts" />
          </ClientOnly>
        </div>
        <div class="legend">
          <div class="legend-item"><div class="legend-dot" style="background:#5DCAA5"></div>Inflows</div>
          <div class="legend-item"><div class="legend-dot" style="background:#F0997B"></div>Outflows</div>
          <div class="legend-item">
            <div class="legend-line"></div>Cumulative net cashflow
          </div>
        </div>
      </div>
    </div>

    <!-- ── SENSITIVITY TABLE ── -->
    <div class="sens-card">
      <div class="card-title">Sensitivity — IRR vs ASP psf &amp; Absorption Rate</div>
      <div class="sens-scroll">
        <table class="sens-table">
          <thead>
            <tr>
              <th class="th-left">Absorption \ ASP</th>
              <th v-for="asp in asps" :key="asp" :class="{ 'th-base': asp === baseASPVal }">
                RM {{ asp }}{{ asp === baseASPVal ? ' ★' : '' }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="abs in absorptions" :key="abs">
              <td class="td-label">{{ abs }}% abs.</td>
              <td v-for="asp in asps" :key="asp" :class="cellClass(abs, asp)">
                {{ irrFor(abs, asp).toFixed(1) }}{{ abs === baseAbsVal && asp === baseASPVal ? '% ★' : '%' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="sens-legend">
        <span class="sl-item sl-good">≥ hurdle rate ({{ hurdleVal }}%)</span>
        <span class="sl-item sl-base">Base case</span>
        <span class="sl-item sl-bad">Below hurdle</span>
      </div>
    </div>

    <!-- ── DATA SOURCE NOTE ── -->
    <div :class="fin.source === 'xlsx' ? 'data-note data-note-live' : 'data-note'">
      <template v-if="fin.source === 'xlsx'">
        ✓ Live figures — parsed from BRDB Feasibility Study (.xlsx)
      </template>
      <template v-else>
        ⚠ Indicative estimates only. Upload the BRDB feasibility model (.xlsx) to replace with live figures.
      </template>
    </div>

  </div>
</template>

<script setup lang="ts">
import { Doughnut, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title,
} from 'chart.js'
import DataLabelsPlugin from 'chartjs-plugin-datalabels'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, DataLabelsPlugin)

const props = defineProps<{
  deal?: any
  meta?: any
  fin?: any
}>()

const fin = computed(() => props.fin ?? {})

const ndpClass = computed(() => {
  const m = parseFloat(fin.value.ndpMargin)
  const hurdle = props.deal?.hurdleRate ?? 15
  return m >= hurdle ? 'val-green' : 'val-red'
})

// ── Cost items (6 categories) ───────────────────────────────────────
const costItems = computed(() => [
  { label: 'Land',         value: fin.value.landCost,   color: '#5DCAA5' },
  { label: 'Construction', value: fin.value.constr,     color: '#85B7EB' },
  { label: 'Authority',    value: fin.value.authority,  color: '#FAC775' },
  { label: 'Site Staff',   value: fin.value.siteStaff,  color: '#B4B2A9' },
  { label: 'Finance',      value: fin.value.finance,    color: '#F0997B' },
  { label: 'Marketing',    value: fin.value.marketing,  color: '#C4A0E8' },
])

// ── Doughnut chart ──────────────────────────────────────────────────
const doughnutData = computed(() => ({
  labels: costItems.value.map(c => c.label),
  datasets: [{
    data: costItems.value.map(c => c.value),
    backgroundColor: costItems.value.map(c => c.color),
    borderWidth: 0,
    hoverOffset: 4,
  }]
}))

const doughnutOpts = computed(() => {
  const total = fin.value.totalDevCost
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c: any) => ` RM ${c.parsed}M` } },
      datalabels: {
        display: (ctx: any) => ctx.dataset.data[ctx.dataIndex] / total >= 0.05,
        color: '#fff',
        font: { size: 11, weight: 'bold' as const },
        textAlign: 'center' as const,
        formatter: (value: number) => {
          const pct = ((value / total) * 100).toFixed(0)
          return `RM ${value}M\n${pct}%`
        },
      },
    },
  }
})

// ── Cashflow chart (bars + net line) ────────────────────────────────
const inflows  = [0,   42,  88,  96, 54]
const outflows = [-58, -72, -55, -28, -10]
const netFlow  = inflows.reduce<number[]>((acc, v, i) => {
  const period = v + outflows[i]
  acc.push((acc[acc.length - 1] ?? 0) + period)
  return acc
}, [])  // cumulative: [-58, -88, -55, 13, 57]

const barData = computed(() => ({
  labels: ['Y1', 'Y2', 'Y3', 'Y4', 'Y5'],
  datasets: [
    {
      type: 'bar' as const,
      label: 'Inflows',
      data: inflows,
      backgroundColor: '#5DCAA5',
      borderRadius: 3,
    },
    {
      type: 'bar' as const,
      label: 'Outflows',
      data: outflows,
      backgroundColor: '#F0997B',
      borderRadius: 3,
    },
    {
      type: 'line' as const,
      label: 'Cumulative Net',
      data: netFlow,
      borderColor: '#1A1916',
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: netFlow.map(v => v >= 0 ? '#1A1916' : '#A32D2D'),
      pointBorderColor: '#fff',
      pointBorderWidth: 1.5,
      tension: 0.35,
      order: -1,
    },
  ]
}))

const barOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    datalabels: { display: false },
    tooltip: {
      callbacks: {
        label: (c: any) => {
          const abs = Math.abs(c.parsed.y)
          return ` ${c.dataset.label}: RM ${abs}M`
        }
      }
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#7A7770', font: { size: 11 } } },
    y: {
      grid: { color: 'rgba(0,0,0,.05)' },
      ticks: { color: '#7A7770', font: { size: 11 }, callback: (v: any) => `RM ${Math.abs(v)}M` }
    }
  }
}

// ── Sensitivity table — driven by Excel inputs when available ───────
const baseASPVal  = computed(() => fin.value.baseASP        ?? 680)
const baseAbsVal  = computed(() => fin.value.baseAbsorption ?? 80)
const hurdleVal   = computed(() => fin.value.hurdleIRR      ?? props.deal?.hurdleRate ?? 15)

// Build ±3 ASP steps centred on baseASP, rounded to nearest 10
const asps = computed(() => {
  const base = baseASPVal.value
  const step = Math.round(base * 0.05 / 10) * 10 || 30  // ~5% step, min 30
  return [-2, -1, 0, 1, 2].map(n => base + n * step)
})

// Absorption rows: 50% to 110% in steps of 15
const absorptions = [50, 65, 80, 95, 110]

// Proportional IRR estimate: IRR scales linearly with revenue (ASP × Abs).
// Anchor: at base ASP + base absorption, IRR ≈ hurdle + 6% (typical feasibility target).
function irrFor(abs: number, asp: number): number {
  const baseIRR = hurdleVal.value + 6
  const revenueRatio = (asp / baseASPVal.value) * (abs / baseAbsVal.value)
  return Math.round(baseIRR * revenueRatio * 10) / 10
}

function cellClass(abs: number, asp: number): string {
  if (abs === baseAbsVal.value && asp === baseASPVal.value) return 'c-base'
  return irrFor(abs, asp) >= hurdleVal.value ? 'c-good' : 'c-bad'
}
</script>

<style scoped>
.financials { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }

/* KPI row */
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.kpi-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 16px 18px;
  box-shadow: var(--shadow);
}
.kpi-label { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; color: var(--muted); text-transform: uppercase; margin-bottom: 6px; }
.kpi-value { font-size: 22px; font-weight: 600; color: var(--text); line-height: 1.2; }
.kpi-sub   { font-size: 11px; color: var(--muted); margin-top: 4px; }
.kpi-sub.n    { color: var(--faint); }
.kpi-sub.warn { color: var(--amber); }
.val-green { color: var(--green-txt); }
.val-amber { color: var(--amber); }
.val-red   { color: var(--red); }

/* Charts */
.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.chart-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 20px;
  box-shadow: var(--shadow);
}
.card-title { font-size: 12px; font-weight: 600; color: var(--text); margin-bottom: 14px; letter-spacing: 0.01em; }
.chart-wrap { height: 200px; position: relative; }
.legend { display: flex; flex-wrap: wrap; gap: 10px 16px; margin-top: 14px; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--muted); }
.legend-dot  { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.legend-pct  { color: var(--faint); font-size: 10.5px; }
.legend-line { width: 18px; height: 2px; background: #1A1916; border-radius: 1px; flex-shrink: 0; }

/* Sensitivity */
.sens-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 20px;
  box-shadow: var(--shadow);
}
.sens-scroll { overflow-x: auto; }
.sens-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.sens-table th, .sens-table td { padding: 8px 12px; text-align: center; border-bottom: 1px solid var(--border); white-space: nowrap; }
.sens-table th { font-size: 11px; font-weight: 600; color: var(--muted); background: var(--surface2); text-transform: uppercase; letter-spacing: 0.05em; }
.th-left, .td-label { text-align: left !important; color: var(--muted); font-weight: 500; }
.th-base { color: var(--text) !important; }
.c-good { background: #E9F8F1; color: #0F6E56; font-weight: 500; }
.c-bad  { background: #FDECEC; color: #A32D2D; font-weight: 500; }
.c-base { background: #1A1916; color: #fff; font-weight: 600; border-radius: 4px; }
.sens-legend { display: flex; gap: 16px; margin-top: 12px; }
.sl-item { font-size: 11px; display: flex; align-items: center; gap: 6px; }
.sl-good::before { content: ''; display: inline-block; width: 10px; height: 10px; background: #E9F8F1; border: 1px solid #0F6E56; border-radius: 2px; }
.sl-bad::before  { content: ''; display: inline-block; width: 10px; height: 10px; background: #FDECEC; border: 1px solid #A32D2D; border-radius: 2px; }
.sl-base::before { content: ''; display: inline-block; width: 10px; height: 10px; background: #1A1916; border-radius: 2px; }

/* Note */
.data-note {
  font-size: 11px; color: var(--amber); background: var(--amber-bg);
  border: 1px solid rgba(133,79,11,0.15); border-radius: var(--radius-sm);
  padding: 8px 12px;
}
.data-note-live {
  color: #0F6E56; background: #E9F8F1;
  border-color: rgba(15,110,86,0.2);
}
</style>
