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
        <div class="card-header-row">
          <div class="card-label">Risk Register</div>
          <button class="add-btn" @click="startAddRisk">+ Add Risk</button>
        </div>

        <div v-if="pending" class="empty-state">Loading…</div>
        <div v-else-if="risks.length === 0 && !addingRisk" class="empty-state">No risk items. Click + Add Risk to begin.</div>

        <!-- Add new risk form -->
        <div v-if="addingRisk" class="risk-edit-form risk-edit-form--new">
          <div class="form-row">
            <label class="form-lbl">Description</label>
            <textarea v-model="newRisk.description" class="form-input form-textarea" rows="2" placeholder="Describe the risk…" @keydown.esc="cancelAddRisk"></textarea>
          </div>
          <div class="form-row-2col">
            <div class="form-row">
              <label class="form-lbl">Category</label>
              <select v-model="newRisk.category" class="form-input form-select">
                <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="form-row">
              <label class="form-lbl">Severity</label>
              <select v-model="newRisk.severity" class="form-input form-select">
                <option value="red">High</option>
                <option value="amber">Medium</option>
                <option value="green">Low</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <label class="form-lbl">Owner</label>
            <select v-model="newRisk.owner" class="form-input form-select">
              <option value="">— Unassigned —</option>
              <optgroup v-if="teamInternal.length" label="Internal">
                <option v-for="m in teamInternal" :key="m.name" :value="m.name">{{ m.name }} · {{ m.role }}</option>
              </optgroup>
              <optgroup v-if="teamExternal.length" label="External">
                <option v-for="m in teamExternal" :key="m.name" :value="m.name">{{ m.name }} · {{ m.role }} ({{ m.firm }})</option>
              </optgroup>
            </select>
          </div>
          <div class="form-row">
            <label class="form-lbl">Mitigation</label>
            <textarea v-model="newRisk.mitigation" class="form-input form-textarea" rows="2" placeholder="Mitigation plan…" @keydown.esc="cancelAddRisk"></textarea>
          </div>
          <div class="form-actions">
            <button class="btn-save" :disabled="savingNew" @click="submitAddRisk">
              {{ savingNew ? 'Saving…' : 'Save' }}
            </button>
            <button class="btn-cancel" @click="cancelAddRisk">Cancel</button>
          </div>
        </div>

        <template v-for="sev in ['red', 'amber', 'green']" :key="sev">
          <template v-if="bySeverity(sev).length > 0">
            <div class="sev-group-label" :class="`sev-${sev}`">
              {{ sev === 'red' ? 'High' : sev === 'amber' ? 'Medium' : 'Low' }}
            </div>
            <div
              v-for="risk in bySeverity(sev)"
              :key="risk.id"
              class="risk-item"
              :class="{ 'risk-item--expanded': expanded === risk.id || editingRisk === risk.id }"
            >
              <div class="risk-item-header" @click="editingRisk !== risk.id && toggle(risk.id)">
                <!-- Severity dot — click to cycle -->
                <button
                  class="risk-dot"
                  :class="[`dot-${risk.severity}`, savingRisk === risk.id ? 'dot-saving' : '']"
                  :title="`Severity: ${risk.severity} — click to change`"
                  @click.stop="editingRisk !== risk.id && cycleSeverity(risk)"
                ></button>
                <div class="risk-main">
                  <div class="risk-title">{{ risk.description }}</div>
                  <div class="risk-meta">
                    <span class="risk-cat-badge">{{ risk.category }}</span>
                    <span class="risk-owner">{{ risk.owner }}</span>
                  </div>
                </div>
                <div class="risk-actions" @click.stop>
                  <template v-if="confirmDeleteRisk === risk.id">
                    <span class="confirm-lbl">Delete?</span>
                    <button class="icon-btn icon-btn--confirm-yes" @click="deleteRisk(risk)">Yes</button>
                    <button class="icon-btn" @click="confirmDeleteRisk = null">No</button>
                  </template>
                  <template v-else>
                    <button class="icon-btn" title="Edit" @click="startEditRisk(risk)">✎</button>
                    <button
                      class="icon-btn icon-btn--danger"
                      :class="{ 'icon-btn--saving': deletingRisk === risk.id }"
                      title="Delete"
                      @click="confirmDeleteRisk = risk.id"
                    >✕</button>
                  </template>
                </div>
                <span v-if="editingRisk !== risk.id" class="risk-chevron">{{ expanded === risk.id ? '▲' : '▼' }}</span>
              </div>

              <!-- Inline edit form -->
              <div v-if="editingRisk === risk.id" class="risk-edit-form">
                <div class="form-row">
                  <label class="form-lbl">Description</label>
                  <textarea v-model="editDraft.description" class="form-input form-textarea" rows="2" @keydown.esc="cancelEditRisk"></textarea>
                </div>
                <div class="form-row-2col">
                  <div class="form-row">
                    <label class="form-lbl">Category</label>
                    <select v-model="editDraft.category" class="form-input form-select">
                      <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
                    </select>
                  </div>
                  <div class="form-row">
                    <label class="form-lbl">Severity</label>
                    <select v-model="editDraft.severity" class="form-input form-select">
                      <option value="red">High</option>
                      <option value="amber">Medium</option>
                      <option value="green">Low</option>
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <label class="form-lbl">Owner</label>
                  <select v-model="editDraft.owner" class="form-input form-select">
                    <option value="">— Unassigned —</option>
                    <optgroup v-if="teamInternal.length" label="Internal">
                      <option v-for="m in teamInternal" :key="m.name" :value="m.name">{{ m.name }} · {{ m.role }}</option>
                    </optgroup>
                    <optgroup v-if="teamExternal.length" label="External">
                      <option v-for="m in teamExternal" :key="m.name" :value="m.name">{{ m.name }} · {{ m.role }} ({{ m.firm }})</option>
                    </optgroup>
                    <!-- Preserve existing owner if not in team list -->
                    <option v-if="editDraft.owner && !allTeamNames.includes(editDraft.owner)" :value="editDraft.owner">{{ editDraft.owner }}</option>
                  </select>
                </div>
                <div class="form-row">
                  <label class="form-lbl">Mitigation</label>
                  <textarea v-model="editDraft.mitigation" class="form-input form-textarea" rows="2" @keydown.esc="cancelEditRisk"></textarea>
                </div>
                <div class="form-actions">
                  <button class="btn-save" :disabled="savingEdit" @click="submitEditRisk(risk.id)">
                    {{ savingEdit ? 'Saving…' : 'Save' }}
                  </button>
                  <button class="btn-cancel" @click="cancelEditRisk">Cancel</button>
                </div>
              </div>

              <!-- Mitigation read-only (collapsed view) -->
              <div v-else-if="expanded === risk.id" class="risk-mitigation">
                <span class="mit-label">Mitigation: </span>{{ risk.mitigation || '—' }}
              </div>
            </div>
          </template>
        </template>
      </div>

      <!-- ── RIGHT: LEGAL STATUS + KEY DATES ── -->
      <div class="risk-card">

        <!-- Legal Status -->
        <div class="card-header-row">
          <div class="card-label">Legal Status</div>
          <button class="add-btn" @click="startAddLegal">+ Add Field</button>
        </div>

        <!-- Add new legal field form -->
        <div v-if="addingLegal" class="legal-add-form">
          <input v-model="newLegalKey" class="form-input" type="text" placeholder="Field name (e.g. Solicitor)" @keydown.esc="cancelAddLegal" @keydown.enter="submitAddLegal" />
          <input v-model="newLegalVal" class="form-input" type="text" placeholder="Value" @keydown.esc="cancelAddLegal" @keydown.enter="submitAddLegal" />
          <div class="form-actions">
            <button class="btn-save" :disabled="savingLegalAdd" @click="submitAddLegal">{{ savingLegalAdd ? 'Saving…' : 'Add' }}</button>
            <button class="btn-cancel" @click="cancelAddLegal">Cancel</button>
          </div>
        </div>

        <div class="legal-table">
          <div v-for="(field, key) in legalFields" :key="key" class="lr-row">
            <span class="lr-key">{{ fieldLabel(String(key)) }}</span>
            <div class="lr-right">
              <!-- Inline editable value -->
              <template v-if="editingLegalKey === String(key)">
                <select
                  v-if="DROPDOWN_FIELDS[String(key)]"
                  v-model="legalEditVal"
                  class="form-input form-select lr-input"
                  @change="saveLegalValue(String(key), field)"
                  @keydown.esc="cancelLegalEdit"
                  ref="legalInputRef"
                >
                  <option v-for="opt in DROPDOWN_FIELDS[String(key)]" :key="opt" :value="opt">{{ opt }}</option>
                </select>
                <input
                  v-else
                  v-model="legalEditVal"
                  class="form-input lr-input"
                  type="text"
                  @keydown.enter="saveLegalValue(String(key), field)"
                  @keydown.esc="cancelLegalEdit"
                  @blur="saveLegalValue(String(key), field)"
                  ref="legalInputRef"
                />
              </template>
              <span
                v-else
                class="lr-val lr-val-editable"
                :class="statusClass(field.status)"
                title="Click to edit"
                @click="startLegalEdit(String(key), field.value)"
              >{{ field.value }}</span>
              <!-- Status cycle button -->
              <button
                class="status-dot"
                :class="[`dot-${field.status === 'ok' ? 'green' : field.status === 'pending' ? 'amber' : 'red'}`, savingLegal === key ? 'dot-saving' : '']"
                :title="`Status: ${field.status} — click to cycle`"
                @click="cycleLegalStatus(String(key), field)"
              ></button>
              <!-- Delete field button -->
              <template v-if="confirmDeleteLegal === String(key)">
                <button class="icon-btn icon-btn--confirm-yes icon-btn--sm" @click="deleteLegalField(String(key))">Yes</button>
                <button class="icon-btn icon-btn--sm" @click="confirmDeleteLegal = null">No</button>
              </template>
              <button v-else class="icon-btn icon-btn--danger icon-btn--sm" title="Remove field" @click="confirmDeleteLegal = String(key)">✕</button>
            </div>
          </div>
        </div>

        <!-- Key Dates -->
        <template v-if="keyDates.length > 0">
          <div class="section-sep"></div>
          <div class="card-label">Key Dates <span class="hint">· click value to edit · click dot to change status</span></div>
          <div class="legal-table">
            <div v-for="(kd, idx) in keyDates" :key="kd.label" class="lr-row">
              <span class="lr-key">{{ kd.label }}</span>
              <div class="lr-right">
                <template v-if="editingDateIdx === idx">
                  <input
                    v-model="dateEditVal"
                    class="form-input lr-input"
                    type="text"
                    @keydown.enter="saveDateValue(idx, kd)"
                    @keydown.esc="cancelDateEdit"
                    @blur="saveDateValue(idx, kd)"
                  />
                </template>
                <span
                  v-else
                  class="lr-val lr-val-editable"
                  :class="statusClass(kd.status)"
                  title="Click to edit"
                  @click="startDateEdit(idx, kd.date)"
                >{{ kd.date }}</span>
                <button
                  class="status-dot"
                  :class="[`dot-${kd.status === 'ok' ? 'green' : kd.status === 'pending' ? 'amber' : 'red'}`, savingDate === idx ? 'dot-saving' : '']"
                  :title="`Status: ${kd.status} — click to cycle`"
                  @click="cycleDateStatus(idx, kd)"
                ></button>
              </div>
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

