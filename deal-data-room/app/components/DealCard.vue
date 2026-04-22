<template>
  <div class="deal-card-wrap" :style="`animation-delay:${delay}s`">
    <NuxtLink :to="`/${deal.id}`" class="deal-card">
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
          <span v-if="deal.restricted" class="badge badge-red">Confidential</span>
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
          <div class="ck-label">NDV</div>
          <div class="ck-value">RM {{ deal.ndv }}M</div>
          <div class="ck-sub">RM {{ deal.blendedPSF }} psf</div>
        </div>
        <div class="card-kpi">
          <div class="ck-label">NDP Margin</div>
          <div class="ck-value">{{ deal.ndpMargin }}%</div>
          <div class="ck-sub" :class="ndpDelta >= 0 ? 'positive' : 'negative'">
            {{ ndpDelta >= 0 ? '+' : '' }}{{ ndpDelta.toFixed(1) }}% vs hurdle
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

  <!-- trash button -->
  <button class="trash-btn" title="Move to Trash" @click.stop="moveToTrash">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  </button>
  </div>
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
    ndv: number
    blendedPSF: number
    ndpMargin: number
    hurdleRate: number
    landAcres: number
    tenure: string
    ddProgress: number
    updatedAt: string
    stageNote: string
  }
  delay: number
}>()

const emit = defineEmits<{ trashed: [id: string] }>()

async function moveToTrash() {
  if (!confirm(`Move "${props.deal.name}" to Trash?`)) return
  await $fetch(`/api/${props.deal.id}/trash`, { method: 'PUT' })
  emit('trashed', props.deal.id)
}

const stageMap: Record<string, { barGradient: string; barColor: string; badge: string; dotColor: string }> = {
  'Active DD': { barGradient: 'linear-gradient(90deg,#60A5FA,#1D60C8)', barColor: '#60A5FA', badge: 'badge-blue',  dotColor: '#1D60C8' },
  'KIV':       { barGradient: 'linear-gradient(90deg,#F5C85A,#D48C0A)', barColor: '#F5C85A', badge: 'badge-amber', dotColor: '#D48C0A' },
  'Approved':  { barGradient: 'linear-gradient(90deg,#5DCAA5,#1D9E75)', barColor: '#5DCAA5', badge: 'badge-green', dotColor: '#1D9E75' },
  'Rejected':  { barGradient: 'linear-gradient(90deg,#F87171,#DC2626)', barColor: '#F87171', badge: 'badge-red',   dotColor: '#DC2626' },
}

const stageStyle = computed(() => stageMap[props.deal.stage] ?? stageMap['Rejected'])
const ndpDelta = computed(() => props.deal.ndpMargin - props.deal.hurdleRate)

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
}
</script>

<style scoped>
.deal-card-wrap {
  position: relative;
  animation: fadeUp 0.3s ease both;
  display: flex; flex-direction: column;
}
.deal-card-wrap:hover .trash-btn { opacity: 1; }

.trash-btn {
  position: absolute; top: 10px; right: 10px;
  width: 26px; height: 26px;
  border-radius: 6px; border: 1px solid var(--border2);
  background: var(--surface); color: var(--muted);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; opacity: 0; transition: opacity 0.15s, background 0.15s, color 0.15s;
  z-index: 2;
}
.trash-btn:hover { background: var(--red-bg); color: var(--red); border-color: rgba(163,45,45,0.3); }

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
  flex: 1;
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
.ck-sub { font-size: 10px; color: var(--faint); margin-top: 1px; font-family: 'DM Mono', monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
