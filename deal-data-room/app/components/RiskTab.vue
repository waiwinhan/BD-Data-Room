<template>
  <div class="risk-tab">

    <!-- ── SUMMARY BANNER ── -->
    <div class="risk-summary">
      <div class="rs-item">
        <span class="rs-dot dot-red"></span>
        <span class="rs-num">{{ countBySeverity('red') }}</span>
        <span class="rs-lbl">High Risk</span>
      </div>
      <div class="rs-divider"></div>
      <div class="rs-item">
        <span class="rs-dot dot-amber"></span>
        <span class="rs-num">{{ countBySeverity('amber') }}</span>
        <span class="rs-lbl">Medium Risk</span>
      </div>
      <div class="rs-divider"></div>
      <div class="rs-item">
        <span class="rs-dot dot-green"></span>
        <span class="rs-num">{{ countBySeverity('green') }}</span>
        <span class="rs-lbl">Low Risk</span>
      </div>
      <div class="rs-divider"></div>
      <div class="rs-item">
        <span class="rs-num">{{ risks.length }}</span>
        <span class="rs-lbl">Total Items</span>
      </div>
    </div>

    <div class="risk-grid">

      <!-- ── LEFT: RISK REGISTER ── -->
      <div class="risk-card">
        <div class="card-label">Risk Register <span class="hint">· click dot to change severity</span></div>

        <div v-if="pending" class="empty-state">Loading…</div>
        <div v-else-if="risks.length === 0" class="empty-state">No risk items found.</div>

        <template v-for="sev in ['red', 'amber', 'green']" :key="sev">
          <template v-if="bySeverity(sev).length > 0">
            <div class="sev-group-label" :class="`sev-${sev}`">
              {{ sev === 'red' ? 'High' : sev === 'amber' ? 'Medium' : 'Low' }}
            </div>
            <div
              v-for="risk in bySeverity(sev)"
              :key="risk.id"
              class="risk-item"
              :class="{ 'risk-item--expanded': expanded === risk.id }"
              @click="toggle(risk.id)"
            >
              <div class="risk-item-header">
                <!-- Clickable severity dot -->
                <button
                  class="risk-dot"
                  :class="[`dot-${risk.severity}`, savingRisk === risk.id ? 'dot-saving' : '']"
                  :title="`Severity: ${risk.severity} — click to change`"
                  @click.stop="cycleSeverity(risk)"
                ></button>
                <div class="risk-main">
                  <div class="risk-title">{{ risk.description }}</div>
                  <div class="risk-meta">
                    <span class="risk-cat-badge">{{ risk.category }}</span>
                    <span class="risk-owner">{{ risk.owner }}</span>
                  </div>
                </div>
                <span class="risk-chevron">{{ expanded === risk.id ? '▲' : '▼' }}</span>
              </div>
              <div v-if="expanded === risk.id" class="risk-mitigation">
                <span class="mit-label">Mitigation: </span>{{ risk.mitigation }}
              </div>
            </div>
          </template>
        </template>
      </div>

      <!-- ── RIGHT: LEGAL STATUS + KEY DATES ── -->
      <div class="risk-card">

        <!-- Legal Status -->
        <div class="card-label">Legal Status <span class="hint">· click status to change</span></div>
        <div class="legal-table">
          <div v-for="(field, key) in legalFields" :key="key" class="lr-row">
            <span class="lr-key">{{ fieldLabel(String(key)) }}</span>
            <button
              class="lr-val lr-val-btn"
              :class="[statusClass(field.status), savingLegal === key ? 'val-saving' : '']"
              :title="`Status: ${field.status} — click to cycle`"
              @click="cycleLegalStatus(String(key), field)"
            >{{ field.value }}</button>
          </div>
        </div>

        <!-- Key Dates -->
        <template v-if="keyDates.length > 0">
          <div class="section-sep"></div>
          <div class="card-label">Key Dates <span class="hint">· click status to change</span></div>
          <div class="legal-table">
            <div v-for="(kd, idx) in keyDates" :key="kd.label" class="lr-row">
              <span class="lr-key">{{ kd.label }}</span>
              <button
                class="lr-val lr-val-btn"
                :class="[statusClass(kd.status), savingDate === idx ? 'val-saving' : '']"
                :title="`Status: ${kd.status} — click to cycle`"
                @click="cycleDateStatus(idx, kd)"
              >{{ kd.date }}</button>
            </div>
          </div>
        </template>

        <!-- DD Progress -->
        <template v-if="ddProgress != null">
          <div class="section-sep"></div>
          <div class="card-label">DD Progress</div>
          <div class="dd-bar-wrap">
            <div class="dd-bar-track">
              <div class="dd-bar-fill" :style="{ width: ddProgress + '%' }"></div>
            </div>
            <span class="dd-pct">{{ ddProgress }}%</span>
          </div>
        </template>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  dealId: string
  meta?: any
  deal?: any
}>()

