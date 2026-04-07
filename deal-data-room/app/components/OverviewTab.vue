<template>
  <div class="overview">

    <!-- ── KPI CARDS ROW ── -->
    <div class="kpi-row">

      <!-- Land Area -->
      <div class="kpi-card">
        <div class="kpi-label">LAND AREA</div>
        <div class="kpi-value">{{ meta?.landArea }} ac</div>
        <div class="kpi-sub">{{ meta?.tenure }} title</div>
      </div>

      <!-- Est. GDV -->
      <div class="kpi-card">
        <div class="kpi-label">EST. GDV</div>
        <div class="kpi-value">RM {{ deal?.gdv }}M</div>
        <div class="kpi-sub">Blended RM {{ deal?.blendedPSF }} psf</div>
      </div>

      <!-- Land Cost -->
      <div class="kpi-card">
        <div class="kpi-label">LAND COST</div>
        <div class="kpi-value">RM {{ deal?.landCost }}M</div>
        <div class="kpi-sub">RM {{ deal?.landCostPSF }} psf land</div>
      </div>

      <!-- Proj. IRR -->
      <div class="kpi-card">
        <div class="kpi-label">PROJ. IRR</div>
        <div class="kpi-value" :class="irrClass">{{ deal?.irr }}%</div>
        <div class="kpi-sub" :class="irrClass">
          {{ irrDelta >= 0 ? '+' : '' }}{{ irrDelta.toFixed(1) }}% vs {{ deal?.hurdleRate }}% hurdle
        </div>
      </div>

    </div>

    <!-- ── THREE-COLUMN GRID ── -->
    <div class="overview-grid">

      <!-- LEFT: Site Location -->
      <div class="ov-card location-card">
        <div class="card-header">
          <span class="card-title">Site Location</span>
          <a
            :href="`https://maps.google.com/?q=${meta?.coordinates?.lat},${meta?.coordinates?.lng}`"
            target="_blank"
            class="open-map-btn"
          >Open ↗</a>
        </div>

        <!-- Map embed -->
        <div class="map-wrap">
          <iframe
            :src="`https://maps.google.com/maps?q=${meta?.coordinates?.lat},${meta?.coordinates?.lng}&z=16&output=embed`"
            class="map-iframe"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
          />
          <!-- Gradient overlay with parcel name -->
          <div class="map-overlay">
            <div class="map-parcel-name">{{ meta?.name }}</div>
            <div class="map-parcel-sub">{{ meta?.location }}</div>
          </div>
        </div>

        <!-- Coordinate pills -->
        <div class="coord-pills">
          <span class="coord-pill">{{ meta?.coordinates?.lat?.toFixed(4) }}°N</span>
          <span class="coord-pill">{{ meta?.coordinates?.lng?.toFixed(4) }}°E</span>
          <span class="coord-pill">{{ meta?.location?.split(',').pop()?.trim() }}</span>
        </div>

        <!-- Key proximities -->
        <div class="proximities">
          <div class="prox-title">Key Proximities</div>
          <div
            v-for="p in meta?.proximities"
            :key="p.label"
            class="prox-row"
          >
            <span class="prox-dot" :class="`prox-dot-${p.color}`" />
            <span class="prox-label">{{ p.label }}</span>
            <span class="prox-dist">{{ p.distance }}</span>
          </div>
        </div>
      </div>

      <!-- CENTRE: DD Milestones -->
      <div class="ov-card">
        <div class="card-header">
          <span class="card-title">DD Milestones</span>
          <span class="milestone-count">{{ doneCount }}/{{ meta?.milestones?.length }} done</span>
        </div>

        <div class="milestones-list">
          <div
            v-for="m in meta?.milestones"
            :key="m.label"
            class="milestone-row"
          >
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

        <!-- Legal status block -->
        <div class="legal-block">
          <div class="legal-title">Legal Status</div>
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
        </div>
      </div>

      <!-- RIGHT: Dev Mix + Assumptions -->
      <div class="ov-card">
        <div class="card-header">
          <span class="card-title">Development Mix</span>
        </div>

        <div class="devmix-list">
          <div
            v-for="(item, i) in meta?.devMix"
            :key="item.type"
            class="devmix-row"
          >
            <div class="devmix-top">
              <span class="devmix-type">{{ item.type }}</span>
              <span class="devmix-pct">{{ item.pct }}%</span>
            </div>
            <div class="devmix-bar-bg">
              <div
                class="devmix-bar-fill"
                :style="{ width: item.pct + '%', background: devMixColor(i) }"
              />
            </div>
            <div class="devmix-sub">
              {{ item.units ? item.units + ' units' : '' }}{{ item.units && item.sqft ? ' · ' : '' }}{{ item.sqft ? item.sqft.toLocaleString() + ' sqft' : '' }}
            </div>
          </div>
        </div>

        <!-- Key Assumptions -->
        <div class="assumptions-block">
          <div class="card-title" style="margin-bottom: 10px;">Key Assumptions</div>
          <div class="assumptions-grid">
            <div
              v-for="a in meta?.assumptions"
              :key="a.label"
              class="assumption-item"
            >
              <div class="assumption-label">{{ a.label }}</div>
              <div class="assumption-value">{{ a.value }}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  meta: any
  deal: any
}>()

const irrDelta = computed(() => (props.deal?.irr ?? 0) - (props.deal?.hurdleRate ?? 15))
const irrClass = computed(() => irrDelta.value >= 0 ? 'irr-green' : 'irr-red')

const doneCount = computed(() =>
  (props.meta?.milestones ?? []).filter((m: any) => m.status === 'done').length
)