const emit = defineEmits<{ (e: 'meta-updated', meta: any): void }>()

// ─────────────────────────────────────────────
// Risk data
// ─────────────────────────────────────────────
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

// ── Severity cycle ──────────────────────────
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

// ── Add risk ────────────────────────────────
const CATEGORIES = ['Title', 'Market', 'Construction', 'Regulatory', 'Financial', 'Environmental', 'General']
const addingRisk = ref(false)
const savingNew  = ref(false)
const newRisk    = reactive({ description: '', category: 'General', severity: 'amber', owner: '', mitigation: '' })

function startAddRisk() {
  addingRisk.value = true
  editingRisk.value = null
  expanded.value = null
  Object.assign(newRisk, { description: '', category: 'General', severity: 'amber', owner: '', mitigation: '' })
}
function cancelAddRisk() { addingRisk.value = false }

async function submitAddRisk() {
  if (!newRisk.description.trim()) return
  savingNew.value = true
  try {
    await $fetch(`/api/${props.dealId}/risk`, { method: 'POST', body: { ...newRisk } })
    await refreshRisk()
    addingRisk.value = false
  } finally {
    savingNew.value = false
  }
}

// ── Edit risk ───────────────────────────────
const editingRisk = ref<string | null>(null)
const savingEdit  = ref(false)
const editDraft   = reactive({ description: '', category: '', severity: '', owner: '', mitigation: '' })

