<template>
  <div class="mr-tab">

    <!-- ── RESEARCH META BAR ── -->
    <div class="mr-meta-bar">
      <div class="mr-meta-left">
        <span class="mr-meta-lbl">Market Research Conducted</span>
        <template v-if="!editingDate">
          <span class="mr-meta-date">{{ displayDate }}</span>
          <button class="btn btn-sm" @click="editingDate = true">✎ Edit</button>
        </template>
        <template v-else>
          <input v-model="dateInput" type="date" class="mr-date-input" />
          <button class="btn-p btn-sm" @click="saveDate">Save</button>
          <button class="btn btn-sm" @click="editingDate = false">Cancel</button>
        </template>
        <span class="mr-meta-by">Prepared by <strong>Marketing Team</strong></span>
      </div>
      <button class="btn-p" @click="openAddForm">+ Add Project</button>
    </div>

    <!-- ── KPI STRIP ── -->
    <div class="kpi-row">
      <div class="kpi">
        <div class="kpi-l">Comps Tracked</div>
        <div class="kpi-v">{{ filtered.length }}</div>
        <div class="kpi-s">Comparable projects nearby</div>
      </div>
      <div class="kpi">
        <div class="kpi-l">Market PSF Range</div>
        <div class="kpi-v">{{ psfRange }}</div>
        <div class="kpi-s">across filtered comps</div>
      </div>
      <div class="kpi">
        <div class="kpi-l">Avg Take-Up Rate</div>
        <div class="kpi-v">{{ avgTakeUp }}%</div>
        <div class="kpi-s" :class="avgTakeUp >= 80 ? 'up' : 'warn'">
          {{ avgTakeUp >= 80 ? '↑ Market absorption healthy' : '↓ Below 80% threshold' }}
        </div>
      </div>
      <div class="kpi">
        <div class="kpi-l">Deal Target vs Median PSF</div>
        <div class="kpi-v">RM {{ (fin?.blendedPSF ?? 0).toLocaleString() }}</div>
        <div class="kpi-s" :class="(fin?.blendedPSF ?? 0) > medianPSF ? 'warn' : 'up'" id="kpi-bench-sub">
          {{ (fin?.blendedPSF ?? 0) > medianPSF
            ? `↑ Above market median (RM ${medianPSF.toLocaleString()})`
            : `↓ Below market median (RM ${medianPSF.toLocaleString()})` }}
        </div>
      </div>
    </div>

    <!-- ── CHARTS + MAP ── -->
    <div class="g3-charts">
      <div class="card">
        <div class="cl">PSF Comparison vs Deal Target</div>
        <div class="cw"><canvas ref="psfCanvas"></canvas></div>
        <div class="ref-legend">
          <span class="ref-line-sample"></span>
          <span>Deal target: RM {{ (fin?.blendedPSF ?? 0).toLocaleString() }} psf</span>
        </div>
      </div>
      <div class="card">
        <div class="cl">Take-Up Rate by Project</div>
        <div class="cw"><canvas ref="takeupCanvas"></canvas></div>
      </div>
      <div class="card" style="padding:0;overflow:hidden">
        <div style="padding:12px 14px 10px;border-bottom:1px solid var(--border)">
          <div class="cl" style="margin-bottom:0">Location Map</div>
        </div>
        <div ref="mapEl" class="map-container"></div>
        <div class="map-legend">
          <div><span class="ml-dot" style="background:#1D9E75"></span>PSF ≥ target</div>
          <div><span class="ml-dot" style="background:#EF9F27"></span>PSF within 10%</div>
          <div><span class="ml-dot" style="background:#E24B4A"></span>PSF below</div>
          <div><span class="ml-dot" style="background:#1A1916"></span>Our site</div>
        </div>
      </div>
    </div>

    <!-- ── KEY MARKET INSIGHTS ── -->
    <div class="card mb20">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div class="cl" style="margin-bottom:0">Key Market Insights</div>
        <div style="display:flex;gap:6px">
          <button v-if="!editingInsights" class="btn btn-sm" @click="startInsightsEdit">✎ Edit</button>
          <button v-else class="btn-p btn-sm" @click="saveInsights">Save</button>
          <button v-if="editingInsights" class="btn btn-sm" @click="editingInsights = false">Cancel</button>
        </div>
      </div>
      <div v-if="!editingInsights" class="insights-body">{{ insights || 'No insights recorded yet. Click Edit to add.' }}</div>
      <textarea v-else v-model="insightsDraft" class="insights-textarea" rows="4"></textarea>
    </div>

    <!-- ── COMPS TABLE CARD ── -->
    <div class="card mb20" style="padding:0">
      <div style="padding:14px 16px 0">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div class="cl" style="margin-bottom:0">Comparable Projects</div>
        </div>

        <!-- FILTERS -->
        <div class="filter-row">
          <span class="filter-lbl">Status:</span>
          <button class="pill" :class="{ on: psFilter === 'all' }" @click="psFilter = 'all'">All</button>
          <button class="pill" :class="{ on: psFilter === 'Ongoing' }" @click="psFilter = 'Ongoing'">Ongoing</button>
          <button class="pill" :class="{ on: psFilter === 'Completed' }" @click="psFilter = 'Completed'">Completed</button>
          <div class="filter-sep"></div>
          <span class="filter-lbl">Tenure:</span>
          <button class="pill" :class="{ on: tenureFilter === 'all' }" @click="tenureFilter = 'all'">All</button>
          <button class="pill" :class="{ on: tenureFilter === 'Freehold' }" @click="tenureFilter = 'Freehold'">Freehold</button>
          <button class="pill" :class="{ on: tenureFilter === 'Leasehold' }" @click="tenureFilter = 'Leasehold'">Leasehold</button>
          <div class="filter-sep"></div>
          <span class="filter-lbl">Market:</span>
          <button class="pill" :class="{ on: mktFilter === 'all' }" @click="mktFilter = 'all'">All</button>
          <button class="pill" :class="{ on: mktFilter === 'primary' }" @click="mktFilter = 'primary'">Primary</button>
          <button class="pill" :class="{ on: mktFilter === 'secondary' }" @click="mktFilter = 'secondary'">Secondary</button>
        </div>
      </div>

      <!-- TABLE -->
      <div class="tbl-wrap">
        <div v-if="pending" class="empty-state">Loading comps…</div>
        <div v-else-if="!filtered.length" class="empty-state">
          <div class="empty-ico">🔍</div>
          <div class="empty-t">No comps match your filters</div>
          <div class="empty-s">Adjust filters or add a project above</div>
        </div>
        <table v-else class="ct">
          <thead>
            <tr>
              <th @click="setSort('projectName')">Project <span class="sort-ico">{{ sortIco('projectName') }}</span></th>
              <th @click="setSort('developer')">Developer <span class="sort-ico">{{ sortIco('developer') }}</span></th>
              <th>Status</th>
              <th @click="setSort('completion')">Compl. <span class="sort-ico">{{ sortIco('completion') }}</span></th>
              <th @click="setSort('units')" style="text-align:right">Units <span class="sort-ico">{{ sortIco('units') }}</span></th>
              <th @click="setSort('storeys')" style="text-align:right">Storeys <span class="sort-ico">{{ sortIco('storeys') }}</span></th>
              <th @click="setSort('sizeMin')">Size (sf) <span class="sort-ico">{{ sortIco('sizeMin') }}</span></th>
              <th @click="setSort('avgPSF')" style="text-align:right">Avg PSF <span class="sort-ico">{{ sortIco('avgPSF') }}</span></th>
              <th>Tenure</th>
              <th>A/C</th>
              <th style="text-align:center">Bathtub</th>
              <th style="text-align:center">Green</th>
              <th @click="setSort('takeUpRate')" style="text-align:right">Take-Up <span class="sort-ico">{{ sortIco('takeUpRate') }}</span></th>
              <th>Sales Status</th>
              <th style="text-align:center">Secure</th>
              <th style="width:32px"></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="c in filtered" :key="c.id">
              <!-- Main row -->
              <tr
                :class="{ expanded: expandedId === c.id, 'map-highlight': highlightedId === c.id }"
                @click="toggleExpand(c.id)"
              >
                <td>
                  <div class="proj-cell">
                    <img v-if="c.imageUrl" :src="c.imageUrl" class="proj-thumb" :alt="c.projectName" @error="(e:any) => e.target.style.display='none'" />
                    <div v-else class="proj-thumb-ph">🏢</div>
                    <div>
                      <strong style="font-size:12.5px">{{ c.projectName }}</strong><br>
                      <span style="font-size:11px;color:var(--muted)">{{ c.location }}</span>
                    </div>
                  </div>
                </td>
                <td style="font-size:12px">{{ c.developer }}</td>
                <td>
                  <span class="b" :class="c.projectStatus === 'Ongoing' ? 'b-ong' : 'b-done'">{{ c.projectStatus }}</span>
                </td>
                <td style="font-family:var(--mono);font-size:12px">{{ c.completion }}</td>
                <td style="text-align:right;font-family:var(--mono)">{{ c.units?.toLocaleString() }}</td>
                <td style="text-align:right;font-family:var(--mono)">{{ c.storeys }}</td>
                <td style="font-family:var(--mono);font-size:11.5px">
                  {{ c.sizeMin && c.sizeMax ? `${c.sizeMin.toLocaleString()}–${c.sizeMax.toLocaleString()}` : '—' }}
                </td>
                <td style="text-align:right" :class="psfClass(c.avgPSF)">RM {{ c.avgPSF?.toLocaleString() }}</td>
                <td>
                  <span class="b" :class="c.tenure === 'Freehold' ? 'b-grn' : 'b-grey'">{{ c.tenure }}</span>
                </td>
                <td style="font-size:11.5px;color:var(--muted)">{{ c.acSystem }}</td>
                <td style="text-align:center"><span :class="c.hasBathtub ? 'chk' : 'crs'">{{ c.hasBathtub ? '✓' : '—' }}</span></td>
                <td style="text-align:center"><span :class="c.greenBuilding ? 'chk' : 'crs'">{{ c.greenBuilding ? '✓' : '—' }}</span></td>
                <td style="text-align:right;font-family:var(--mono);font-size:12.5px;font-weight:600"
                    :style="{ color: (c.takeUpRate ?? 0) >= 85 ? 'var(--green-txt)' : (c.takeUpRate ?? 0) >= 70 ? 'var(--amber)' : 'var(--red)' }">
                  {{ c.takeUpRate }}%
                </td>
                <td>
                  <span class="b"
                    :class="c.salesStatus === 'Primary Market' ? 'b-blue' : c.salesStatus === 'Upcoming' ? 'b-amb' : 'b-grey'">
                    {{ c.salesStatus }}
                  </span>
                </td>
                <td style="text-align:center"><span :class="c.secureBuilding ? 'chk' : 'crs'">{{ c.secureBuilding ? '✓' : '—' }}</span></td>
                <td style="text-align:center;color:var(--muted);font-size:11px">{{ expandedId === c.id ? '▲' : '▾' }}</td>
              </tr>

              <!-- Expanded detail row -->
              <tr v-if="expandedId === c.id" class="expand-row">
                <td colspan="16">
                  <div class="expand-inner">
                    <div>
                      <img v-if="c.imageUrl" :src="c.imageUrl" class="expand-photo" :alt="c.projectName" @error="(e:any) => e.target.style.display='none'" />
                      <div v-else class="expand-photo-ph"><span style="font-size:28px">🏢</span><span>No photo</span></div>
                      <div style="margin-top:10px">
                        <div class="expand-lbl">Architect</div>
                        <div class="expand-val">{{ c.architect || '—' }}</div>
                      </div>
                      <div style="margin-top:8px">
                        <div class="expand-lbl">Maintenance Fee</div>
                        <div class="expand-val">{{ c.maintenanceFee || '—' }}</div>
                      </div>
                      <div style="margin-top:8px">
                        <div class="expand-lbl">Furnishing</div>
                        <div class="expand-val">{{ c.furnishing }}</div>
                      </div>
                    </div>
                    <div>
                      <div class="expand-lbl">Facilities</div>
                      <div class="fac-pills">
                        <span v-for="f in c.facilities" :key="f" class="fac-pill">{{ f }}</span>
                        <span v-if="!c.facilities?.length" style="font-size:12px;color:var(--muted)">—</span>
                      </div>
                      <div style="margin-top:12px">
                        <div class="expand-lbl">Green Building</div>
                        <div class="expand-val">{{ c.greenBuilding ? '✓ Certified' : 'Not certified' }}</div>
                      </div>
                    </div>
                    <div>
                      <div class="expand-lbl">Notes / USP Analysis</div>
                      <div class="expand-val" style="font-size:12px;line-height:1.6;white-space:normal">{{ c.notes || '—' }}</div>
                      <div style="margin-top:12px;display:flex;gap:6px">
                        <button class="btn btn-sm" @click.stop="openEditForm(c)">✎ Edit</button>
                        <button class="btn btn-sm" style="color:var(--red)" @click.stop="deleteComp(c)">✕ Remove</button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- ADD / EDIT FORM -->
      <Transition name="slide-down">
        <div v-if="showForm" class="add-form-wrap">
          <div class="form-title">
            <span>{{ editingComp ? `Edit: ${editingComp.projectName}` : 'Add Comparable Project' }}</span>
            <button class="btn" @click="closeForm">✕ Close</button>
          </div>

          <div class="form-grid">
            <div class="fg" style="grid-column:span 2">
              <label>Project Name *</label>
              <input v-model="form.projectName" type="text" placeholder="e.g. The Ashwood" />
            </div>
            <div class="fg">
              <label>Developer *</label>
              <input v-model="form.developer" type="text" placeholder="e.g. Paramount" />
            </div>
            <div class="fg">
              <label>Architect</label>
              <input v-model="form.architect" type="text" placeholder="e.g. GDP Architects" />
            </div>
          </div>

          <div class="form-grid">
            <div class="fg" style="grid-column:span 2">
              <label>Location / Address</label>
              <input v-model="form.location" type="text" placeholder="e.g. Jalan Ampang Hilir" />
            </div>
            <div class="fg">
              <label>Lat</label>
              <input v-model.number="form.lat" type="number" placeholder="3.1582" step="0.0001" />
            </div>
            <div class="fg">
              <label>Lng</label>
              <input v-model.number="form.lng" type="number" placeholder="101.7195" step="0.0001" />
            </div>
          </div>

          <div class="form-grid">
            <div class="fg">
              <label>Project Status</label>
              <select v-model="form.projectStatus">
                <option>Ongoing</option>
                <option>Completed</option>
              </select>
            </div>
            <div class="fg">
              <label>Completion Year</label>
              <input v-model.number="form.completion" type="number" placeholder="2025" />
            </div>
            <div class="fg">
              <label>No. of Units</label>
              <input v-model.number="form.units" type="number" placeholder="500" />
            </div>
            <div class="fg">
              <label>Storeys</label>
              <input v-model.number="form.storeys" type="number" placeholder="40" />
            </div>
          </div>

          <div class="form-grid">
            <div class="fg">
              <label>Min Size (sf)</label>
              <input v-model.number="form.sizeMin" type="number" placeholder="700" />
            </div>
            <div class="fg">
              <label>Max Size (sf)</label>
              <input v-model.number="form.sizeMax" type="number" placeholder="1200" />
            </div>
            <div class="fg">
              <label>Avg PSF (RM) *</label>
              <input v-model.number="form.avgPSF" type="number" placeholder="850" />
            </div>
            <div class="fg">
              <label>Take-Up Rate (%)</label>
              <input v-model.number="form.takeUpRate" type="number" placeholder="80" min="0" max="100" />
            </div>
          </div>

          <div class="form-grid">
            <div class="fg">
              <label>Tenure</label>
              <select v-model="form.tenure">
                <option>Freehold</option>
                <option>Leasehold 99yr</option>
                <option>Leasehold 60yr</option>
              </select>
            </div>
            <div class="fg">
              <label>Sales Status</label>
              <select v-model="form.salesStatus">
                <option>Primary Market</option>
                <option>Secondary Market</option>
                <option>Upcoming</option>
                <option>Sold Out</option>
              </select>
            </div>
            <div class="fg">
              <label>Maintenance Fee</label>
              <input v-model="form.maintenanceFee" type="text" placeholder="RM 0.35 psf" />
            </div>
            <div class="fg">
              <label>Furnishing</label>
              <select v-model="form.furnishing">
                <option>Bare</option>
                <option>Semi-Furnished</option>
                <option>Fully Furnished</option>
              </select>
            </div>
          </div>

          <div class="form-grid-3">
            <div class="fg">
              <label>A/C System</label>
              <select v-model="form.acSystem">
                <option>Split Unit</option>
                <option>Ducted A/C</option>
                <option>VRV/VRF</option>
                <option>Wall Mount</option>
                <option>None</option>
              </select>
            </div>
            <div class="fg">
              <label>Facilities (comma-separated)</label>
              <input v-model="facilitiesRaw" type="text" placeholder="Infinity pool, Sky gym, Co-work" />
            </div>
            <div class="fg" style="justify-content:flex-end;gap:10px">
              <label style="opacity:0">·</label>
              <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
                <label class="cb-row"><input v-model="form.hasBathtub" type="checkbox" /> Bathtub</label>
                <label class="cb-row"><input v-model="form.secureBuilding" type="checkbox" /> Secure</label>
                <label class="cb-row"><input v-model="form.greenBuilding" type="checkbox" /> Green Bldg</label>
              </div>
            </div>
          </div>

          <div class="fg" style="margin-bottom:12px">
            <label>Photo URL</label>
            <div style="display:flex;gap:8px;align-items:flex-start">
              <input v-model="form.imageUrl" type="url" placeholder="https://..." style="flex:1" />
              <div class="img-preview">
                <img v-if="form.imageUrl" :src="form.imageUrl" style="width:100%;height:100%;object-fit:cover" @error="(e:any) => e.target.style.display='none'" />
                <span v-else>🏢</span>
              </div>
            </div>
          </div>

          <div class="fg" style="margin-bottom:14px">
            <label>Notes / USP Analysis</label>
            <textarea v-model="form.notes" rows="3" placeholder="Key selling points, market positioning, absorption drivers..."></textarea>
          </div>

          <div class="form-actions">
            <span v-if="formError" class="form-err">{{ formError }}</span>
            <button class="btn" @click="closeForm">Cancel</button>
            <button class="btn-p" :disabled="saving" @click="saveComp">
              {{ saving ? 'Saving…' : (editingComp ? 'Update Project' : 'Save Project') }}
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- ── BUYER PROFILES ── -->
    <div class="buyer-section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div>
          <div class="cl" style="margin-bottom:2px">Target Buyer Profiles</div>
          <div style="font-size:11.5px;color:var(--muted)">Buyer segments identified from marketing brief analysis</div>
        </div>
        <button class="btn btn-sm" :class="{ 'btn-p': buyerEditMode }" @click="toggleBuyerEdit">
          {{ buyerEditMode ? '✓ Done' : '✎ Edit Profiles' }}
        </button>
      </div>
      <div class="buyer-grid">
        <div v-for="(p, i) in buyerProfiles" :key="i" class="buyer-card">
          <div class="buyer-icon" :style="{ background: p.color }">{{ p.icon }}</div>
          <div class="buyer-name">{{ p.name }}</div>
          <div class="buyer-attr-lbl">What Attracts Them</div>
          <ul v-if="!buyerEditMode" class="buyer-attr-list">
            <li v-for="a in p.attrs" :key="a">{{ a }}</li>
          </ul>
          <textarea v-else v-model="p.editText" class="buyer-edit-area" rows="5"></textarea>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps<{
  dealId: string
  fin?: Record<string, any> | null
  meta?: Record<string, any> | null
}>()

