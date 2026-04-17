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

    <!-- ── MODEL UPLOAD BANNER ── -->
    <div class="upload-banner" :class="fin.source === 'xlsx' ? 'upload-banner-live' : 'upload-banner-estimate'">
      <div class="upload-banner-left">
        <template v-if="fin.source === 'xlsx'">
          <span class="upload-icon">✓</span>
          <div>
            <div class="upload-title">Live figures — BRDB Feasibility Study (.xlsx)</div>
            <div class="upload-sub">Numbers parsed directly from your Excel model. Replace to update.</div>
          </div>
        </template>
        <template v-else>
          <span class="upload-icon warn">⚠</span>
          <div>
            <div class="upload-title">Indicative estimates only</div>
            <div class="upload-sub">Upload your BRDB Feasibility Study (.xlsx) to replace with live figures.</div>
          </div>
        </template>
      </div>

      <div class="upload-banner-right">
        <!-- Hidden file input -->
        <input
          ref="fileInputRef"
          type="file"
          accept=".xlsx"
          class="file-input-hidden"
          @change="handleFile"
        />

        <!-- Upload / Replace button -->
        <button
          class="btn-upload"
          :class="{ 'btn-upload-live': fin.source === 'xlsx', uploading }"
          :disabled="uploading"
          @click="triggerUpload"
        >
          <span v-if="uploading" class="spinner"></span>
          <span v-else>{{ fin.source === 'xlsx' ? '↑ Replace Model' : '↑ Upload .xlsx' }}</span>
        </button>
      </div>
    </div>

    <!-- Error / Success messages -->
    <Transition name="toast">
      <div v-if="uploadError" class="upload-error">{{ uploadError }}</div>
    </Transition>
    <Transition name="toast">
      <div v-if="uploadToast" class="upload-success">✓ Model uploaded — figures updated</div>
    </Transition>

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
  dealId?: string
}>()

const emit = defineEmits<{ uploaded: [] }>()

const fin = computed(() => props.fin ?? {})

// ── Upload ──────────────────────────────────────────────────────────────────
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploading    = ref(false)
const uploadError  = ref('')
const uploadToast  = ref(false)

function triggerUpload() {
  uploadError.value = ''
  fileInputRef.value?.click()
}

async function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    uploadError.value = 'Please select an .xlsx file'
    return
  }
  uploading.value   = true
  uploadError.value = ''
  const form = new FormData()
  form.append('file', file)
  try {
    await $fetch(`/api/${props.dealId}/financials`, { method: 'POST', body: form })
    uploadToast.value = true
    setTimeout(() => { uploadToast.value = false }, 3000)
    emit('uploaded')
  } catch (err: any) {
    uploadError.value = err.data?.statusMessage || 'Upload failed — please try again.'
    setTimeout(() => { uploadError.value = '' }, 4000)
  } finally {
    uploading.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

// ── NDP colour ──────────────────────────────────────────────────────────────
const ndpClass = computed(() => {
  const m = parseFloat(fin.value.ndpMargin)
  const hurdle = props.deal?.hurdleRate ?? 15
  return m >= hurdle ? 'val-green' : 'val-red'
})

// ── Cost items (6 categories) ───────────────────────────────────────────────
const costItems = computed(() => [
  { label: 'Land',         value: fin.value.landCost,   color: '#5DCAA5' },
  { label: 'Construction', value: fin.value.constr,     color: '#85B7EB' },
  { label: 'Authority',    value: fin.value.authority,  color: '#FAC775' },
  { label: 'Site Staff',   value: fin.value.siteStaff,  color: '#B4B2A9' },
  { label: 'Finance',      value: fin.value.finance,    color: '#F0997B' },
  { label: 'Marketing',    value: fin.value.marketing,  color: '#C4A0E8' },
])

// ── Doughnut ────────────────────────────────────────────────────────────────
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

// ── Cashflow chart ───────────────────────────────────────────────────────────
const inflows  = [0,   42,  88,  96, 54]
const outflows = [-58, -72, -55, -28, -10]
const netFlow  = inflows.reduce<number[]>((acc, v, i) => {
  const period = v + outflows[i]
  acc.push((acc[acc.length - 1] ?? 0) + period)
  return acc
}, [])

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

// ── Sensitivity table ────────────────────────────────────────────────────────
const baseASPVal  = computed(() => fin.value.baseASP        ?? 680)
const baseAbsVal  = computed(() => fin.value.baseAbsorption ?? 80)
const hurdleVal   = computed(() => fin.value.hurdleIRR      ?? props.deal?.hurdleRate ?? 15)

const asps = computed(() => {
  const base = baseASPVal.value
  const step = Math.round(base * 0.05 / 10) * 10 || 30
  return [-2, -1, 0, 1, 2].map(n => base + n * step)
})

const absorptions = [50, 65, 80, 95, 110]

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

/* ── UPLOAD BANNER ── */
.upload-banner {
  border-radius: var(--radius);
  padding: 12px 16px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  border: 1px solid transparent;
}
.upload-banner-estimate {
  background: var(--amber-bg);
  border-color: rgba(133,79,11,0.18);
}
.upload-banner-live {
  background: #E9F8F1;
  border-color: rgba(15,110,86,0.2);
}
.upload-banner-left {
  display: flex; align-items: flex-start; gap: 10px; flex: 1; min-width: 0;
}
.upload-icon {
  font-size: 14px; flex-shrink: 0;
  color: var(--green-txt); margin-top: 1px;
}
.upload-icon.warn { color: var(--amber); }
.upload-title {
  font-size: 12px; font-weight: 600; color: var(--text); margin-bottom: 2px;
}
.upload-sub {
  font-size: 11px; color: var(--muted);
}
.upload-banner-right { flex-shrink: 0; }

/* Upload button */
.btn-upload {
  height: 30px; padding: 0 14px;
  border-radius: var(--radius-sm);
  font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--text); color: #fff; border: none;
}
.btn-upload:hover:not(:disabled) { opacity: 0.85; }
.btn-upload:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-upload-live {
  background: transparent;
  color: #0F6E56;
  border: 1px solid rgba(15,110,86,0.35) !important;
}
.btn-upload-live:hover:not(:disabled) { background: rgba(15,110,86,0.08); }

/* Spinner */
.spinner {
  width: 12px; height: 12px;
  border: 2px solid currentColor; border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite; flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Hidden file input */
.file-input-hidden { display: none; }

/* Feedback toasts */
.upload-error {
  font-size: 12px; color: var(--red); background: var(--red-bg);
  border: 1px solid rgba(163,45,45,0.2); border-radius: var(--radius-sm);
  padding: 8px 12px;
}
.upload-success {
  font-size: 12px; font-weight: 500; color: #0F6E56; background: #E9F8F1;
  border: 1px solid rgba(15,110,86,0.2); border-radius: var(--radius-sm);
  padding: 8px 12px;
}

/* Toast transition */
.toast-enter-active, .toast-leave-active { transition: opacity 0.25s, transform 0.25s; }
.toast-enter-from { opacity: 0; transform: translateY(-4px); }
.toast-leave-to   { opacity: 0; transform: translateY(4px); }
</style>
