<template>
  <div>
    <!-- DEAL HEADER -->
    <div class="deal-header" :class="{ 'edit-mode-header': editMode }">
      <div class="dh-inner">
        <div class="dh-top">

          <!-- Left: name + meta -->
          <div class="dh-left">
            <!-- View mode -->
            <template v-if="!editMode">
              <div class="deal-name">{{ meta?.name ?? dealId }}</div>
              <div class="deal-meta">
                <span class="deal-ref">{{ meta?.ref }}</span>
                <span class="sep-dot">·</span>
                <span>{{ deal?.location ?? meta?.location }}</span>
                <span class="sep-dot">·</span>
                <span>{{ meta?.tenure }} · {{ meta?.landArea }} ac</span>
              </div>
            </template>
            <!-- Edit mode -->
            <template v-else>
              <input v-model="draftMeta.name" class="edit-input edit-name" placeholder="Deal name" />
              <div class="edit-meta-row">
                <input v-model="draftDeal.location" class="edit-input edit-meta-field" placeholder="Location" style="flex:2" />
                <select v-model="draftMeta.tenure" class="edit-select edit-meta-field">
                  <option>Freehold</option>
                  <option>Leasehold 99yr</option>
                  <option>Leasehold 60yr</option>
                </select>
                <input v-model.number="draftMeta.landArea" type="number" step="0.01" class="edit-input edit-meta-field" placeholder="Land (ac)" style="width:90px" />
                <span class="edit-meta-unit">ac</span>
              </div>
            </template>
          </div>

          <!-- Right: badges + action buttons -->
          <div class="deal-badges">
            <span v-if="isRestricted" class="badge badge-red">Confidential</span>

            <!-- Stage: badge (view) or select (edit) -->
            <template v-if="!editMode">
              <span class="badge" :class="stageBadge">{{ deal?.stage }}</span>
            </template>
            <template v-else>
              <select v-model="draftDeal.stage" class="edit-select">
                <option>Active DD</option>
                <option>KIV</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </template>

            <NuxtLink v-if="!editMode" to="/" class="btn-back">← All Deals</NuxtLink>

            <!-- Edit / Save / Cancel -->
            <template v-if="!editMode">
              <button class="btn-edit" @click="startEdit">✏ Edit</button>
            </template>
            <template v-else>
              <button class="btn-save" :disabled="saving" @click="saveChanges">
                {{ saving ? 'Saving…' : 'Save' }}
              </button>
              <button class="btn-cancel" @click="cancelEdit">Cancel</button>
            </template>
          </div>
        </div>

        <!-- Save confirmation toast -->
        <Transition name="toast">
          <div v-if="savedToast" class="saved-toast">✓ Changes saved</div>
        </Transition>

        <!-- TAB BAR -->
        <div class="tab-bar" role="tablist">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab"
            :class="{ active: activeTab === tab.key }"
            role="tab"
            :aria-selected="activeTab === tab.key"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- TAB CONTENT -->
    <div class="tab-content">
      <Transition name="fade-up" mode="out-in">
        <OverviewTab
          v-if="activeTab === 'overview'"
          :meta="editMode ? draftMeta : meta"
          :deal="editMode ? draftDeal : deal"
          :fin="fin"
          :edit-mode="editMode"
          :deal-id="dealId"
        />
        <DocumentsTab  v-else-if="activeTab === 'documents'"  :deal-id="dealId" />
        <FinancialsTab v-else-if="activeTab === 'financials'" :deal="deal" :meta="meta" :fin="fin" />
        <RiskTab       v-else-if="activeTab === 'risk'"       :deal-id="dealId" :meta="meta" :deal="deal" />
        <TeamTab       v-else-if="activeTab === 'team'"       :deal-id="dealId" />
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const dealId = route.params.dealId as string

const { data: meta, error, refresh: refreshMeta } = await useFetch(`/api/${dealId}/meta`)
if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Deal not found' })
}

const { data: dealsData, refresh: refreshDeals } = await useFetch('/api/deals')
const deal = computed(() => {
  const deals = (dealsData.value as any)?.deals ?? []
  return deals.find((d: any) => d.id === dealId) ?? null
})