function startEditRisk(risk: any) {
  editingRisk.value = risk.id
  expanded.value = risk.id
  addingRisk.value = false
  Object.assign(editDraft, {
    description: risk.description,
    category:    risk.category,
    severity:    risk.severity,
    owner:       risk.owner,
    mitigation:  risk.mitigation,
  })
}
function cancelEditRisk() { editingRisk.value = null }

async function submitEditRisk(id: string) {
  savingEdit.value = true
  try {
    await $fetch(`/api/${props.dealId}/risk/${id}`, { method: 'PUT', body: { ...editDraft } })
    await refreshRisk()
    editingRisk.value = null
  } finally {
    savingEdit.value = false
  }
}

// ── Delete risk ─────────────────────────────
const deletingRisk     = ref<string | null>(null)
const confirmDeleteRisk = ref<string | null>(null)

async function deleteRisk(risk: any) {
  confirmDeleteRisk.value = null
  deletingRisk.value = risk.id
  try {
    await $fetch(`/api/${props.dealId}/risk/${risk.id}`, { method: 'DELETE' })
    if (expanded.value === risk.id) expanded.value = null
    if (editingRisk.value === risk.id) editingRisk.value = null
    await refreshRisk()
  } finally {
    deletingRisk.value = null
  }
}

// ─────────────────────────────────────────────
// Legal status
// ─────────────────────────────────────────────
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

