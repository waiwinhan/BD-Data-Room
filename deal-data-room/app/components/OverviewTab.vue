<template>
  <div class="overview">

    <!-- ── KPI CARDS ROW ── -->
    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label">LAND AREA</div>
        <div class="kpi-value">{{ meta?.landArea }} ac</div>
        <div class="kpi-sub">{{ meta?.tenure }} title</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">NET DEV VALUE (NDV)</div>
        <div class="kpi-value">RM {{ fin?.ndv }}M</div>
        <div class="kpi-sub">After S&amp;M (RM {{ fin?.blendedPSF ?? deal?.blendedPSF }} psf)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">LAND COST</div>
        <div class="kpi-value">RM {{ fin?.landCost ?? deal?.landCost }}M</div>
        <div class="kpi-sub">RM {{ fin?.landPSF ?? deal?.landCostPSF }} psf land</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">CONSTRUCTION COST</div>
        <div class="kpi-value">RM {{ fin?.constr }}M</div>
        <div class="kpi-sub">Hard cost only</div>
      </div>
      <div class="kpi-card" :class="ndpClass">
        <div class="kpi-label">NET DEV PROFIT (NDP)</div>
        <div class="kpi-value" :class="ndpClass">RM {{ fin?.ndp }}M</div>
        <div class="kpi-sub" :class="ndpClass">{{ fin?.ndpMargin?.toFixed(1) }}% on NDV</div>
      </div>
    </div>

    <!-- ── THREE-COLUMN GRID ── -->
    <div class="overview-grid">

      <!-- ── LEFT: Site Location ── -->
      <div class="ov-card location-card">
        <div class="card-header">
          <span class="card-title">Site Location</span>
          <a
            :href="`https://maps.google.com/?q=${meta?.coordinates?.lat},${meta?.coordinates?.lng}`"
            target="_blank"
            class="open-map-btn"
          >Open ↗</a>
        </div>

        <!-- Map embed (view mode only) -->
        <div v-if="!editMode" class="map-wrap">
          <div ref="siteMapEl" class="map-leaflet" />
          <div class="map-overlay">
            <div class="map-parcel-name">{{ meta?.name }}</div>
            <div class="map-parcel-sub">{{ meta?.location }}</div>
          </div>
        </div>

        <!-- Coordinates (edit mode) -->
        <div v-if="editMode" class="edit-coords-block">
          <div class="edit-field-label">Coordinates</div>
          <div class="edit-coords-row">
            <div class="edit-coord-item">
              <span class="edit-coord-prefix">Lat</span>
              <input v-model.number="meta.coordinates.lat" type="number" step="0.0001" class="edit-input edit-coord-input" />
            </div>
            <div class="edit-coord-item">
              <span class="edit-coord-prefix">Lng</span>
              <input v-model.number="meta.coordinates.lng" type="number" step="0.0001" class="edit-input edit-coord-input" />
            </div>
          </div>
          <div class="edit-field-label" style="margin-top:10px">Location text</div>
          <input v-model="meta.location" class="edit-input" style="width:100%" placeholder="e.g. Permas Jaya, Johor Bahru" />
        </div>

        <!-- Coordinate pills (view mode) -->
        <div v-if="!editMode" class="coord-pills">
          <span class="coord-pill">{{ meta?.coordinates?.lat?.toFixed(4) }}°N</span>
          <span class="coord-pill">{{ meta?.coordinates?.lng?.toFixed(4) }}°E</span>
          <span class="coord-pill">{{ meta?.location?.split(',').pop()?.trim() }}</span>
        </div>

        <!-- ── Key Proximities ── -->
        <div class="proximities">
          <div class="prox-header">
            <div class="prox-title">Key Proximities</div>
            <!-- Auto-suggest button (edit mode only) -->
            <button
              v-if="editMode"
              class="btn-autosuggest"
              :disabled="suggesting"
              @click="autoSuggest"
            >
              {{ suggesting ? 'Fetching…' : '✦ Auto-suggest' }}
            </button>
          </div>

          <!-- Suggest error -->
          <div v-if="suggestError" class="suggest-error">{{ suggestError }}</div>

          <!-- Legend -->
          <div class="prox-legend">
            <span class="prox-legend-item"><span class="prox-dot prox-dot-green" />Transport</span>
            <span class="prox-legend-item"><span class="prox-dot prox-dot-blue" />Mall / Hospital</span>
            <span class="prox-legend-item"><span class="prox-dot prox-dot-amber" />Education / Landmark</span>
            <span class="prox-legend-item"><span class="prox-dot prox-dot-grey" />Other</span>
          </div>

          <!-- View mode list -->
          <template v-if="!editMode">
            <div v-for="p in meta?.proximities" :key="p.label" class="prox-row">
              <span class="prox-dot" :class="`prox-dot-${p.color}`" />
              <span class="prox-label">{{ p.label }}</span>
              <span class="prox-dist">{{ p.distance }}</span>
            </div>
          </template>

          <!-- Edit mode list -->
          <template v-else>
            <div
              v-for="(p, i) in meta.proximities"
              :key="i"
              class="prox-edit-row"
            >
              <select v-model="p.color" class="edit-select prox-color-select">
                <option value="green">🟢</option>
                <option value="blue">🔵</option>
                <option value="amber">🟡</option>
                <option value="grey">⚫</option>
              </select>
              <input v-model="p.label" class="edit-input prox-label-input" placeholder="Place name" />
              <input v-model="p.distance" class="edit-input prox-dist-input" placeholder="1.2 km" />
              <button class="btn-delete-row" title="Remove" @click="removeProximity(i)">✕</button>
            </div>
            <button class="btn-add-row" @click="addProximity">+ Add proximity</button>
          </template>
        </div>
      </div>

      <!-- ── CENTRE: DD Milestones ── -->
      <div class="ov-card">
        <div class="card-header">
          <span class="card-title">DD Milestones</span>
          <span class="milestone-count">{{ doneCount }}/{{ meta?.milestones?.length }} done</span>
        </div>

        <!-- View mode -->
        <template v-if="!editMode">
          <div class="milestones-list">
            <div v-for="m in meta?.milestones" :key="m.label" class="milestone-row">
              <div class="ms-track">
                <span class="ms-dot" :class="`ms-dot-${m.status}`" />
              </div>
              <div class="ms-content">
                <div class="ms-label">{{ m.label }}</div>
                <div class="ms-date">{{ m.date }}</div>
              </div>
              <span class="ms-badge" :class="`ms-badge-${m.status}`">
                {{ statusLabel(m.status) }}
              </span>
            </div>
          </div>
        </template>

        <!-- Edit mode milestones -->
        <template v-else>
          <div class="milestones-edit-list">
            <div v-for="(m, i) in meta.milestones" :key="i" class="ms-edit-row">
              <select v-model="m.status" class="edit-select ms-status-select">
                <option value="done">Done</option>
                <option value="active">In Progress</option>
                <option value="pending">Pending</option>
              </select>
              <input v-model="m.label" class="edit-input ms-label-input" placeholder="Milestone" />
              <input v-model="m.date" class="edit-input ms-date-input" placeholder="15 Apr 2026" />
              <button class="btn-delete-row" @click="removeMilestone(i)">✕</button>
            </div>
          </div>
          <button class="btn-add-row" @click="addMilestone">+ Add milestone</button>
        </template>

        <!-- Legal status -->
        <div class="legal-block">
          <div class="legal-title">Legal Status</div>
          <template v-if="!editMode">
            <div class="legal-grid">
              <div class="legal-item">
                <div class="legal-key">Title Type</div>
                <div class="legal-val">{{ lsGet('titleType') }}</div>
              </div>
              <div class="legal-item">
                <div class="legal-key">Encumbrance</div>
                <div class="legal-val">{{ lsGet('encumbrance') }}</div>
              </div>
              <div class="legal-item">
                <div class="legal-key">Zoning</div>
                <div class="legal-val">{{ lsZoning() }}</div>
              </div>
              <div class="legal-item">
                <div class="legal-key">Bumi Quota</div>
                <div class="legal-val">{{ lsGet('bumiQuota') }}</div>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="legal-edit-grid">
              <div class="legal-edit-item">
                <div class="edit-field-label">Title Type</div>
                <input :value="lsGet('titleType')" class="edit-input" placeholder="e.g. Geran Mukim" @input="lsSet('titleType', ($event.target as HTMLInputElement).value)" />
              </div>
              <div class="legal-edit-item">
                <div class="edit-field-label">Encumbrance</div>
                <input :value="lsGet('encumbrance')" class="edit-input" placeholder="e.g. Nil" @input="lsSet('encumbrance', ($event.target as HTMLInputElement).value)" />
              </div>
              <div class="legal-edit-item">
                <div class="edit-field-label">Zoning</div>
                <input :value="lsZoning()" class="edit-input" placeholder="e.g. Commercial (C2)" @input="lsSetZoning(($event.target as HTMLInputElement).value)" />
              </div>
              <div class="legal-edit-item">
                <div class="edit-field-label">Bumi Quota</div>
                <input :value="lsGet('bumiQuota')" class="edit-input" placeholder="e.g. 30%" @input="lsSet('bumiQuota', ($event.target as HTMLInputElement).value)" />
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- ── RIGHT: Dev Mix + Assumptions ── -->
      <div class="ov-card">
        <div class="card-header">
          <span class="card-title">Development Mix</span>
        </div>

        <!-- View mode dev mix -->
        <template v-if="!editMode">
          <div class="devmix-list">
            <div v-for="(item, i) in meta?.devMix" :key="item.type" class="devmix-row">
              <div class="devmix-top">
                <span class="devmix-type">{{ item.type }}</span>
                <span class="devmix-pct">{{ item.pct }}%</span>
              </div>
              <div class="devmix-bar-bg">
                <div class="devmix-bar-fill" :style="{ width: item.pct + '%', background: devMixColor(i) }" />
              </div>
              <div class="devmix-sub">
                {{ item.units ? item.units + ' units' : '' }}{{ item.units && item.sqft ? ' · ' : '' }}{{ item.sqft ? item.sqft.toLocaleString() + ' sqft' : '' }}
              </div>
            </div>
          </div>
        </template>

        <!-- Edit mode dev mix -->
        <template v-else>
          <div class="devmix-edit-list">
            <div v-for="(item, i) in meta.devMix" :key="i" class="devmix-edit-row">
              <input v-model="item.type" class="edit-input devmix-type-input" placeholder="Type" />
              <input v-model.number="item.pct" type="number" min="0" max="100" class="edit-input devmix-pct-input" placeholder="%" />
              <span class="edit-meta-unit">%</span>
              <input v-model.number="item.units" type="number" class="edit-input devmix-units-input" placeholder="units" />
              <button class="btn-delete-row" @click="removeDevMix(i)">✕</button>
            </div>
          </div>
          <button class="btn-add-row" @click="addDevMix">+ Add component</button>
        </template>

        <!-- Key Assumptions -->
        <div class="assumptions-block">
          <div class="card-title" style="margin-bottom:10px">Key Assumptions</div>

          <!-- View mode -->
          <template v-if="!editMode">
            <div class="assumptions-grid">
              <div v-for="a in meta?.assumptions" :key="a.label" class="assumption-item">
                <div class="assumption-label">{{ a.label }}</div>
                <div class="assumption-value">{{ a.value }}</div>
              </div>
            </div>
          </template>

          <!-- Edit mode -->
          <template v-else>
            <div class="assumptions-edit-list">
              <div v-for="(a, i) in meta.assumptions" :key="i" class="assumption-edit-row">
                <input v-model="a.label" class="edit-input assump-label-input" placeholder="Label" />
                <input v-model="a.value" class="edit-input assump-value-input" placeholder="Value" />
                <button class="btn-delete-row" @click="removeAssumption(i)">✕</button>
              </div>
            </div>
            <button class="btn-add-row" @click="addAssumption">+ Add assumption</button>
          </template>
        </div>
      </div>

    </div>

    <!-- ── SWOT ANALYSIS ── -->
    <div class="swot-section">
      <div class="swot-header">
        <div class="swot-title-block">
          <span class="swot-title">SWOT Analysis</span>
          <span v-if="swot?.generatedAt" class="swot-timestamp">
            <span v-if="swot.isDemo" class="swot-demo-badge">Demo</span>
            <span v-else>Generated {{ formatSwotDate(swot.generatedAt) }}</span>
            <span v-if="swot.docsAnalysed" class="swot-docs-badge">{{ swot.docsAnalysed }} doc{{ swot.docsAnalysed > 1 ? 's' : '' }} analysed</span>
          </span>
        </div>
        <div class="swot-actions">
          <template v-if="editingSwot">
            <button class="btn-swot-action btn-save" :disabled="swotSaving" @click="saveSwot">{{ swotSaving ? 'Saving…' : 'Save' }}</button>
            <button class="btn-swot-action btn-cancel" @click="cancelEditSwot">Cancel</button>
          </template>
          <template v-else>
            <button class="btn-swot-action btn-edit" @click="startEditSwot">{{ swot ? 'Edit' : 'Add Manually' }}</button>
            <button class="btn-generate" :disabled="generating" @click="generateSwot">
              <span v-if="generating" class="gen-spinner"></span>
              <span v-else>✦</span>
              {{ generating ? 'Analysing…' : swot ? 'Regenerate' : 'Generate AI Analysis' }}
            </button>
          </template>
        </div>
      </div>
      <div class="ai-disclaimer">⚠ AI can make mistakes. Please double-check the responses.</div>

      <div v-if="swotError" class="swot-error">{{ swotError }}</div>

      <!-- View mode -->
      <div v-if="swot && !editingSwot" class="swot-grid">
        <div class="swot-card swot-s">
          <div class="swot-card-label">💪 Strengths</div>
          <ul class="swot-list">
            <li v-for="(pt, i) in (swot?.swot?.strengths ?? [])" :key="i">{{ pt }}</li>
          </ul>
        </div>
        <div class="swot-card swot-w">
          <div class="swot-card-label">⚠ Weaknesses</div>
          <ul class="swot-list">
            <li v-for="(pt, i) in (swot?.swot?.weaknesses ?? [])" :key="i">{{ pt }}</li>
          </ul>
        </div>
        <div class="swot-card swot-o">
          <div class="swot-card-label">🚀 Opportunities</div>
          <ul class="swot-list">
            <li v-for="(pt, i) in (swot?.swot?.opportunities ?? [])" :key="i">{{ pt }}</li>
          </ul>
        </div>
        <div class="swot-card swot-t">
          <div class="swot-card-label">⚡ Threats</div>
          <ul class="swot-list">
            <li v-for="(pt, i) in (swot?.swot?.threats ?? [])" :key="i">{{ pt }}</li>
          </ul>
        </div>
      </div>

      <!-- Edit mode -->
      <div v-else-if="editingSwot" class="swot-grid">
        <div class="swot-card swot-s">
          <div class="swot-card-label">💪 Strengths</div>
          <textarea class="swot-edit-area" v-model="draftSwot.strengths" placeholder="One bullet per line…" rows="5"></textarea>
        </div>
        <div class="swot-card swot-w">
          <div class="swot-card-label">⚠ Weaknesses</div>
          <textarea class="swot-edit-area" v-model="draftSwot.weaknesses" placeholder="One bullet per line…" rows="5"></textarea>
        </div>
        <div class="swot-card swot-o">
          <div class="swot-card-label">🚀 Opportunities</div>
          <textarea class="swot-edit-area" v-model="draftSwot.opportunities" placeholder="One bullet per line…" rows="5"></textarea>
        </div>
        <div class="swot-card swot-t">
          <div class="swot-card-label">⚡ Threats</div>
          <textarea class="swot-edit-area" v-model="draftSwot.threats" placeholder="One bullet per line…" rows="5"></textarea>
        </div>
      </div>

      <div v-else-if="!generating" class="swot-empty">
        <span class="swot-empty-icon">✦</span>
        <span>Click "Generate AI Analysis" to run a SWOT analysis using Claude AI — including all uploaded documents.</span>
      </div>
    </div>

    <!-- ── AI RECOMMENDATION ── -->
    <div class="rec-section">
      <div class="rec-section-header">
        <span class="swot-title">AI Recommendation</span>
        <div class="swot-actions">
          <template v-if="editingSwot">
            <!-- edit controls shown above in SWOT header -->
          </template>
          <span v-else class="rec-powered">Powered by Claude AI</span>
        </div>
      </div>

      <!-- View mode — Populated -->
      <div v-if="swot?.recommendation && !editingSwot" class="rec-body" :class="`rec-${verdictClass}`">
        <div class="rec-verdict-block">
          <div class="rec-label">Verdict</div>
          <div class="rec-verdict" :class="`rec-verdict-${verdictClass}`">{{ swot.recommendation?.verdict }}</div>
        </div>
        <div class="rec-divider"></div>
        <div class="rec-detail">
          <div class="rec-headline">{{ swot.recommendation?.headline ?? swot.recommendation?.summary }}</div>
          <div v-if="swot.recommendation?.rationale" class="rec-rationale">{{ swot.recommendation.rationale }}</div>
          <div v-if="swot.recommendation?.keyConditions?.length" class="rec-conditions">
            <div class="rec-conditions-label">Key Conditions / Actions</div>
            <ul class="rec-conditions-list">
              <li v-for="(c, i) in swot.recommendation.keyConditions" :key="i">{{ c }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Edit mode — Recommendation -->
      <div v-else-if="editingSwot" class="rec-edit-body">
        <div class="rec-edit-row">
          <label class="rec-edit-label">Verdict</label>
          <select class="rec-edit-select" v-model="draftRec.verdict">
            <option>Proceed</option>
            <option>Proceed with Caution</option>
            <option>Hold</option>
            <option>Reject</option>
          </select>
        </div>
        <div class="rec-edit-row">
          <label class="rec-edit-label">Headline</label>
          <input class="rec-edit-input" v-model="draftRec.headline" placeholder="One sharp sentence summarising the verdict" />
        </div>
        <div class="rec-edit-row">
          <label class="rec-edit-label">Rationale</label>
          <textarea class="rec-edit-textarea" v-model="draftRec.rationale" rows="3" placeholder="2–3 sentences of strategic reasoning…"></textarea>
        </div>
        <div class="rec-edit-row">
          <label class="rec-edit-label">Key Conditions / Actions</label>
          <textarea class="rec-edit-textarea" v-model="draftRec.keyConditions" rows="4" placeholder="One condition per line…"></textarea>
        </div>
      </div>

      <!-- Placeholder -->
      <div v-else class="swot-empty">
        <span class="swot-empty-icon">✦</span>
        <span>Run "Generate AI Analysis" above to receive a strategic recommendation for this deal.</span>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  meta: any
  deal: any
  fin: any
  editMode: boolean
  dealId: string
}>()