// ── Risk data ──
const { data: riskData, pending, refresh: refreshRisk } = await useFetch(() => `/api/${props.dealId}/risk`)
const risks = computed(() => (riskData.value as any[]) ?? [])

function bySeverity(sev: string) {
  return risks.value.filter((r: any) => r.severity === sev)
}
function countBySeverity(sev: string) {
  return bySeverity(sev).length
}

// Expand/collapse mitigation
const expanded = ref<string | null>(null)
function toggle(id: string) {
  expanded.value = expanded.value === id ? null : id
}

// Cycle risk severity: red → amber → green → red
const SEVERITY_CYCLE = ['red', 'amber', 'green']
const savingRisk = ref<string | null>(null)

async function cycleSeverity(risk: any) {
  if (savingRisk.value) return
  const next = SEVERITY_CYCLE[(SEVERITY_CYCLE.indexOf(risk.severity) + 1) % SEVERITY_CYCLE.length]
  savingRisk.value = risk.id
  try {
    await $fetch(`/api/${props.dealId}/risk/${risk.id}`, { method: 'PUT', body: { severity: next } })
    await refreshRisk()
  } finally {
    savingRisk.value = null
  }
}

// ── Legal status ──
const legalFields = computed(() => {
  const ls = props.meta?.legalStatus ?? {}
  const normalised: Record<string, { value: string; status: string }> = {}
  for (const [k, v] of Object.entries(ls)) {
    if (typeof v === 'object' && v !== null && 'value' in (v as any)) {
      normalised[k] = v as any
    } else {
      normalised[k] = { value: String(v), status: 'ok' }
    }
  }
  return normalised
})

const keyDates   = computed(() => props.meta?.keyDates ?? [])
const ddProgress = computed(() => props.deal?.ddProgress ?? null)

// Cycle legal status: ok → pending → issue → ok
const STATUS_CYCLE = ['ok', 'pending', 'issue']
const savingLegal  = ref<string | null>(null)
const savingDate   = ref<number | null>(null)

async function cycleLegalStatus(key: string, field: { value: string; status: string }) {
  if (savingLegal.value) return
  const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(field.status) + 1) % STATUS_CYCLE.length]
  savingLegal.value = key
  const updatedLegal = {
    ...props.meta?.legalStatus,
    [key]: { ...field, status: next },
  }
  try {
    await $fetch(`/api/${props.dealId}/meta`, {
      method: 'PUT',
      body: { ...props.meta, legalStatus: updatedLegal },
    })
    // Parent will re-fetch via its own refresh — optimistic update for now
    if (props.meta?.legalStatus?.[key]) {
      props.meta.legalStatus[key].status = next
    }
  } finally {
    savingLegal.value = null
  }
}

async function cycleDateStatus(idx: number, kd: any) {
  if (savingDate.value !== null) return
  const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(kd.status) + 1) % STATUS_CYCLE.length]
  savingDate.value = idx
  const updatedDates = [...(props.meta?.keyDates ?? [])]
  updatedDates[idx] = { ...kd, status: next }
  try {
    await $fetch(`/api/${props.dealId}/meta`, {
      method: 'PUT',
      body: { ...props.meta, keyDates: updatedDates },
    })
    if (props.meta?.keyDates?.[idx]) {
      props.meta.keyDates[idx].status = next
    }
  } finally {
    savingDate.value = null
  }
}

const FIELD_LABELS: Record<string, string> = {
  titleType:        'Title type',
  encumbrance:      'Encumbrance',
  currentZoning:    'Current zoning',
  requiredRezoning: 'Required rezoning',
  bumiQuota:        'Bumi quota (est.)',
  legalCounsel:     'Legal counsel',
  titleArea:        'Title area',
}
function fieldLabel(key: string) {
  return FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
}
function statusClass(status: string) {
  if (status === 'ok')      return 'val-ok'
  if (status === 'pending') return 'val-pending'
  if (status === 'issue')   return 'val-issue'
  return ''
}
</script>

<style scoped>
.risk-tab { padding: 24px 28px; display: flex; flex-direction: column; gap: 16px; }