// ── Status cycle ────────────────────────────
const STATUS_CYCLE = ['ok', 'pending', 'issue']
const savingLegal  = ref<string | null>(null)
const savingDate   = ref<number | null>(null)

async function saveMeta(patch: any) {
  await $fetch(`/api/${props.dealId}/meta`, {
    method: 'PUT',
    body: { ...props.meta, ...patch },
  })
  emit('meta-updated', { ...props.meta, ...patch })
}

async function cycleLegalStatus(key: string, field: { value: string; status: string }) {
  if (savingLegal.value) return
  const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(field.status) + 1) % STATUS_CYCLE.length]
  savingLegal.value = key
  try {
    const updatedLegal = { ...props.meta?.legalStatus, [key]: { ...field, status: next } }
    await saveMeta({ legalStatus: updatedLegal })
  } finally {
    savingLegal.value = null
  }
}

async function cycleDateStatus(idx: number, kd: any) {
  if (savingDate.value !== null) return
  const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(kd.status) + 1) % STATUS_CYCLE.length]
  savingDate.value = idx
  try {
    const updatedDates = [...(props.meta?.keyDates ?? [])]
    updatedDates[idx] = { ...kd, status: next }
    await saveMeta({ keyDates: updatedDates })
  } finally {
    savingDate.value = null
  }
}

// ── Edit legal value ─────────────────────────
const editingLegalKey = ref<string | null>(null)
const legalEditVal    = ref('')
const savingLegalVal  = ref(false)
const legalInputRef   = ref<HTMLInputElement | null>(null)

function startLegalEdit(key: string, currentVal: string) {
  editingLegalKey.value = key
  legalEditVal.value = currentVal
  nextTick(() => {
    if (legalInputRef.value) {
      const el = Array.isArray(legalInputRef.value) ? legalInputRef.value[0] : legalInputRef.value
      el?.focus()
    }
  })
}
function cancelLegalEdit() { editingLegalKey.value = null }

async function saveLegalValue(key: string, field: { value: string; status: string }) {
  if (editingLegalKey.value !== key) return
  const trimmed = legalEditVal.value.trim()
  if (!trimmed || trimmed === field.value) { editingLegalKey.value = null; return }
  savingLegalVal.value = true
  try {
    const updatedLegal = { ...props.meta?.legalStatus, [key]: { ...field, value: trimmed } }
    await saveMeta({ legalStatus: updatedLegal })
    editingLegalKey.value = null
  } finally {
    savingLegalVal.value = false
  }
}

// ── Add legal field ──────────────────────────
const addingLegal    = ref(false)
const newLegalKey    = ref('')
const newLegalVal    = ref('')
const savingLegalAdd = ref(false)

function startAddLegal() { addingLegal.value = true; newLegalKey.value = ''; newLegalVal.value = '' }
function cancelAddLegal() { addingLegal.value = false }