// ── Shared financials — single source of truth for both Overview + Financials tabs ──
const fin = computed(() => {
  const gdv      = deal.value?.gdv      ?? 0
  const landCost = deal.value?.landCost ?? 0
  const constr    = Math.round(gdv * 0.40)
  const authority = Math.round(gdv * 0.03)
  const siteStaff = Math.round(gdv * 0.025)
  const finance   = Math.round(gdv * 0.035)
  const marketing = Math.round(gdv * 0.03)
  const totalDevCost = landCost + constr + authority + siteStaff + finance + marketing
  const ndv       = Math.round(gdv * 0.93)
  const ndp       = ndv - totalDevCost
  const ndpMargin = ndv > 0 ? parseFloat(((ndp / ndv) * 100).toFixed(1)) : 0
  const equity    = Math.round(totalDevCost * 0.27)
  return { ndv, constr, authority, siteStaff, finance, marketing, totalDevCost, ndp, ndpMargin, equityRequired: equity, landCost }
})
const isRestricted = computed(() => deal.value?.restricted ?? false)

const stageBadgeMap: Record<string, string> = {
  'Active DD': 'badge-blue',
  'KIV':       'badge-amber',
  'Approved':  'badge-green',
  'Rejected':  'badge-red',
}
const stageBadge = computed(() => stageBadgeMap[deal.value?.stage] ?? 'badge-grey')

const tabs = [
  { key: 'overview',   label: 'Overview' },
  { key: 'documents',  label: 'Documents' },
  { key: 'financials', label: 'Financials' },
  { key: 'risk',       label: 'Risk & Legal' },
  { key: 'team',       label: 'Deal Team' },
]
const activeTab = ref('overview')

// ── EDIT MODE ──────────────────────────────────────────────────────
const editMode  = ref(false)
const saving    = ref(false)
const savedToast = ref(false)

// Draft objects — reactive copies of the fetched data
const draftMeta = reactive<any>({})
const draftDeal = reactive<any>({})

function startEdit() {
  // Deep copy current data into drafts
  Object.assign(draftMeta, JSON.parse(JSON.stringify(meta.value ?? {})))
  Object.assign(draftDeal, JSON.parse(JSON.stringify(deal.value ?? {})))
  editMode.value = true
  // Switch to Overview tab so all editable fields are visible
  activeTab.value = 'overview'
}

function cancelEdit() {
  editMode.value = false
}

async function saveChanges() {
  saving.value = true
  try {
    await Promise.all([
      $fetch(`/api/${dealId}/meta`, { method: 'PUT', body: draftMeta }),
      $fetch(`/api/${dealId}/deal`, { method: 'PUT', body: draftDeal }),
    ])
    // Refresh fetched data so view mode shows the new values
    await Promise.all([refreshMeta(), refreshDeals()])
    editMode.value = false
    savedToast.value = true
    setTimeout(() => { savedToast.value = false }, 2500)
  } catch (err) {
    alert('Save failed. Please try again.')
  } finally {
    saving.value = false
  }
}

// Keyboard shortcuts
onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && editMode.value) cancelEdit()
    if ((e.metaKey || e.ctrlKey) && e.key === 's' && editMode.value) {
      e.preventDefault()
      saveChanges()
    }
  }
  window.addEventListener('keydown', handler)
  onUnmounted(() => window.removeEventListener('keydown', handler))
})
</script>