const emit = defineEmits<{ (e: 'meta-updated'): void }>()

const ndpClass = computed(() => (props.fin?.ndpMargin ?? 0) >= (props.deal?.hurdleRate ?? 15) ? 'ndp-green' : 'ndp-red')

const doneCount = computed(() =>
  (props.meta?.milestones ?? []).filter((m: any) => m.status === 'done').length
)

function statusLabel(status: string) {
  if (status === 'done')   return 'Done'
  if (status === 'active') return 'In Progress'
  return 'Pending'
}

const devMixColors = ['#5DCAA5', '#378ADD', '#9B94E8', '#C8C5C0', '#F5C85A']
function devMixColor(i: number) { return devMixColors[i % devMixColors.length] }

// ── PROXIMITY EDITING ────────────────────────────────────────────
function addProximity() {
  props.meta.proximities.push({ label: '', distance: '', color: 'blue' })
}
function removeProximity(i: number) {
  props.meta.proximities.splice(i, 1)
}

// ── AUTO-SUGGEST PROXIMITIES ─────────────────────────────────────
const suggesting  = ref(false)
const suggestError = ref('')

async function autoSuggest() {
  suggesting.value  = true
  suggestError.value = ''
  try {
    const results = await $fetch<any[]>(`/api/${props.dealId}/proximities/suggest`, { method: 'POST' })
    // Append suggestions — skip duplicates by label
    const existing = new Set((props.meta.proximities ?? []).map((p: any) => p.label.toLowerCase()))
    for (const r of results) {
      if (!existing.has(r.label.toLowerCase())) {
        props.meta.proximities.push(r)
        existing.add(r.label.toLowerCase())
      }
    }
  } catch (err: any) {
    suggestError.value = err?.data?.statusMessage ?? 'Could not reach map service. Add manually.'
  } finally {
    suggesting.value = false
  }
}

