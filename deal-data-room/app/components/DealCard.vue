<template>
  <NuxtLink :to="`/${deal.id}`" class="deal-card" :style="`animation-delay:${delay}s`">
    <!-- colour bar -->
    <div class="card-bar" :style="{ background: stageStyle.barGradient }"></div>

    <div class="card-body">
      <!-- top: name + badges -->
      <div class="card-top">
        <div>
          <div class="card-name">{{ deal.name }}</div>
          <div class="card-ref">{{ deal.ref }}</div>
        </div>
        <div class="card-badges">
          <span v-if="deal.restricted" class="badge badge-red">Restricted</span>
          <span class="badge" :class="stageStyle.badge">{{ deal.stage }}</span>
        </div>
      </div>

      <!-- location -->
      <div class="card-location">
        <span class="loc-pin">📍</span>{{ deal.location }}
      </div>

      <!-- KPI grid -->
      <div class="card-kpis">
        <div class="card-kpi">
          <div class="ck-label">GDV</div>
          <div class="ck-value">RM {{ deal.gdv }}M</div>
          <div class="ck-sub">RM {{ deal.blendedPSF }} psf</div>
        </div>
        <div class="card-kpi">
          <div class="ck-label">IRR</div>
          <div class="ck-value">{{ deal.irr }}%</div>
          <div class="ck-sub" :class="irrDelta >= 0 ? 'positive' : 'negative'">
            {{ irrDelta >= 0 ? '+' : '' }}{{ irrDelta.toFixed(1) }}% vs hurdle
          </div>
        </div>
        <div class="card-kpi">
          <div class="ck-label">Land</div>
          <div class="ck-value">{{ deal.landAcres }} ac</div>
          <div class="ck-sub">{{ deal.tenure }}</div>
        </div>
      </div>

      <!-- DD progress bar -->
      <div class="dd-progress">
        <div class="dd-label-row">
          <span>DD Progress</span>
          <span>{{ deal.ddProgress }}%</span>
        </div>
        <div class="dd-bar-track">
          <div class="dd-bar-fill" :style="{ width: deal.ddProgress + '%', background: stageStyle.barColor }"></div>
        </div>
      </div>
    </div>

    <!-- footer -->
    <div class="card-footer">
      <div class="card-footer-left">
        <div class="footer-dot" :style="{ background: stageStyle.dotColor }"></div>
        {{ deal.stageNote }}
      </div>
      <div class="card-footer-right">Updated {{ formatDate(deal.updatedAt) }}</div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{
  deal: {
    id: string
    name: string
    ref: string
    location: string
    stage: string
    restricted: boolean
    gdv: number
    blendedPSF: number
    irr: number
    hurdleRate: number
    landAcres: number
    tenure: string
    ddProgress: number
    updatedAt: string
    stageNote: string
  }
  delay: number
}>()

const stageMap: Record<string, { barGradient: string; barColor: string; badge: string; dotColor: string }> = {
  'Active DD': { barGradient: 'linear-gradient(90deg,#5DCAA5,#1D9E75)', barColor: '#5DCAA5', badge: 'badge-green',  dotColor: '#1D9E75' },
  'KIV':       { barGradient: 'linear-gradient(90deg,#F5C85A,#D48C0A)', barColor: '#F5C85A', badge: 'badge-amber',  dotColor: '#D48C0A' },
  'Approved':  { barGradient: 'linear-gradient(90deg,#60A5FA,#1D60C8)', barColor: '#60A5FA', badge: 'badge-blue',   dotColor: '#1D60C8' },
  'Rejected':  { barGradient: 'linear-gradient(90deg,#F87171,#DC2626)', barColor: '#F87171', badge: 'badge-red',    dotColor: '#DC2626' },
}

const stageStyle = computed(() => stageMap[props.deal.stage] ?? stageMap['Rejected'])
const irrDelta = computed(() => props.deal.irr - props.deal.hurdleRate)

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
}
</script>

<style scoped>
.deal-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
  overflow: hidden;
  display: flex; flex-direction: column;
  text-decoration: none; color: inherit;
  animation: fadeUp 0.3s ease both;
}
.deal-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--border2);
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.card-bar { height: 3px; width: 100%; }
.card-body { padding: 16px 18px 14px; flex: 1; }
.card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
.card-name { font-size: 14px; font-weight: 600; color: var(--text); letter-spacing: -0.2px; line-height: 1.3; }
.card-ref { font-size: 10.5px; font-family: 'DM Mono', monospace; color: var(--faint); margin-top: 2px; }
.card-badges { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 1px; }
.badge { font-size: 10.5px; font-weight: 500; padding: 2px 8px; border-radius: 20px; letter-spacing: 0.02em; white-space: nowrap; }
.badge-green  { background: var(--green-bg);  color: var(--green-txt); }
.badge-blue   { background: var(--blue-bg);   color: var(--blue); }
.badge-amber  { background: var(--amber-bg);  color: var(--amber); }
.badge-red    { background: var(--red-bg);    color: var(--red); }
.badge-blue   { background: #dbeafe;          color: #1d4ed8; }
.badge-purple { background: var(--purple-bg); color: var(--purple); }
.badge-grey   { background: var(--surface2);  color: var(--muted); border: 1px solid var(--border); }
.card-location { font-size: 12px; color: var(--muted); margin-bottom: 14px; display: flex; align-items: center; gap: 5px; }
.loc-pin { font-size: 11px; }

.card-kpis { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
.card-kpi { padding: 10px 12px; }
.card-kpi:not(:last-child) { border-right: 1px solid var(--border); }
.ck-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px; font-weight: 500; }
.ck-value { font-size: 14px; font-weight: 600; color: var(--text); letter-spacing: -0.2px; }
.ck-sub { font-size: 10px; color: var(--faint); margin-top: 1px; font-family: 'DM Mono', monospace; }
.ck-sub.positive { color: var(--green); }
.ck-sub.negative { color: var(--red); }

.dd-progress { margin-top: 12px; }
.dd-label-row { display: flex; justify-content: space-between; font-size: 10.5px; color: var(--muted); margin-bottom: 5px; }
.dd-bar-track { height: 4px; background: var(--surface2); border-radius: 2px; border: 1px solid var(--border); overflow: hidden; }
.dd-bar-fill { height: 100%; border-radius: 2px; transition: width 0.6s ease; }

.card-footer {
  padding: 10px 18px;
  border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  background: var(--surface2);
}
.card-footer-left { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--muted); }
.footer-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.card-footer-right { font-size: 11px; color: var(--faint); font-family: 'DM Mono', monospace; }
</style>