<style scoped>
/* ── DEAL HEADER ── */
.deal-header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky; top: 52px; z-index: 90;
  transition: background 0.2s;
}
.edit-mode-header {
  background: #fffdf5;
  border-bottom-color: var(--amber);
}
.dh-inner {
  padding: 16px 28px 0;
  max-width: 1280px; margin: 0 auto; width: 100%;
}
.dh-top {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 14px;
}
.dh-left { flex: 1; min-width: 0; }
.deal-name {
  font-size: 18px; font-weight: 600; color: var(--text);
  letter-spacing: -0.3px; margin-bottom: 4px;
}
.deal-meta {
  font-size: 12px; color: var(--muted);
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.deal-ref { font-family: 'DM Mono', monospace; }
.sep-dot { color: var(--faint); }
.deal-badges { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; flex-shrink: 0; margin-left: 16px; }

/* badges */
.badge { font-size: 11px; font-weight: 500; padding: 3px 9px; border-radius: 20px; letter-spacing: 0.02em; }
.badge-green  { background: var(--green-bg);  color: var(--green-txt); }
.badge-amber  { background: var(--amber-bg);  color: var(--amber); }
.badge-blue   { background: #dbeafe;          color: #1d4ed8; }
.badge-red    { background: var(--red-bg);    color: var(--red); }
.badge-purple { background: var(--purple-bg); color: var(--purple); }
.badge-grey   { background: var(--surface2);  color: var(--muted); border: 1px solid var(--border); }

/* ── EDIT INPUTS ── */
.edit-input {
  height: 30px; padding: 0 10px;
  border: 1.5px solid var(--amber); border-radius: var(--radius-sm);
  background: #fff; font-family: 'DM Sans', sans-serif;
  font-size: 13px; color: var(--text);
  outline: none; transition: border-color 0.15s;
}
.edit-input:focus { border-color: #D48C0A; }
.edit-name {
  font-size: 16px; font-weight: 600; height: 34px;
  width: 100%; max-width: 480px; margin-bottom: 8px;
  letter-spacing: -0.2px;
}
.edit-meta-row {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.edit-meta-field { height: 28px; font-size: 12px; }
.edit-meta-unit { font-size: 12px; color: var(--muted); }
.edit-select {
  height: 30px; padding: 0 8px;
  border: 1.5px solid var(--amber); border-radius: var(--radius-sm);
  background: #fff; font-family: 'DM Sans', sans-serif;
  font-size: 12px; color: var(--text); cursor: pointer;
  outline: none;
}

/* ── ACTION BUTTONS ── */
.btn-back {
  height: 28px; padding: 0 12px;
  border: 1px solid var(--border2); border-radius: var(--radius-sm);
  background: transparent; font-family: 'DM Sans', sans-serif;
  font-size: 12px; font-weight: 500; color: var(--muted);
  cursor: pointer; transition: all 0.15s;
  display: inline-flex; align-items: center; text-decoration: none;
}
.btn-back:hover { background: var(--surface2); color: var(--text); }
.btn-edit {
  height: 28px; padding: 0 12px;
  border: 1px solid var(--border2); border-radius: var(--radius-sm);
  background: transparent; font-family: 'DM Sans', sans-serif;
  font-size: 12px; font-weight: 500; color: var(--muted);
  cursor: pointer; transition: all 0.15s;
}
.btn-edit:hover { background: var(--surface2); color: var(--text); }
.btn-save {
  height: 28px; padding: 0 14px;
  border: none; border-radius: var(--radius-sm);
  background: var(--text); color: #fff;
  font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s;
}
.btn-save:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-cancel {
  height: 28px; padding: 0 12px;
  border: 1px solid var(--border2); border-radius: var(--radius-sm);
  background: transparent; font-family: 'DM Sans', sans-serif;
  font-size: 12px; font-weight: 500; color: var(--muted);
  cursor: pointer; transition: all 0.15s;
}
.btn-cancel:hover { background: var(--surface2); color: var(--text); }

/* ── TOAST ── */
.saved-toast {
  position: absolute; right: 28px; top: 12px;
  background: var(--green); color: #fff;
  font-size: 12px; font-weight: 500; padding: 5px 14px;
  border-radius: 20px; pointer-events: none;
}
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toast-enter-from  { opacity: 0; transform: translateY(-6px); }
.toast-leave-to    { opacity: 0; transform: translateY(-4px); }

/* ── TAB BAR ── */
.tab-bar { display: flex; }
.tab {
  font-size: 13px; font-weight: 400; color: var(--muted);
  padding: 10px 16px; cursor: pointer;
  border: none; background: transparent;
  border-bottom: 2px solid transparent;
  transition: color 0.15s; white-space: nowrap; user-select: none;
  font-family: 'DM Sans', sans-serif;
}
.tab:hover { color: var(--text); }
.tab.active { color: var(--text); font-weight: 500; border-bottom-color: var(--text); }

/* ── TAB CONTENT ── */
.tab-content {
  padding: 24px 28px;
  max-width: 1280px; margin: 0 auto; width: 100%;
}

/* ── TRANSITIONS ── */
.fade-up-enter-active,
.fade-up-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.fade-up-enter-from   { opacity: 0; transform: translateY(6px); }
.fade-up-leave-to     { opacity: 0; transform: translateY(-4px); }
</style>