// ── DATA ──────────────────────────────────────────────────────────────────────
const { data: compsRaw, pending, refresh } = await useFetch<any[]>(`/api/${props.dealId}/comps`)
const comps = computed(() => compsRaw.value ?? [])

// ── RESEARCH DATE ─────────────────────────────────────────────────────────────
const editingDate = ref(false)
const dateInput   = ref(new Date().toISOString().slice(0, 10))
const researchDate = ref(new Date())
const displayDate = computed(() =>
  researchDate.value.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
)
function saveDate() {
  researchDate.value = new Date(dateInput.value)
  editingDate.value = false
}

// ── INSIGHTS ──────────────────────────────────────────────────────────────────
const insights        = ref('')
const insightsDraft   = ref('')
const editingInsights = ref(false)
function startInsightsEdit() {
  insightsDraft.value = insights.value
  editingInsights.value = true
}
function saveInsights() {
  insights.value = insightsDraft.value
  editingInsights.value = false
}

// ── FILTERS & SORT ────────────────────────────────────────────────────────────
const psFilter     = ref('all')
const tenureFilter = ref('all')
const mktFilter    = ref('all')
const sortKey      = ref('avgPSF')
const sortDir      = ref<1 | -1>(-1)

function setSort(key: string) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 1 ? -1 : 1
  else { sortKey.value = key; sortDir.value = -1 }
}
function sortIco(key: string) {
  if (sortKey.value !== key) return '↕'
  return sortDir.value === 1 ? '↑' : '↓'
}