.hint { font-weight: 400; font-size: 10px; color: var(--faint); text-transform: none; letter-spacing: 0; }

/* ── Summary banner ── */
.risk-summary {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 14px 24px;
  box-shadow: var(--shadow); display: flex; align-items: center;
}
.rs-item    { display: flex; align-items: center; gap: 8px; flex: 1; justify-content: center; }
.rs-dot     { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.rs-num     { font-size: 20px; font-weight: 600; color: var(--text); line-height: 1; }
.rs-lbl     { font-size: 11px; color: var(--faint); text-transform: uppercase; letter-spacing: 0.06em; }
.rs-divider { width: 1px; height: 32px; background: var(--border); flex-shrink: 0; }

/* ── Grid ── */
.risk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.risk-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 20px;
  box-shadow: var(--shadow); display: flex; flex-direction: column;
}
.card-label {
  font-size: 11px; font-weight: 700; color: var(--faint);
  text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 14px;
}

.empty-state { font-size: 13px; color: var(--faint); text-align: center; padding: 20px 0; }

/* Severity group label */
.sev-group-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; padding: 6px 0 4px; margin-top: 4px;
}
.sev-red   { color: #A32D2D; }
.sev-amber { color: #854F0B; }
.sev-green { color: #0F6E56; }

/* Risk items */
.risk-item {
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  margin-bottom: 8px; cursor: pointer; transition: border-color 0.15s;
}
.risk-item:hover     { border-color: var(--border2); }
.risk-item--expanded { border-color: var(--blue); }

.risk-item-header {
  display: flex; align-items: flex-start; gap: 10px; padding: 11px 12px;
}

/* Severity dot — now a button */
.risk-dot {
  width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; margin-top: 3px;
  border: 2px solid transparent; cursor: pointer; padding: 0;
  transition: transform 0.15s, box-shadow 0.15s;
}
.risk-dot:hover  { transform: scale(1.35); box-shadow: 0 0 0 3px rgba(0,0,0,0.08); }
.dot-saving      { opacity: 0.4; pointer-events: none; }

.risk-main   { flex: 1; min-width: 0; }
.risk-title  { font-size: 13px; font-weight: 500; color: var(--text); line-height: 1.4; }
.risk-meta   { display: flex; align-items: center; gap: 8px; margin-top: 4px; flex-wrap: wrap; }
.risk-cat-badge {
  font-size: 10px; font-weight: 600; padding: 1px 7px;
  border-radius: 20px; background: var(--surface2); color: var(--muted);
  border: 1px solid var(--border);
}
.risk-owner   { font-size: 11px; color: var(--faint); }
.risk-chevron { font-size: 9px; color: var(--muted); flex-shrink: 0; margin-top: 3px; }

.risk-mitigation {
  font-size: 12px; color: var(--muted); line-height: 1.55;
  padding: 10px 12px 12px 36px;
  border-top: 1px solid var(--border);
}
.mit-label { font-weight: 600; color: var(--text); }

/* Severity dot colours */
.dot-red   { background: #DC2626; }
.dot-amber { background: #D97706; }
.dot-green { background: #059669; }

/* ── Legal status ── */
.legal-table { display: flex; flex-direction: column; }
.lr-row {
  display: flex; justify-content: space-between; align-items: baseline;
  gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--border);
}
.lr-row:last-child { border-bottom: none; }
.lr-key { font-size: 12px; color: var(--muted); flex-shrink: 0; }
.lr-val { font-size: 13px; font-weight: 500; color: var(--text); text-align: right; }

/* Clickable status value */
.lr-val-btn {
  background: transparent; border: none; cursor: pointer;
  font-family: 'DM Sans', sans-serif; padding: 2px 6px;
  border-radius: var(--radius-sm); transition: background 0.15s;
}
.lr-val-btn:hover { background: var(--surface2); }
.val-saving       { opacity: 0.4; pointer-events: none; }

.val-ok      { color: var(--green-txt); }
.val-pending { color: var(--amber); }
.val-issue   { color: #DC2626; }

.section-sep { height: 1px; background: var(--border); margin: 16px 0 14px; }

/* ── DD progress ── */
.dd-bar-wrap  { display: flex; align-items: center; gap: 10px; }
.dd-bar-track { flex: 1; height: 8px; background: var(--surface2); border-radius: 4px; overflow: hidden; }
.dd-bar-fill  { height: 100%; background: var(--blue); border-radius: 4px; transition: width 0.5s ease; }
.dd-pct       { font-size: 13px; font-weight: 600; color: var(--text); min-width: 34px; text-align: right; }
</style>