// ── MILESTONE EDITING ────────────────────────────────────────────
function addMilestone() {
  props.meta.milestones.push({ label: '', date: '', status: 'pending' })
}
function removeMilestone(i: number) {
  props.meta.milestones.splice(i, 1)
}

// ── DEV MIX EDITING ─────────────────────────────────────────────
function addDevMix() {
  props.meta.devMix.push({ type: '', pct: 0, units: 0 })
}
function removeDevMix(i: number) {
  props.meta.devMix.splice(i, 1)
}

// ── LEGAL STATUS HELPERS ─────────────────────────────────────────
// Handles both flat string format (old) and {value, status} object format (new)
function lsGet(key: string): string {
  const field = props.meta?.legalStatus?.[key]
  if (field === undefined || field === null) return '—'
  if (typeof field === 'object' && 'value' in field) return field.value
  return String(field)
}
function lsZoning(): string {
  // new format uses 'currentZoning', old format uses 'zoning'
  const cur = lsGet('currentZoning')
  return cur !== '—' ? cur : lsGet('zoning')
}
function lsSet(key: string, val: string) {
  if (!props.meta?.legalStatus) return
  const field = props.meta.legalStatus[key]
  if (field && typeof field === 'object' && 'value' in field) {
    props.meta.legalStatus[key].value = val
  } else {
    props.meta.legalStatus[key] = val
  }
}
function lsSetZoning(val: string) {
  // write to whichever key already exists
  const ls = props.meta?.legalStatus
  if (!ls) return
  if ('currentZoning' in ls) lsSet('currentZoning', val)
  else lsSet('zoning', val)
}