const filtered = computed(() => {
  return comps.value.filter(c => {
    if (psFilter.value !== 'all' && c.projectStatus !== psFilter.value) return false
    if (tenureFilter.value === 'Freehold' && c.tenure !== 'Freehold') return false
    if (tenureFilter.value === 'Leasehold' && !c.tenure?.startsWith('Leasehold')) return false
    if (mktFilter.value === 'primary' && c.salesStatus !== 'Primary Market') return false
    if (mktFilter.value === 'secondary' && c.salesStatus !== 'Secondary Market') return false
    return true
  }).sort((a, b) => {
    const k = sortKey.value as keyof typeof a
    let av = a[k], bv = b[k]
    if (typeof av === 'string') { av = av.toLowerCase(); bv = (bv as string).toLowerCase() }
    return av < bv ? sortDir.value : av > bv ? -sortDir.value : 0
  })
})

// ── KPI COMPUTED ──────────────────────────────────────────────────────────────
const dealPSF = computed(() => props.fin?.blendedPSF ?? 0)

const psfRange = computed(() => {
  const psfs = filtered.value.map(c => c.avgPSF).filter(Boolean)
  if (!psfs.length) return '—'
  return `RM ${Math.min(...psfs).toLocaleString()}–${Math.max(...psfs).toLocaleString()}`
})
const avgTakeUp = computed(() => {
  const rates = filtered.value.map(c => c.takeUpRate).filter((v): v is number => v > 0)
  if (!rates.length) return 0
  return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
})
const medianPSF = computed(() => {
  const psfs = [...filtered.value.map(c => c.avgPSF).filter(Boolean)].sort((a, b) => a - b)
  if (!psfs.length) return 0
  return psfs[Math.floor(psfs.length / 2)]
})