function statusLabel(status: string) {
  if (status === 'done')   return 'Done'
  if (status === 'active') return 'In Progress'
  return 'Pending'
}

const devMixColors = ['#5DCAA5', '#378ADD', '#9B94E8', '#C8C5C0', '#F5C85A']
function devMixColor(i: number) {
  return devMixColors[i % devMixColors.length]
}
</script>

<style scoped>
.overview { display: flex; flex-direction: column; gap: 20px; }

/* ── KPI CARDS ── */
.kpi-row {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
}
.kpi-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 16px 18px;
}
.kpi-label {
  font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
  color: var(--muted); margin-bottom: 6px; text-transform: uppercase;
}
.kpi-value {
  font-size: 22px; font-weight: 700; color: var(--text);
  letter-spacing: -0.5px; margin-bottom: 4px;
}
.kpi-sub { font-size: 11.5px; color: var(--muted); }
.irr-green { color: var(--green) !important; }
.irr-red   { color: var(--red)   !important; }

/* ── OVERVIEW GRID ── */
.overview-grid {
  display: grid; grid-template-columns: 2fr 1.6fr 1.4fr; gap: 16px; align-items: start;
}
.ov-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 16px 18px;
  display: flex; flex-direction: column; gap: 14px;
}

/* ── CARD HEADER ── */
.card-header {
  display: flex; align-items: center; justify-content: space-between;
}
.card-title {
  font-size: 12px; font-weight: 600; color: var(--text);
  text-transform: uppercase; letter-spacing: 0.06em;
}
.milestone-count { font-size: 11px; color: var(--muted); }

/* ── LOCATION CARD ── */
.location-card { gap: 12px; }
.open-map-btn {
  font-size: 11px; color: var(--muted); text-decoration: none;
  padding: 3px 8px; border: 1px solid var(--border2); border-radius: var(--radius-sm);
  transition: all 0.15s;
}
.open-map-btn:hover { color: var(--text); background: var(--surface2); }

.map-wrap {
  position: relative; border-radius: var(--radius-sm);
  overflow: hidden; height: 180px;
}
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

.proximities { display: flex; flex-direction: column; }
.prox-title {
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--muted); margin-bottom: 8px;
}
.prox-row {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 0; border-bottom: 1px solid var(--border);
}
.prox-row:last-child { border-bottom: none; }
.prox-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.prox-dot-green  { background: var(--green); }
.prox-dot-blue   { background: #378ADD; }
.prox-dot-grey   { background: var(--muted); }
.prox-dot-amber  { background: var(--amber); }
.prox-label { font-size: 12px; color: var(--text); flex: 1; }
.prox-dist  { font-size: 11px; color: var(--muted); white-space: nowrap; }

/* ── MILESTONES ── */
.milestones-list { display: flex; flex-direction: column; }
.milestone-row {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 9px 0; border-bottom: 1px solid var(--border);
}
.milestone-row:last-child { border-bottom: none; }
.ms-track { display: flex; align-items: center; padding-top: 3px; }
.ms-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}
.ms-dot-done    { background: var(--green); }
.ms-dot-active  { background: #378ADD; box-shadow: 0 0 0 3px rgba(55,138,221,0.2); }
.ms-dot-pending { background: transparent; border: 2px solid var(--border2); }
.ms-content { flex: 1; }
.ms-label { font-size: 12.5px; color: var(--text); font-weight: 500; }
.ms-date  { font-size: 11px; color: var(--muted); margin-top: 1px; }
.ms-badge {
  font-size: 10px; font-weight: 500; padding: 2px 7px; border-radius: 20px;
  white-space: nowrap; flex-shrink: 0; margin-top: 2px;
}
.ms-badge-done    { background: var(--green-bg); color: var(--green-txt); }
.ms-badge-active  { background: #dbeafe; color: #1d4ed8; }
.ms-badge-pending { background: var(--surface2); color: var(--muted); border: 1px solid var(--border); }

/* ── LEGAL STATUS ── */
.legal-block { border-top: 1px solid var(--border); padding-top: 14px; }
.legal-title {
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--muted); margin-bottom: 8px;
}
.legal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.legal-item {
  background: var(--surface2); border-radius: var(--radius-sm); padding: 8px 10px;
}
.legal-key { font-size: 10px; color: var(--muted); margin-bottom: 3px; }
.legal-val { font-size: 12px; font-weight: 500; color: var(--text); }

/* ── DEV MIX ── */
.devmix-list { display: flex; flex-direction: column; gap: 12px; }
.devmix-top { display: flex; justify-content: space-between; margin-bottom: 5px; }
.devmix-type { font-size: 12.5px; color: var(--text); }
.devmix-pct  { font-size: 12px; font-weight: 600; color: var(--text); }
.devmix-bar-bg {
  height: 6px; background: var(--surface2); border-radius: 99px;
  overflow: hidden; margin-bottom: 4px;
}
.devmix-bar-fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
.devmix-sub { font-size: 10.5px; color: var(--muted); }

/* ── ASSUMPTIONS ── */
.assumptions-block { border-top: 1px solid var(--border); padding-top: 14px; }
.assumptions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.assumption-item {
  background: var(--surface2); border-radius: var(--radius-sm); padding: 8px 10px;
}
.assumption-label { font-size: 10px; color: var(--muted); margin-bottom: 3px; }
.assumption-value { font-size: 13px; font-weight: 600; color: var(--text); }

/* ── RESPONSIVE ── */
@media (max-width: 900px) {
  .kpi-row { grid-template-columns: repeat(2, 1fr); }
  .overview-grid { grid-template-columns: 1fr; }
}
</style>