// ── ASSUMPTIONS EDITING ──────────────────────────────────────────
function addAssumption() {
  props.meta.assumptions.push({ label: '', value: '' })
}
function removeAssumption(i: number) {
  props.meta.assumptions.splice(i, 1)
}

// ── LEAFLET SITE MAP ─────────────────────────────────────────────
const siteMapEl = ref<HTMLElement | null>(null)
let siteMap: any = null

function destroyMap() {
  if (siteMap) { siteMap.remove(); siteMap = null }
}

async function initSiteMap() {
  if (!siteMapEl.value) return
  const coords = props.meta?.coordinates
  if (!coords?.lat || !coords?.lng) return

  destroyMap()

  const L = await import('leaflet')

  siteMap = L.map(siteMapEl.value, {
    center: [coords.lat, coords.lng],
    zoom: 17,
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: true,
  })

  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution: 'Tiles &copy; Esri', maxZoom: 19 }
  ).addTo(siteMap)

  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 19, opacity: 0.8 }
  ).addTo(siteMap)

  L.circleMarker([coords.lat, coords.lng], {
    radius: 7,
    fillColor: '#5DCAA5',
    color: '#fff',
    weight: 2.5,
    opacity: 1,
    fillOpacity: 1,
  }).addTo(siteMap).bindPopup(
    `<b style="font-family:DM Sans,sans-serif;font-size:12px;">${props.meta?.name ?? ''}</b>
     <div style="font-size:10px;color:#888;margin-top:2px;">${props.meta?.location ?? ''}</div>`
  )

  // Force tile refresh in case container was not fully laid out yet
  setTimeout(() => siteMap?.invalidateSize(), 100)
}