async function submitAddLegal() {
  const rawKey = newLegalKey.value.trim()
  const val    = newLegalVal.value.trim()
  if (!rawKey || !val) return
  // Convert "My Field" → "myField" camelCase key
  const key = rawKey.replace(/\s+(.)/g, (_, c) => c.toUpperCase()).replace(/^\w/, c => c.toLowerCase())
  savingLegalAdd.value = true
  try {
    const updatedLegal = { ...props.meta?.legalStatus, [key]: { value: val, status: 'ok' } }
    await saveMeta({ legalStatus: updatedLegal })
    addingLegal.value = false
  } finally {
    savingLegalAdd.value = false
  }
}

// ── Delete legal field ───────────────────────
const confirmDeleteLegal = ref<string | null>(null)

async function deleteLegalField(key: string) {
  confirmDeleteLegal.value = null
  const updatedLegal = { ...props.meta?.legalStatus }
  delete updatedLegal[key]
  await saveMeta({ legalStatus: updatedLegal })
}

// ── Edit key date value ──────────────────────
const editingDateIdx = ref<number | null>(null)
const dateEditVal    = ref('')

function startDateEdit(idx: number, currentVal: string) {
  editingDateIdx.value = idx
  dateEditVal.value = currentVal
}
function cancelDateEdit() { editingDateIdx.value = null }

async function saveDateValue(idx: number, kd: any) {
  if (editingDateIdx.value !== idx) return
  const trimmed = dateEditVal.value.trim()
  if (!trimmed || trimmed === kd.date) { editingDateIdx.value = null; return }
  try {
    const updatedDates = [...(props.meta?.keyDates ?? [])]
    updatedDates[idx] = { ...kd, date: trimmed }
    await saveMeta({ keyDates: updatedDates })
    editingDateIdx.value = null
  } catch {}
}

// ── Team members (for owner dropdown) ───────
const teamInternal = computed(() => props.meta?.team?.internal ?? [])
const teamExternal = computed(() => props.meta?.team?.external ?? [])
const allTeamNames = computed(() => [
  ...teamInternal.value.map((m: any) => m.name),
  ...teamExternal.value.map((m: any) => m.name),
])

// ── Helpers ──────────────────────────────────
const FIELD_LABELS: Record<string, string> = {
  titleType:        'Title type',
  titleLandUse:     'Title land use',
  encumbrance:      'Encumbrance',
  currentZoning:    'Current zoning',
  zoning:           'Zoning',
  requiredRezoning: 'Required rezoning',
  bumiQuota:        'Bumi quota (est.)',
  legalCounsel:     'Legal counsel',
  titleArea:        'Title area',
}

