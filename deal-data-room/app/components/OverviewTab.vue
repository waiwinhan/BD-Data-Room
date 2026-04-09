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
        <div class="kpi-sub">After S&amp;M (RM {{ deal?.blendedPSF }} psf)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">LAND COST</div>
        <div class="kpi-value">RM {{ deal?.landCost }}M</div>
        <div class="kpi-sub">RM {{ deal?.landCostPSF }} psf land</div>
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
          <iframe
            :src="`https://maps.google.com/maps?q=${meta?.coordinates?.lat},${meta?.coordinates?.lng}&z=16&output=embed`"
            class="map-iframe"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
          />
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
                <div class="legal-val">{{ meta?.legalStatus?.titleType }}</div>
              </div>
              <div class="legal-item">
                <div class="legal-key">Encumbrance</div>
                <div class="legal-val">{{ meta?.legalStatus?.encumbrance }}</div>
              </div>
              <div class="legal-item">
                <div class="legal-key">Zoning</div>
                <div class="legal-val">{{ meta?.legalStatus?.zoning }}</div>
              </div>
              <div class="legal-item">
                <div class="legal-key">Bumi Quota</div>
                <div class="legal-val">{{ meta?.legalStatus?.bumiQuota }}</div>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="legal-edit-grid">
              <div class="legal-edit-item">
                <div class="edit-field-label">Title Type</div>
                <input v-model="meta.legalStatus.titleType" class="edit-input" placeholder="e.g. Geran Mukim" />
              </div>
              <div class="legal-edit-item">
                <div class="edit-field-label">Encumbrance</div>
                <input v-model="meta.legalStatus.encumbrance" class="edit-input" placeholder="e.g. Nil" />
              </div>
              <div class="legal-edit-item">
                <div class="edit-field-label">Zoning</div>
                <input v-model="meta.legalStatus.zoning" class="edit-input" placeholder="e.g. Commercial (C2)" />
              </div>
              <div class="legal-edit-item">
                <div class="edit-field-label">Bumi Quota</div>
                <input v-model="meta.legalStatus.bumiQuota" class="edit-input" placeholder="e.g. 30%" />
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

// ── ASSUMPTIONS EDITING ──────────────────────────────────────────
function addAssumption() {
  props.meta.assumptions.push({ label: '', value: '' })
}
function removeAssumption(i: number) {
  props.meta.assumptions.splice(i, 1)
}
</script>

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

.map-wrap { position: relative; border-radius: var(--radius-sm); overflow: hidden; height: 180px; }
.map-iframe { width: 100%; height: 100%; border: none; display: block; }
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

/* ── RESPONSIVE ── */
@media (max-width: 1100px) {
  .kpi-row      { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 700px) {
  .kpi-row      { grid-template-columns: repeat(2, 1fr); }
  .overview-grid { grid-template-columns: 1fr; }
}
</style>