onMounted(async () => {
  await nextTick()
  if (!props.editMode) await initSiteMap()
})

onBeforeUnmount(destroyMap)

// Re-draw map when leaving edit mode OR when coordinates change
watch(() => props.editMode, async (isEditing) => {
  if (!isEditing) {
    await nextTick()
    await initSiteMap()
  } else {
    destroyMap()
  }
})

watch(
  () => [props.meta?.coordinates?.lat, props.meta?.coordinates?.lng],
  async ([lat, lng]) => {
    if (!props.editMode && lat && lng) {
      await nextTick()
      await initSiteMap()
    }
  }
)

// ── SWOT AI ──────────────────────────────────────────────────────
const generating = ref(false)
const swotError  = ref('')
const swot = ref<any>(props.meta?.swot ?? null)

async function generateSwot() {
  generating.value = true
  swotError.value  = ''
  try {
    const result = await $fetch(`/api/${props.dealId}/swot`, { method: 'POST' })
    swot.value = { ...(result as any), generatedAt: new Date().toISOString() }
  } catch (err: any) {
    swotError.value = err?.data?.message ?? 'Failed to generate analysis. Check API key.'
  } finally {
    generating.value = false
  }
}

const verdictClass = computed(() => {
  try {
    const v = swot.value?.recommendation?.verdict ?? ''
    if (v === 'Proceed') return 'green'
    if (v === 'Proceed with Caution' || v === 'Hold') return 'amber'
    if (v === 'Reject') return 'red'
    return 'amber'
  } catch { return 'amber' }
})

function formatSwotDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── SWOT MANUAL EDIT ─────────────────────────────────────────────
const editingSwot = ref(false)
const swotSaving  = ref(false)
const draftSwot = ref({ strengths: '', weaknesses: '', opportunities: '', threats: '' })
const draftRec  = ref({ verdict: '', headline: '', rationale: '', keyConditions: '' })

function arrToText(arr: string[] = []) { return arr.join('\n') }
function textToArr(text: string)       { return text.split('\n').map(s => s.trim()).filter(Boolean) }

function startEditSwot() {
  const s = swot.value?.swot ?? {}
  draftSwot.value = {
    strengths:    arrToText(s.strengths),
    weaknesses:   arrToText(s.weaknesses),
    opportunities: arrToText(s.opportunities),
    threats:      arrToText(s.threats),
  }
  const r = swot.value?.recommendation ?? {}
  draftRec.value = {
    verdict:       r.verdict ?? 'Proceed with Caution',
    headline:      r.headline ?? r.summary ?? '',
    rationale:     r.rationale ?? '',
    keyConditions: arrToText(r.keyConditions),
  }
  editingSwot.value = true
}

function cancelEditSwot() {
  editingSwot.value = false
}