// Fields that use a dropdown in the inline editor, keyed by field name
const DROPDOWN_FIELDS: Record<string, string[]> = {
  titleLandUse: ['Residential', 'Commercial', 'Industrial', 'Agricultural'],
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

.card-header-row {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;
}
.card-label {
  font-size: 11px; font-weight: 700; color: var(--faint);
  text-transform: uppercase; letter-spacing: 0.08em;
}

.empty-state { font-size: 13px; color: var(--faint); text-align: center; padding: 20px 0; }

/* ── Add button ── */
.add-btn {
  font-size: 11px; font-weight: 600; color: var(--blue);
  background: transparent; border: 1px solid var(--blue);
  border-radius: var(--radius-sm); padding: 3px 10px; cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.add-btn:hover { background: var(--blue); color: #fff; }

/* ── Severity group label ── */
.sev-group-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; padding: 6px 0 4px; margin-top: 4px;
}
.sev-red   { color: #A32D2D; }
.sev-amber { color: #854F0B; }
.sev-green { color: #0F6E56; }

/* ── Risk items ── */
.risk-item {
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  margin-bottom: 8px; transition: border-color 0.15s;
}
.risk-item:hover     { border-color: var(--border2); }
.risk-item--expanded { border-color: var(--blue); }

.risk-item-header {
  display: flex; align-items: flex-start; gap: 10px; padding: 11px 12px; cursor: pointer;
}

/* Severity dot */
.risk-dot {
  width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; margin-top: 3px;
  border: 2px solid transparent; cursor: pointer; padding: 0;
  transition: transform 0.15s, box-shadow 0.15s;
}
.risk-dot:hover { transform: scale(1.35); box-shadow: 0 0 0 3px rgba(0,0,0,0.08); }
.dot-saving     { opacity: 0.4; pointer-events: none; }

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

/* Action icon buttons */
.risk-actions { display: flex; gap: 4px; align-items: center; flex-shrink: 0; }
.icon-btn {
  background: transparent; border: none; cursor: pointer;
  font-size: 13px; color: var(--muted); padding: 2px 5px;
  border-radius: var(--radius-sm); line-height: 1;
  transition: background 0.15s, color 0.15s;
}
.icon-btn:hover         { background: var(--surface2); color: var(--text); }
.icon-btn--danger:hover  { background: #FEE2E2; color: #DC2626; }
.icon-btn--confirm-yes   { color: #DC2626; font-weight: 700; font-size: 11px; }
.icon-btn--confirm-yes:hover { background: #FEE2E2; color: #DC2626; }
.confirm-lbl { font-size: 11px; color: #DC2626; font-weight: 600; white-space: nowrap; }
.icon-btn--saving       { opacity: 0.4; pointer-events: none; }
.icon-btn--sm           { font-size: 11px; padding: 1px 4px; }

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

/* ── Inline edit forms ── */
.risk-edit-form {
  border-top: 1px solid var(--border); padding: 14px 12px 12px;
  display: flex; flex-direction: column; gap: 10px;
}
.risk-edit-form--new {
  border: 1px solid var(--blue); border-radius: var(--radius-sm);
  margin-bottom: 12px; padding: 14px 12px; background: var(--surface2);
}
.form-row { display: flex; flex-direction: column; gap: 4px; }
.form-row-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.form-lbl { font-size: 10px; font-weight: 700; color: var(--faint); text-transform: uppercase; letter-spacing: 0.06em; }
.form-input {
  font-size: 13px; color: var(--text); background: var(--surface);
  border: 1px solid var(--border2); border-radius: var(--radius-sm);
  padding: 6px 8px; font-family: 'DM Sans', sans-serif; width: 100%;
  box-sizing: border-box; outline: none;
}
.form-input:focus { border-color: var(--blue); }
.form-textarea { resize: vertical; min-height: 52px; }
.form-select   { cursor: pointer; }
.form-actions  { display: flex; gap: 8px; margin-top: 2px; }

.btn-save {
  font-size: 12px; font-weight: 600; padding: 5px 14px;
  background: var(--blue); color: #fff; border: none;
  border-radius: var(--radius-sm); cursor: pointer;
  transition: opacity 0.15s;
}
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-cancel {
  font-size: 12px; font-weight: 500; padding: 5px 12px;
  background: transparent; color: var(--muted);
  border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer;
}
.btn-cancel:hover { background: var(--surface2); }

/* ── Legal status ── */
.legal-table { display: flex; flex-direction: column; }
.lr-row {
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--border);
}
.lr-row:last-child { border-bottom: none; }
.lr-key   { font-size: 12px; color: var(--muted); flex-shrink: 0; }
.lr-right { display: flex; align-items: center; gap: 6px; flex: 1; justify-content: flex-end; }
.lr-val   { font-size: 13px; font-weight: 500; color: var(--text); text-align: right; }

.lr-val-editable {
  cursor: text; border-radius: var(--radius-sm); padding: 2px 5px;
  transition: background 0.15s;
}
.lr-val-editable:hover { background: var(--surface2); }

.lr-input {
  width: 130px; font-size: 13px; font-weight: 500; padding: 3px 6px;
  text-align: right; border-radius: var(--radius-sm);
}
select.lr-input {
  text-align: center;
}

/* Status dot on legal rows */
.status-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid transparent; cursor: pointer; padding: 0;
  transition: transform 0.15s, box-shadow 0.15s;
}
.status-dot:hover { transform: scale(1.4); box-shadow: 0 0 0 3px rgba(0,0,0,0.08); }

.val-ok      { color: var(--green-txt); }
.val-pending { color: var(--amber); }
.val-issue   { color: #DC2626; }

/* Legal add form */
.legal-add-form {
  display: flex; flex-direction: column; gap: 8px;
  border: 1px solid var(--blue); border-radius: var(--radius-sm);
  padding: 12px; margin-bottom: 12px; background: var(--surface2);
}

.section-sep { height: 1px; background: var(--border); margin: 16px 0 14px; }

/* ── DD progress ── */
.dd-bar-wrap  { display: flex; align-items: center; gap: 10px; }
.dd-bar-track { flex: 1; height: 8px; background: var(--surface2); border-radius: 4px; overflow: hidden; }
.dd-bar-fill  { height: 100%; background: var(--blue); border-radius: 4px; transition: width 0.5s ease; }
.dd-pct       { font-size: 13px; font-weight: 600; color: var(--text); min-width: 34px; text-align: right; }
</style>