function psfClass(psf: number) {
  if (psf >= dealPSF.value) return 'psf-hi'
  if (psf >= dealPSF.value * 0.88) return 'psf-ok'
  return 'psf-lo'
}
function markerColor(psf: number) {
  if (psf >= dealPSF.value) return '#1D9E75'
  if (psf >= dealPSF.value * 0.88) return '#EF9F27'
  return '#E24B4A'
}

// ── EXPAND ────────────────────────────────────────────────────────────────────
const expandedId   = ref<number | null>(null)
const highlightedId = ref<number | null>(null)
function toggleExpand(id: number) {
  expandedId.value = expandedId.value === id ? null : id
  highlightedId.value = null
}

// ── CHARTS ────────────────────────────────────────────────────────────────────
const psfCanvas    = ref<HTMLCanvasElement | null>(null)
const takeupCanvas = ref<HTMLCanvasElement | null>(null)
let psfChart: any = null
let takeupChart: any = null

async function renderCharts() {
  if (typeof window === 'undefined') return
  const { Chart } = await import('chart.js/auto')
  await nextTick()

  const rows = [...filtered.value].sort((a, b) => a.avgPSF - b.avgPSF)
  const labels = rows.map(r => r.projectName)
  const psfs   = rows.map(r => r.avgPSF)
  const deal   = dealPSF.value

  if (psfChart) psfChart.destroy()
  if (psfCanvas.value) {
    psfChart = new Chart(psfCanvas.value, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Avg PSF',
          data: psfs,
          backgroundColor: psfs.map(p => p >= deal ? 'rgba(29,158,117,.75)' : p >= deal * 0.88 ? 'rgba(239,159,39,.75)' : 'rgba(176,173,168,.55)'),
          borderRadius: 4,
          borderWidth: 0,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c: any) => `RM ${c.raw.toLocaleString()} psf` } },
        },
        scales: {
          x: {
            min: 400,
            grid: { color: 'rgba(0,0,0,.05)' },
            ticks: { font: { size: 10, family: "'DM Mono'" }, color: '#7A7770', callback: (v: any) => 'RM ' + v.toLocaleString() },
          },
          y: { grid: { display: false }, ticks: { font: { size: 10.5, family: "'DM Sans'" }, color: '#1A1916' } },
        },
        animation: { duration: 300 },
      },
      plugins: [{
        id: 'dealLine',
        afterDraw(chart: any) {
          if (!deal) return
          const { ctx, chartArea: { top, bottom }, scales: { x } } = chart
          const xp = x.getPixelForValue(deal)
          ctx.save()
          ctx.beginPath()
          ctx.setLineDash([5, 4])
          ctx.strokeStyle = '#854F0B'
          ctx.lineWidth = 1.5
          ctx.moveTo(xp, top)
          ctx.lineTo(xp, bottom)
          ctx.stroke()
          ctx.restore()
        },
      }],
    })
  }

  const tuRows = [...filtered.value].sort((a, b) => b.takeUpRate - a.takeUpRate)
  if (takeupChart) takeupChart.destroy()
  if (takeupCanvas.value) {
    takeupChart = new Chart(takeupCanvas.value, {
      type: 'bar',
      data: {
        labels: tuRows.map(r => r.projectName),
        datasets: [{
          label: 'Take-Up %',
          data: tuRows.map(r => r.takeUpRate),
          backgroundColor: tuRows.map(r =>
            r.takeUpRate >= 85 ? 'rgba(29,158,117,.75)'
            : r.takeUpRate >= 70 ? 'rgba(239,159,39,.75)'
            : 'rgba(162,45,45,.65)'
          ),
          borderRadius: 4,
          borderWidth: 0,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c: any) => c.raw + '%' } },
        },
        scales: {
          x: {
            min: 0, max: 100,
            grid: { color: 'rgba(0,0,0,.05)' },
            ticks: { font: { size: 10, family: "'DM Mono'" }, color: '#7A7770', callback: (v: any) => v + '%' },
          },
          y: { grid: { display: false }, ticks: { font: { size: 10.5, family: "'DM Sans'" }, color: '#1A1916' } },
        },
        animation: { duration: 300 },
      },
    })
  }
}