async function saveSwot() {
  swotSaving.value = true
  try {
    const updated = {
      ...swot.value,
      swot: {
        strengths:    textToArr(draftSwot.value.strengths),
        weaknesses:   textToArr(draftSwot.value.weaknesses),
        opportunities: textToArr(draftSwot.value.opportunities),
        threats:      textToArr(draftSwot.value.threats),
      },
      recommendation: {
        verdict:       draftRec.value.verdict,
        headline:      draftRec.value.headline,
        rationale:     draftRec.value.rationale,
        keyConditions: textToArr(draftRec.value.keyConditions),
      },
      isDemo: false,
    }
    await $fetch(`/api/${props.dealId}/meta`, {
      method: 'PUT',
      body: { ...props.meta, swot: updated },
    })
    swot.value = updated
    editingSwot.value = false
    emit('meta-updated')
  } catch (err: any) {
    alert('Save failed: ' + (err?.data?.message ?? err.message))
  } finally {
    swotSaving.value = false
  }
}
</script>

<style>
@import 'leaflet/dist/leaflet.css';
</style>

<style scoped>
.overview { display: flex; flex-direction: column; gap: 20px; }

/* ── KPI CARDS ── */
.kpi-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.kpi-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 16px 18px;
}
.kpi-label {
  font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
  color: var(--muted); margin-bottom: 6px; text-transform: uppercase;
}
.kpi-value { font-size: 22px; font-weight: 700; color: var(--text); letter-spacing: -0.5px; margin-bottom: 4px; }
.kpi-sub   { font-size: 11.5px; color: var(--muted); }
.ndp-green { color: var(--green) !important; }
.ndp-red   { color: var(--red)   !important; }

/* ── OVERVIEW GRID ── */
.overview-grid { display: grid; grid-template-columns: 2fr 1.6fr 1.4fr; gap: 16px; align-items: start; }
.ov-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 16px 18px;
  display: flex; flex-direction: column; gap: 14px;
}
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 12px; font-weight: 600; color: var(--text); text-transform: uppercase; letter-spacing: 0.06em; }
.milestone-count { font-size: 11px; color: var(--muted); }

/* ── LOCATION CARD ── */
.location-card { gap: 12px; }
.open-map-btn {
  font-size: 11px; color: var(--muted); text-decoration: none;
  padding: 3px 8px; border: 1px solid var(--border2); border-radius: var(--radius-sm);
  transition: all 0.15s;
}
.open-map-btn:hover { color: var(--text); background: var(--surface2); }

.map-wrap { position: relative; border-radius: var(--radius-sm); overflow: hidden; height: 180px; isolation: isolate; z-index: 0; }
.map-leaflet { width: 100%; height: 100%; }
.map-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%);
  padding: 28px 12px 10px;
}
.map-parcel-name { font-size: 12px; font-weight: 600; color: #fff; }
.map-parcel-sub  { font-size: 10.5px; color: rgba(255,255,255,0.7); margin-top: 2px; }

.coord-pills { display: flex; gap: 6px; flex-wrap: wrap; }
.coord-pill {
  font-size: 11px; font-family: 'DM Mono', monospace;
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 20px; padding: 3px 9px; color: var(--muted);
}

/* ── EDIT COORDS ── */
.edit-coords-block { display: flex; flex-direction: column; gap: 6px; }
.edit-coords-row { display: flex; gap: 8px; }
.edit-coord-item { display: flex; align-items: center; gap: 5px; }
.edit-coord-prefix { font-size: 11px; color: var(--muted); width: 22px; }
.edit-coord-input  { width: 110px; }
.edit-field-label  { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 4px; }

/* ── PROXIMITIES ── */
.proximities { display: flex; flex-direction: column; }
.prox-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.prox-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }

.prox-legend {
  display: flex; flex-wrap: wrap; gap: 8px 14px;
  padding: 6px 0 8px; border-bottom: 1px solid var(--border);
}
.prox-legend-item {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; color: var(--muted);
}

