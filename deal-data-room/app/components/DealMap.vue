<template>
  <div class="map-section">
    <div class="map-header">
      <div class="map-header-left">
        <div class="map-title">Deal Locations</div>
        <div class="map-subtitle">Geographical overview of pipeline across Peninsular Malaysia</div>
      </div>
      <div class="map-legend">
        <div v-for="item in legendItems" :key="item.stage" class="map-legend-item">
          <span class="map-legend-dot" :style="{ background: item.color }" />
          <span class="map-legend-label">{{ item.stage }}</span>
        </div>
      </div>
    </div>
    <div class="map-container">
      <div ref="mapEl" class="map-el" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ deals: any[] }>()

const mapEl = ref<HTMLElement | null>(null)
let mapInstance: any = null

const stageColors: Record<string, string> = {
  'Active DD': '#3B82F6',
  'KIV':       '#F5C85A',
  'Approved':  '#5DCAA5',
  'Rejected':  '#F87171',
}

const legendItems = [
  { stage: 'Active DD', color: '#3B82F6' },
  { stage: 'KIV',       color: '#F5C85A' },
  { stage: 'Approved',  color: '#5DCAA5' },
  { stage: 'Rejected',  color: '#F87171' },
]

function formatRM(val: number) {
  if (val >= 1000) return `RM ${(val / 1000).toFixed(2)}B`
  return `RM ${val}M`
}

function getMarkerSvg(color: string, size: number = 36) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="12" fill="${color}" fill-opacity="0.2" />
      <circle cx="18" cy="18" r="7" fill="${color}" />
      <circle cx="18" cy="18" r="4" fill="white" fill-opacity="0.8" />
    </svg>
  `
}

onMounted(async () => {
  // Dynamically import Leaflet only on client side
  const L = await import('leaflet')

  // Fix default icon path issue with bundlers
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })

  if (!mapEl.value) return

  // Centre on Peninsular Malaysia
  mapInstance = L.map(mapEl.value, {
    center: [3.2, 102.0],
    zoom: 7,
    zoomControl: true,
    attributionControl: true,
  })

  // Use CartoDB Positron — clean, minimal, presentation-ready
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(mapInstance)

  // Add deal markers
  props.deals.forEach((deal) => {
    if (!deal.lat || !deal.lng) return

    const color = stageColors[deal.stage] ?? '#94A3B8'
    const svgIcon = L.divIcon({
      html: getMarkerSvg(color),
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -20],
    })

    const irrDelta = (deal.irr - deal.hurdleRate).toFixed(1)
    const irrSign = Number(irrDelta) >= 0 ? '+' : ''
    const irrColor = Number(irrDelta) >= 0 ? '#0f6e56' : '#a32d2d'

    const popupHtml = `
      <div style="font-family:'DM Sans',sans-serif;min-width:220px;padding:4px 2px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></span>
          <div>
            <div style="font-size:13px;font-weight:600;color:#1a1916;line-height:1.3;">${deal.name}</div>
            <div style="font-size:10px;color:#b0ada8;font-family:'DM Mono',monospace;">${deal.ref}</div>
          </div>
        </div>
        <div style="font-size:11px;color:#7a7770;margin-bottom:10px;">📍 ${deal.location}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;border:1px solid rgba(0,0,0,0.08);border-radius:6px;overflow:hidden;margin-bottom:10px;">
          <div style="padding:8px 10px;">
            <div style="font-size:9px;font-weight:500;color:#7a7770;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">GDV</div>
            <div style="font-size:13px;font-weight:600;color:#1a1916;">${formatRM(deal.gdv)}</div>
          </div>
          <div style="padding:8px 10px;border-left:1px solid rgba(0,0,0,0.08);">
            <div style="font-size:9px;font-weight:500;color:#7a7770;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">IRR</div>
            <div style="font-size:13px;font-weight:600;color:#1a1916;">${deal.irr}%</div>
            <div style="font-size:9px;color:${irrColor};font-family:'DM Mono',monospace;">${irrSign}${irrDelta}% vs hurdle</div>
          </div>
          <div style="padding:8px 10px;border-left:1px solid rgba(0,0,0,0.08);">
            <div style="font-size:9px;font-weight:500;color:#7a7770;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">Land</div>
            <div style="font-size:13px;font-weight:600;color:#1a1916;">${deal.landAcres} ac</div>
            <div style="font-size:9px;color:#b0ada8;">${deal.tenure}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="background:${color}22;color:${color === '#F5C85A' ? '#854f0b' : color};font-size:10px;font-weight:500;padding:2px 8px;border-radius:20px;">${deal.stage}</span>
          <span style="font-size:10px;color:#b0ada8;">DD: ${deal.ddProgress}%</span>
        </div>
      </div>
    `

    L.marker([deal.lat, deal.lng], { icon: svgIcon })
      .addTo(mapInstance!)
      .bindPopup(popupHtml, {
        maxWidth: 280,
        className: 'deal-popup',
      })
  })
})

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})
</script>

<style>
/* Leaflet CSS — loaded inline to avoid SSR issues */
@import 'leaflet/dist/leaflet.css';

.deal-popup .leaflet-popup-content-wrapper {
  border-radius: 10px !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06) !important;
  border: 1px solid rgba(0,0,0,0.08) !important;
  padding: 0 !important;
}
.deal-popup .leaflet-popup-content {
  margin: 14px 16px !important;
}
.deal-popup .leaflet-popup-tip-container {
  display: none;
}
.deal-popup .leaflet-popup-close-button {
  top: 8px !important;
  right: 10px !important;
  font-size: 16px !important;
  color: #7a7770 !important;
}
</style>

<style scoped>
.map-section {
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  padding: 0 28px 32px;
}

.map-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 16px;
  flex-wrap: wrap;
}

.map-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -0.2px;
}

.map-subtitle {
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}

.map-legend {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: center;
}

.map-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.map-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.map-legend-label {
  font-size: 11.5px;
  color: var(--muted);
  font-weight: 500;
}

.map-container {
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
}

.map-el {
  height: 420px;
  width: 100%;
}
</style>