// ── MAP ───────────────────────────────────────────────────────────────────────
const mapEl = ref<HTMLElement | null>(null)
let leafletMap: any = null
let markers: Record<number, any> = {}

async function initMap() {
  if (typeof window === 'undefined' || !mapEl.value) return
  const L = (await import('leaflet')).default
  await import('leaflet/dist/leaflet.css')

  const dealLat = props.meta?.lat ?? 3.1555
  const dealLng = props.meta?.lng ?? 101.7190

  leafletMap = L.map(mapEl.value, { zoomControl: true, scrollWheelZoom: false }).setView([dealLat, dealLng], 14)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19,
  }).addTo(leafletMap)

  const siteIcon = L.divIcon({
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `<div style="width:16px;height:16px;background:#1A1916;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
  })
  L.marker([dealLat, dealLng], { icon: siteIcon }).addTo(leafletMap)
    .bindPopup(`<strong>Our Site</strong><br>${props.meta?.name ?? ''}<br>Target: RM ${dealPSF.value.toLocaleString()} psf`)
}

function renderMap() {
  if (!leafletMap) return
  import('leaflet').then(({ default: L }) => {
    Object.values(markers).forEach((m: any) => leafletMap.removeLayer(m))
    markers = {}
    filtered.value.forEach(c => {
      if (!c.lat || !c.lng) return
      const col = markerColor(c.avgPSF)
      const icon = L.divIcon({
        className: '',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
        html: `<div style="width:12px;height:12px;background:${col};border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);cursor:pointer"></div>`,
      })
      const m = L.marker([c.lat, c.lng], { icon }).addTo(leafletMap)
      m.bindPopup(`<strong>${c.projectName}</strong><br>${c.developer}<br>RM ${c.avgPSF?.toLocaleString()} psf · ${c.takeUpRate}% take-up`)
      m.on('click', () => {
        highlightedId.value = c.id
        expandedId.value = c.id
      })
      markers[c.id] = m
    })
  })
}

// Rerender charts + map when filtered data changes
watch(filtered, async () => {
  await renderCharts()
  renderMap()
}, { deep: true })

onMounted(async () => {
  await renderCharts()
  await initMap()
  renderMap()
})

onBeforeUnmount(() => {
  psfChart?.destroy()
  takeupChart?.destroy()
  leafletMap?.remove()
})

// ── ADD / EDIT FORM ───────────────────────────────────────────────────────────
const showForm     = ref(false)
const saving       = ref(false)
const formError    = ref('')
const editingComp  = ref<any>(null)
const facilitiesRaw = ref('')

const form = reactive({
  projectName: '', developer: '', architect: '', location: '',
  lat: null as number | null, lng: null as number | null,
  projectStatus: 'Ongoing', completion: null as number | null,
  units: null as number | null, blocks: null as number | null,
  storeys: null as number | null, sizeMin: null as number | null,
  sizeMax: null as number | null, avgPSF: null as number | null,
  tenure: 'Freehold', salesStatus: 'Primary Market',
  maintenanceFee: '', furnishing: 'Semi-Furnished',
  acSystem: 'Split Unit', hasBathtub: false,
  secureBuilding: false, greenBuilding: false,
  takeUpRate: null as number | null,
  imageUrl: '', notes: '',
})

function blankForm() {
  Object.assign(form, {
    projectName: '', developer: '', architect: '', location: '',
    lat: null, lng: null, projectStatus: 'Ongoing', completion: null,
    units: null, blocks: null, storeys: null, sizeMin: null,
    sizeMax: null, avgPSF: null, tenure: 'Freehold',
    salesStatus: 'Primary Market', maintenanceFee: '',
    furnishing: 'Semi-Furnished', acSystem: 'Split Unit',
    hasBathtub: false, secureBuilding: false, greenBuilding: false,
    takeUpRate: null, imageUrl: '', notes: '',
  })
  facilitiesRaw.value = ''
  formError.value = ''
}

function openAddForm() {
  editingComp.value = null
  blankForm()
  showForm.value = true
}

function openEditForm(c: any) {
  editingComp.value = c
  Object.assign(form, {
    projectName: c.projectName, developer: c.developer, architect: c.architect,
    location: c.location, lat: c.lat, lng: c.lng,
    projectStatus: c.projectStatus, completion: c.completion,
    units: c.units, blocks: c.blocks, storeys: c.storeys,
    sizeMin: c.sizeMin, sizeMax: c.sizeMax, avgPSF: c.avgPSF,
    tenure: c.tenure, salesStatus: c.salesStatus,
    maintenanceFee: c.maintenanceFee, furnishing: c.furnishing,
    acSystem: c.acSystem, hasBathtub: c.hasBathtub,
    secureBuilding: c.secureBuilding, greenBuilding: c.greenBuilding,
    takeUpRate: c.takeUpRate, imageUrl: c.imageUrl, notes: c.notes,
  })
  facilitiesRaw.value = (c.facilities ?? []).join(', ')
  formError.value = ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingComp.value = null
}

async function saveComp() {
  if (!form.projectName.trim() || !form.developer.trim() || !form.avgPSF) {
    formError.value = 'Project Name, Developer, and Avg PSF are required.'
    return
  }
  formError.value = ''
  saving.value = true
  const payload = {
    ...form,
    facilities: facilitiesRaw.value.split(',').map(s => s.trim()).filter(Boolean),
  }
  try {
    if (editingComp.value) {
      await $fetch(`/api/${props.dealId}/comps/${editingComp.value.id}`, { method: 'PUT', body: payload })
    } else {
      await $fetch(`/api/${props.dealId}/comps`, { method: 'POST', body: payload })
    }
    await refresh()
    closeForm()
    await nextTick()
    await renderCharts()
    renderMap()
  } catch (e: any) {
    formError.value = e?.data?.message ?? 'Save failed. Please try again.'
  } finally {
    saving.value = false
  }
}

async function deleteComp(c: any) {
  if (!confirm(`Remove "${c.projectName}"?`)) return
  await $fetch(`/api/${props.dealId}/comps/${c.id}`, { method: 'DELETE' })
  expandedId.value = null
  await refresh()
  await nextTick()
  await renderCharts()
  renderMap()
}

// ── BUYER PROFILES ────────────────────────────────────────────────────────────
const buyerEditMode = ref(false)
const buyerProfiles = ref([
  { icon: '🏡', color: '#E1F5EE', name: 'Owner Occupiers', attrs: ['Low-rise, private enclave living', 'Golf views as everyday backdrop', 'Intuitive layouts, human-scaled design', 'Architecture that feels timeless'], editText: '' },
  { icon: '🌍', color: '#E6F1FB', name: 'Expats',          attrs: ['Embassy-area location & security', 'Global design language', 'Indoor–outdoor living & wellness spaces', 'Calm, ordered environments'], editText: '' },
  { icon: '🏗️', color: '#FEF3E2', name: 'Landed Upgraders', attrs: ['Prestigious embassy district address', 'Larger unit formats (2,000–5,000 sf)', 'Private lift lobby & concierge', 'Premium fit-out without maintenance burden'], editText: '' },
  { icon: '✦',  color: '#EEEDFE', name: 'Design Minimalists', attrs: ['Mid-Century Modern architecture', 'Honest structure and horizontality', 'Passive sustainability in design', 'Architecture that makes sense — no excess'], editText: '' },
])

function toggleBuyerEdit() {
  if (!buyerEditMode.value) {
    buyerProfiles.value.forEach(p => { p.editText = p.attrs.join('\n') })
    buyerEditMode.value = true
  } else {
    buyerProfiles.value.forEach(p => {
      p.attrs = p.editText.split('\n').map(s => s.trim()).filter(Boolean)
    })
    buyerEditMode.value = false
  }
}
</script>

<style scoped>
/* ── TAB WRAPPER ── */
.mr-tab { padding: 24px; max-width: 1280px; margin: 0 auto; }

/* ── META BAR ── */
.mr-meta-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.mr-meta-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.mr-meta-lbl { font-size: 10.5px; font-weight: 500; color: var(--muted); text-transform: uppercase; letter-spacing: .07em; }
.mr-meta-date { font-size: 13px; font-weight: 600; font-family: var(--mono); }
.mr-meta-by { font-size: 11.5px; color: var(--muted); margin-left: 6px; }
.mr-meta-by strong { color: var(--text); font-weight: 500; }
.mr-date-input { height: 28px; padding: 0 8px; border: 1px solid var(--border2); border-radius: var(--rs); font-family: var(--mono); font-size: 12px; outline: none; }

/* ── KPI STRIP ── */
.kpi-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 20px; }
.kpi { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 14px 16px; box-shadow: var(--sh); transition: box-shadow .2s, transform .2s; }
.kpi:hover { box-shadow: var(--shm); transform: translateY(-1px); }
.kpi-l { font-size: 10.5px; color: var(--muted); text-transform: uppercase; letter-spacing: .07em; margin-bottom: 6px; font-weight: 500; }
.kpi-v { font-size: 22px; font-weight: 600; line-height: 1; letter-spacing: -.5px; }
.kpi-s { font-size: 11px; margin-top: 5px; color: var(--muted); }
.kpi-s.up { color: var(--green); }
.kpi-s.warn { color: var(--amber); }

/* ── CHARTS ── */
.g3-charts { display: grid; grid-template-columns: 1fr 1fr 1.1fr; gap: 14px; margin-bottom: 20px; }
.cw { position: relative; height: 210px; }
.map-container { height: 232px; border-radius: 0; border: none; position: relative; z-index: 1; }
.ref-legend { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--muted); margin-top: 8px; }
.ref-line-sample { width: 22px; height: 2px; border-top: 2px dashed #854F0B; display: inline-block; margin-bottom: -1px; }
.map-legend { position: absolute; bottom: 8px; left: 8px; background: rgba(255,255,255,.92); border-radius: 6px; padding: 6px 10px; font-size: 10.5px; z-index: 10; line-height: 1.9; box-shadow: var(--sh); }
.ml-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }

/* ── CARD ── */
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 16px 18px; box-shadow: var(--sh); }
.cl { font-size: 10.5px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 12px; }
.mb20 { margin-bottom: 20px; }

/* ── INSIGHTS ── */
.insights-body { font-size: 12.5px; color: var(--text); line-height: 1.7; white-space: pre-wrap; min-height: 48px; }
.insights-textarea { width: 100%; min-height: 90px; padding: 10px 12px; border: 1px solid var(--border2); border-radius: var(--rs); font-family: var(--font); font-size: 12.5px; color: var(--text); background: var(--surface); resize: vertical; outline: none; line-height: 1.6; }
.insights-textarea:focus { border-color: var(--blue); }

/* ── FILTERS ── */
.filter-row { display: flex; align-items: center; gap: 7px; margin-bottom: 14px; flex-wrap: wrap; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.filter-lbl { font-size: 10.5px; color: var(--muted); font-weight: 500; white-space: nowrap; }
.filter-sep { width: 1px; height: 16px; background: var(--border2); margin: 0 1px; }
.pill { height: 27px; padding: 0 11px; border: 1px solid var(--border2); border-radius: 20px; background: transparent; font-family: var(--font); font-size: 11.5px; font-weight: 500; color: var(--muted); cursor: pointer; transition: all .15s; display: inline-flex; align-items: center; }
.pill:hover { background: var(--surface2); color: var(--text); }
.pill.on { background: var(--text); color: #fff; border-color: var(--text); }

/* ── TABLE ── */
.tbl-wrap { overflow-x: auto; }
.ct { width: 100%; border-collapse: collapse; font-size: 12.5px; min-width: 1150px; }
.ct th { font-size: 10px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; padding: 9px 11px; text-align: left; border-bottom: 1px solid var(--border2); white-space: nowrap; background: var(--surface2); cursor: pointer; user-select: none; }
.ct th:hover { color: var(--text); }
.ct td { padding: 9px 11px; border-bottom: 1px solid var(--border); vertical-align: middle; white-space: nowrap; }
.ct tbody tr { transition: background .1s; cursor: pointer; }
.ct tbody tr:hover { background: var(--surface2); }
.ct tbody tr.expanded { background: #FAFAF8; }
.ct tr:last-child td { border-bottom: none; }
.sort-ico { font-size: 9px; opacity: .35; margin-left: 2px; }
.psf-hi { color: var(--green-txt); font-weight: 600; }
.psf-ok { color: var(--amber); font-weight: 600; }
.psf-lo { color: var(--red); font-weight: 600; }
.chk { color: var(--green); }
.crs { color: var(--faint); }
.ct tbody tr.map-highlight td { background: #FEF9EE !important; box-shadow: inset 3px 0 0 #854F0B; }

/* ── PROJECT CELL ── */
.proj-cell { display: flex; align-items: center; gap: 9px; }
.proj-thumb { width: 60px; height: 42px; border-radius: 6px; object-fit: cover; border: 1px solid var(--border); flex-shrink: 0; }
.proj-thumb-ph { width: 60px; height: 42px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface2); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; color: var(--faint); }

/* ── EXPANDED ROW ── */
.expand-row td { padding: 0 !important; border-bottom: 1px solid var(--border2) !important; }
.expand-inner { padding: 14px 16px 16px; background: #FAFAF8; display: grid; grid-template-columns: 240px 1fr 1fr; gap: 16px; border-top: 1px dashed var(--border2); }
.expand-photo { width: 100%; height: 150px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border); display: block; }
.expand-photo-ph { width: 100%; height: 150px; border-radius: 8px; border: 1px dashed var(--border2); background: var(--surface2); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 5px; color: var(--faint); font-size: 11.5px; }
.expand-lbl { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 4px; font-weight: 500; }
.expand-val { font-size: 12.5px; color: var(--text); line-height: 1.5; }
.fac-pills { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px; }
.fac-pill { font-size: 10.5px; padding: 2px 8px; border-radius: 20px; background: var(--blue-bg); color: var(--blue); }

/* ── BADGES ── */
.b { font-size: 10.5px; font-weight: 500; padding: 2px 9px; border-radius: 20px; letter-spacing: .02em; }
.b-grn { background: var(--green-bg); color: var(--green-txt); }
.b-grey { background: var(--surface2); color: var(--muted); border: 1px solid var(--border); }
.b-blue { background: var(--blue-bg); color: var(--blue); }
.b-amb { background: var(--amber-bg); color: var(--amber); }
.b-ong { background: #E6F1FB; color: #185FA5; }
.b-done { background: var(--green-bg); color: var(--green-txt); }

/* ── FORM ── */
.add-form-wrap { background: var(--surface); border-top: 1px solid var(--border2); padding: 20px; }
.form-title { font-size: 13px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
.form-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px; }
.form-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px; }
.fg { display: flex; flex-direction: column; gap: 4px; }
.fg label { font-size: 10px; font-weight: 500; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
.fg input, .fg select, .fg textarea { width: 100%; height: 32px; padding: 0 10px; border: 1px solid var(--border2); border-radius: var(--rs); font-family: var(--font); font-size: 12.5px; color: var(--text); background: var(--surface); outline: none; transition: border-color .15s; }
.fg input:focus, .fg select:focus, .fg textarea:focus { border-color: var(--blue); }
.fg textarea { height: 64px; padding: 8px 10px; resize: none; line-height: 1.4; }
.form-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border); }
.form-err { font-size: 12px; color: var(--red); margin-right: auto; }
.cb-row { display: flex; align-items: center; gap: 6px; font-size: 12.5px; cursor: pointer; }
.cb-row input[type=checkbox] { width: 14px; height: 14px; accent-color: var(--green); cursor: pointer; }
.img-preview { width: 76px; height: 50px; border-radius: 6px; border: 1px solid var(--border); overflow: hidden; flex-shrink: 0; background: var(--surface2); display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--faint); }

/* ── EMPTY ── */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; color: var(--muted); text-align: center; }
.empty-ico { font-size: 30px; margin-bottom: 10px; opacity: .5; }
.empty-t { font-size: 13px; font-weight: 500; color: var(--text); margin-bottom: 3px; }
.empty-s { font-size: 12px; }

/* ── BUYER PROFILES ── */
.buyer-section { margin-top: 4px; }
.buyer-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 12px; }
.buyer-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 16px; box-shadow: var(--sh); }
.buyer-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; margin-bottom: 10px; }
.buyer-name { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
.buyer-attr-lbl { font-size: 9.5px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .07em; margin-bottom: 5px; }
.buyer-attr-list { list-style: none; display: flex; flex-direction: column; gap: 4px; }
.buyer-attr-list li { font-size: 11.5px; color: var(--muted); display: flex; align-items: flex-start; gap: 6px; line-height: 1.4; }
.buyer-attr-list li::before { content: '·'; color: var(--faint); flex-shrink: 0; margin-top: 1px; }
.buyer-edit-area { width: 100%; padding: 8px 10px; border: 1px solid var(--border2); border-radius: var(--rs); font-family: var(--font); font-size: 12px; color: var(--text); background: var(--surface); resize: none; outline: none; line-height: 1.5; }
.buyer-edit-area:focus { border-color: var(--blue); }

/* ── BUTTONS ── */
.btn { height: 30px; padding: 0 12px; border: 1px solid var(--border2); border-radius: var(--rs); background: transparent; font-family: var(--font); font-size: 12px; font-weight: 500; color: var(--muted); cursor: pointer; transition: all .15s; display: inline-flex; align-items: center; gap: 5px; }
.btn:hover { background: var(--surface2); color: var(--text); }
.btn-p { height: 30px; padding: 0 14px; border: none; border-radius: var(--rs); background: var(--text); color: #fff; font-family: var(--font); font-size: 12px; font-weight: 500; cursor: pointer; transition: opacity .15s; display: inline-flex; align-items: center; gap: 6px; }
.btn-p:hover { opacity: .82; }
.btn-p:disabled { opacity: .5; cursor: not-allowed; }
.btn-sm { height: 26px; padding: 0 10px; font-size: 11px; }

/* ── TRANSITION ── */
.slide-down-enter-active, .slide-down-leave-active { transition: all .2s ease; overflow: hidden; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