.prox-row { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 1px solid var(--border); }
.prox-row:last-child { border-bottom: none; }
.prox-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.prox-dot-green  { background: var(--green); }
.prox-dot-blue   { background: #378ADD; }
.prox-dot-grey   { background: var(--muted); }
.prox-dot-amber  { background: var(--amber); }
.prox-label { font-size: 12px; color: var(--text); flex: 1; }
.prox-dist  { font-size: 11px; color: var(--muted); white-space: nowrap; }

/* Edit mode proximity rows */
.prox-edit-row { display: flex; align-items: center; gap: 5px; margin-bottom: 6px; }
.prox-color-select { width: 46px; padding: 0 4px; font-size: 13px; }
.prox-label-input  { flex: 1; }
.prox-dist-input   { width: 72px; }

/* ── AUTO-SUGGEST BUTTON ── */
.btn-autosuggest {
  font-size: 11px; font-weight: 500; color: var(--text);
  padding: 3px 10px; border: 1.5px solid var(--amber);
  border-radius: var(--radius-sm); background: #fffdf5;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
  font-family: 'DM Sans', sans-serif;
}
.btn-autosuggest:hover:not(:disabled) { background: var(--amber-bg); }
.btn-autosuggest:disabled { opacity: 0.55; cursor: not-allowed; }
.suggest-error { font-size: 11px; color: var(--red); margin-bottom: 4px; }

/* ── MILESTONES ── */
.milestones-list { display: flex; flex-direction: column; }
.milestone-row { display: flex; align-items: flex-start; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--border); }
.milestone-row:last-child { border-bottom: none; }
.ms-track { display: flex; align-items: center; padding-top: 3px; }
.ms-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.ms-dot-done    { background: var(--green); }
.ms-dot-active  { background: #378ADD; box-shadow: 0 0 0 3px rgba(55,138,221,0.2); }
.ms-dot-pending { background: transparent; border: 2px solid var(--border2); }
.ms-content { flex: 1; }
.ms-label { font-size: 12.5px; color: var(--text); font-weight: 500; }
.ms-date  { font-size: 11px; color: var(--muted); margin-top: 1px; }
.ms-badge { font-size: 10px; font-weight: 500; padding: 2px 7px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; margin-top: 2px; }
.ms-badge-done    { background: var(--green-bg); color: var(--green-txt); }
.ms-badge-active  { background: #dbeafe; color: #1d4ed8; }
.ms-badge-pending { background: var(--surface2); color: var(--muted); border: 1px solid var(--border); }

/* Edit mode milestones */
.milestones-edit-list { display: flex; flex-direction: column; gap: 6px; }
.ms-edit-row { display: flex; align-items: center; gap: 5px; }
.ms-status-select { width: 104px; font-size: 11px; }
.ms-label-input   { flex: 1; }
.ms-date-input    { width: 110px; }

/* ── LEGAL STATUS ── */
.legal-block { border-top: 1px solid var(--border); padding-top: 14px; }
.legal-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 8px; }
.legal-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.legal-item  { background: var(--surface2); border-radius: var(--radius-sm); padding: 8px 10px; }
.legal-key   { font-size: 10px; color: var(--muted); margin-bottom: 3px; }
.legal-val   { font-size: 12px; font-weight: 500; color: var(--text); }

.legal-edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.legal-edit-item {}
.legal-edit-item .edit-input { width: 100%; margin-top: 2px; }

/* ── DEV MIX ── */
.devmix-list { display: flex; flex-direction: column; gap: 12px; }
.devmix-top  { display: flex; justify-content: space-between; margin-bottom: 5px; }
.devmix-type { font-size: 12.5px; color: var(--text); }
.devmix-pct  { font-size: 12px; font-weight: 600; color: var(--text); }
.devmix-bar-bg   { height: 6px; background: var(--surface2); border-radius: 99px; overflow: hidden; margin-bottom: 4px; }
.devmix-bar-fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
.devmix-sub  { font-size: 10.5px; color: var(--muted); }

.devmix-edit-list { display: flex; flex-direction: column; gap: 6px; }
.devmix-edit-row  { display: flex; align-items: center; gap: 5px; }
.devmix-type-input  { flex: 1; }
.devmix-pct-input   { width: 52px; }
.devmix-units-input { width: 68px; }

/* ── ASSUMPTIONS ── */
.assumptions-block { border-top: 1px solid var(--border); padding-top: 14px; }
.assumptions-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.assumption-item   { background: var(--surface2); border-radius: var(--radius-sm); padding: 8px 10px; }
.assumption-label  { font-size: 10px; color: var(--muted); margin-bottom: 3px; }
.assumption-value  { font-size: 13px; font-weight: 600; color: var(--text); }

.assumptions-edit-list { display: flex; flex-direction: column; gap: 6px; }
.assumption-edit-row   { display: flex; align-items: center; gap: 5px; }
.assump-label-input    { width: 110px; }
.assump-value-input    { flex: 1; }

/* ── SHARED EDIT CONTROLS ── */
.edit-input {
  height: 28px; padding: 0 8px;
  border: 1.5px solid var(--amber); border-radius: var(--radius-sm);
  background: #fff; font-family: 'DM Sans', sans-serif;
  font-size: 12px; color: var(--text); outline: none;
  transition: border-color 0.15s;
}
.edit-input:focus { border-color: #D48C0A; }
.edit-select {
  height: 28px; padding: 0 6px;
  border: 1.5px solid var(--amber); border-radius: var(--radius-sm);
  background: #fff; font-family: 'DM Sans', sans-serif;
  font-size: 12px; color: var(--text); cursor: pointer; outline: none;
}
.btn-add-row {
  font-size: 11.5px; color: var(--muted); background: none; border: none;
  cursor: pointer; padding: 6px 0; text-align: left;
  font-family: 'DM Sans', sans-serif; transition: color 0.15s;
}
.btn-add-row:hover { color: var(--text); }
.btn-delete-row {
  width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
  border: none; background: none; color: var(--muted); cursor: pointer;
  font-size: 11px; border-radius: 4px; transition: all 0.15s; flex-shrink: 0;
}
.btn-delete-row:hover { background: var(--red-bg); color: var(--red); }

/* ── SWOT SECTION ── */
/* ── SWOT EDIT CONTROLS ── */
.swot-actions { display: flex; align-items: center; gap: 8px; }
.btn-swot-action {
  font-size: 11px; font-weight: 600; padding: 5px 14px; border-radius: 6px;
  border: 1px solid var(--border); cursor: pointer; transition: background 0.15s;
}
.btn-edit   { background: var(--surface); color: var(--text); }
.btn-edit:hover { background: var(--border); }
.btn-save   { background: var(--accent, #2563eb); color: #fff; border-color: transparent; }
.btn-save:hover { opacity: 0.88; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-cancel { background: var(--surface); color: var(--muted); }
.btn-cancel:hover { background: var(--border); }

.swot-edit-area {
  width: 100%; box-sizing: border-box;
  font-size: 12px; line-height: 1.55; color: var(--text);
  background: var(--bg, #f9fafb); border: 1px solid var(--border);
  border-radius: 6px; padding: 8px 10px; resize: vertical;
  font-family: inherit; outline: none;
}
.swot-edit-area:focus { border-color: var(--accent, #2563eb); }

/* ── RECOMMENDATION EDIT ── */
.rec-edit-body { display: flex; flex-direction: column; gap: 12px; padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); }
.rec-edit-row  { display: flex; flex-direction: column; gap: 4px; }
.rec-edit-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
.rec-edit-select, .rec-edit-input, .rec-edit-textarea {
  font-size: 12.5px; color: var(--text); font-family: inherit;
  background: var(--bg, #f9fafb); border: 1px solid var(--border);
  border-radius: 6px; padding: 7px 10px; outline: none; width: 100%; box-sizing: border-box;
}
.rec-edit-select:focus, .rec-edit-input:focus, .rec-edit-textarea:focus { border-color: var(--accent, #2563eb); }
.rec-edit-textarea { resize: vertical; line-height: 1.55; }

.swot-section {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 20px 22px;
  box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 16px;
}
.swot-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.swot-title-block { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.swot-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text); }
.swot-timestamp { font-size: 10px; color: var(--faint); display: flex; align-items: center; gap: 6px; }
.swot-docs-badge {
  background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE;
  font-size: 10px; font-weight: 600; padding: 1px 7px; border-radius: 20px;
}

.btn-generate {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: var(--radius-sm);
  background: var(--text); color: #fff; border: none;
  font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
  cursor: pointer; transition: opacity 0.15s; white-space: nowrap; flex-shrink: 0;
}
.btn-generate:hover:not(:disabled) { opacity: 0.85; }
.btn-generate:disabled { opacity: 0.55; cursor: not-allowed; }
.gen-spinner {
  width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
  animation: spin 0.6s linear infinite; display: inline-block; flex-shrink: 0;
}

.swot-error { font-size: 12px; color: var(--red); padding: 8px 12px; background: var(--red-bg); border-radius: var(--radius-sm); }
.ai-disclaimer { font-size: 11px; color: var(--muted); opacity: 0.75; margin-bottom: 2px; }
.swot-demo-badge { display: inline-block; background: #f0a500; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 20px; letter-spacing: 0.05em; vertical-align: middle; }

.swot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.swot-card { border-radius: var(--radius-sm); padding: 14px 16px; }
.swot-s { background: #F0FDF4; border: 1px solid #BBF7D0; }
.swot-w { background: #FFF7ED; border: 1px solid #FED7AA; }
.swot-o { background: #EFF6FF; border: 1px solid #BFDBFE; }
.swot-t { background: #FFF1F2; border: 1px solid #FECDD3; }

.swot-card-label { font-size: 11px; font-weight: 700; margin-bottom: 8px; }
.swot-s .swot-card-label { color: #15803D; }
.swot-w .swot-card-label { color: #C2410C; }
.swot-o .swot-card-label { color: #1D4ED8; }
.swot-t .swot-card-label { color: #BE123C; }

.swot-list { margin: 0; padding-left: 14px; display: flex; flex-direction: column; gap: 5px; }
.swot-list li { font-size: 12px; color: var(--text); line-height: 1.5; }

.swot-empty { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--faint); padding: 16px 0; }
.swot-empty-icon { font-size: 18px; opacity: 0.4; }

/* ── RECOMMENDATION SECTION ── */
.rec-section {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 20px 22px;
  box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 16px;
}
.rec-section-header { display: flex; align-items: center; justify-content: space-between; }
.rec-powered { font-size: 10px; color: var(--faint); font-style: italic; }

.rec-body {
  display: flex; align-items: flex-start; gap: 0;
  border-radius: var(--radius-sm); border: 1px solid; overflow: hidden;
}
.rec-green { background: #F0FDF4; border-color: #BBF7D0; }
.rec-amber { background: #FFFBEB; border-color: #FDE68A; }
.rec-red   { background: #FFF1F2; border-color: #FECDD3; }

.rec-verdict-block {
  flex-shrink: 0; padding: 20px 22px;
  display: flex; flex-direction: column; gap: 6px; min-width: 150px;
  border-right: 1px solid rgba(0,0,0,0.08);
}
.rec-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
.rec-verdict { font-size: 16px; font-weight: 700; line-height: 1.2; }
.rec-verdict-green { color: #15803D; }
.rec-verdict-amber { color: #B45309; }
.rec-verdict-red   { color: #BE123C; }

.rec-divider { width: 1px; background: rgba(0,0,0,0.06); flex-shrink: 0; }

.rec-detail { flex: 1; padding: 20px 22px; display: flex; flex-direction: column; gap: 10px; }
.rec-headline { font-size: 13px; font-weight: 600; color: var(--text); line-height: 1.4; }
.rec-rationale { font-size: 12.5px; color: var(--muted); line-height: 1.6; }

.rec-conditions { margin-top: 4px; }
.rec-conditions-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 6px; }
.rec-conditions-list { margin: 0; padding-left: 16px; display: flex; flex-direction: column; gap: 4px; }
.rec-conditions-list li { font-size: 12px; color: var(--text); line-height: 1.5; }

/* ── RESPONSIVE ── */
@media (max-width: 1100px) {
  .kpi-row      { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 700px) {
  .kpi-row      { grid-template-columns: repeat(2, 1fr); }
  .overview-grid { grid-template-columns: 1fr; }
}
</style>
