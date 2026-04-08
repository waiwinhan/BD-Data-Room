<template>
  <div class="documents">

    <div class="docs-grid">

      <!-- ── DYNAMIC CATEGORY CARDS ── -->
      <div v-for="cat in categories" :key="cat.id" class="doc-card">
        <div class="card-header">
          <!-- Card title — inline rename when editing -->
          <template v-if="renamingCard === cat.id">
            <input
              v-model="editCardLabel"
              class="card-rename-input"
              @keydown.enter="saveCardRename(cat)"
              @keydown.escape="cancelCardRename"
              @blur="saveCardRename(cat)"
            />
          </template>
          <template v-else>
            <span class="card-title">{{ cat.label }}</span>
          </template>
          <div class="card-header-actions">
            <span class="doc-count">{{ (docsByCategory[cat.id] ?? []).length }} files</span>
            <button class="card-action-btn" title="Rename category" @click="startCardRename(cat)">✎</button>
          </div>
        </div>

        <div v-if="pending" class="doc-empty">Loading…</div>
        <div v-else-if="(docsByCategory[cat.id] ?? []).length === 0" class="doc-empty">No documents uploaded yet.</div>
        <div v-else class="doc-list">
          <div v-for="doc in (docsByCategory[cat.id] ?? [])" :key="doc.filename" class="doc-row">
            <div class="doc-type" :class="typeClass(doc.type)">{{ doc.type }}</div>
            <div class="doc-body" @click="renamingFile !== doc.filename && previewDoc(doc)">
              <template v-if="renamingFile === doc.filename">
                <input
                  ref="renameInput"
                  v-model="editName"
                  class="rename-input"
                  @keydown.enter="saveRename(doc)"
                  @keydown.escape="cancelRename"
                  @blur="saveRename(doc)"
                  @click.stop
                />
              </template>
              <template v-else>
                <div class="doc-name">{{ doc.name }}</div>
                <div class="doc-meta">{{ doc.uploader }}{{ doc.uploader ? ' · ' : '' }}{{ formatDate(doc.date) }} · {{ formatSize(doc.sizeKB) }}</div>
              </template>
            </div>
            <span class="doc-status" :class="statusClass(doc.status)">{{ doc.status }}</span>
            <button class="rename-btn" title="Rename file" @click.stop="startRename(doc)">✎</button>
            <a :href="dlUrl(doc)" download class="dl-btn" title="Download">↓</a>
          </div>
        </div>

        <button class="upload-btn" @click="triggerUpload(cat.id)">+ Add document</button>
      </div>

      <!-- ── ADD NEW CARD ── -->
      <div class="doc-card add-card" @click="addingCard ? null : startAddCard()">
        <template v-if="addingCard">
          <div class="add-card-form">
            <input
              ref="newCardInput"
              v-model="newCardLabel"
              class="card-rename-input"
              placeholder="Category name…"
              @keydown.enter="confirmAddCard"
              @keydown.escape="cancelAddCard"
            />
            <div class="add-card-actions">
              <button class="add-card-confirm" @click.stop="confirmAddCard">Add</button>
              <button class="add-card-cancel" @click.stop="cancelAddCard">Cancel</button>
            </div>
          </div>
        </template>
        <template v-else>
          <span class="add-card-icon">+</span>
          <span class="add-card-label">New category</span>
        </template>
      </div>

    </div>

    <!-- hidden file input for upload (M08) -->
    <input ref="fileInput" type="file" style="display:none" @change="onFileChosen" />

    <!-- ── SUMMARY STRIP ── -->
    <div class="doc-summary">
      <div class="summary-item">
        <span class="summary-num">{{ totalCount }}</span>
        <span class="summary-lbl">Total files</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-num s-new">{{ countByStatus('New') }}</span>
        <span class="summary-lbl">New</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-num s-reviewed">{{ countByStatus('Reviewed') }}</span>
        <span class="summary-lbl">Reviewed</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-num s-pending">{{ countByStatus('Pending') }}</span>
        <span class="summary-lbl">Pending</span>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ dealId: string }>()

// ── Documents ──
const { data, pending, refresh } = await useFetch(() => `/api/${props.dealId}/documents`)
const docsByCategory = computed(() => (data.value as any) ?? {})
const allDocs = computed(() => Object.values(docsByCategory.value).flat() as any[])
const totalCount = computed(() => allDocs.value.length)

function countByStatus(status: string) {
  return allDocs.value.filter((d: any) => d.status === status).length
}

// ── Categories ──
const { data: catData, refresh: refreshCats } = await useFetch(() => `/api/${props.dealId}/doc-categories`)
const categories = computed(() => (catData.value as any[]) ?? [])

// Card rename
const renamingCard = ref<string | null>(null)
const editCardLabel = ref('')

function startCardRename(cat: any) {
  renamingCard.value = cat.id
  editCardLabel.value = cat.label
}
function cancelCardRename() {
  renamingCard.value = null
}
async function saveCardRename(cat: any) {
  if (!renamingCard.value) return
  const label = editCardLabel.value.trim()
  renamingCard.value = null
  if (!label || label === cat.label) return
  const updated = categories.value.map((c: any) =>
    c.id === cat.id ? { ...c, label } : c
  )
  await $fetch(`/api/${props.dealId}/doc-categories`, { method: 'PUT', body: updated })
  await refreshCats()
}

// Add card
const addingCard = ref(false)
const newCardLabel = ref('')
const newCardInput = ref<HTMLInputElement>()

function startAddCard() {
  addingCard.value = true
  newCardLabel.value = ''
  nextTick(() => newCardInput.value?.focus())
}
function cancelAddCard() {
  addingCard.value = false
}
async function confirmAddCard() {
  const label = newCardLabel.value.trim()
  if (!label) return
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const updated = [...categories.value, { id, label }]
  addingCard.value = false
  await $fetch(`/api/${props.dealId}/doc-categories`, { method: 'PUT', body: updated })
  await refreshCats()
}

// ── Doc formatting ──
function typeClass(type: string) {
  const map: Record<string, string> = { PDF: 'type-pdf', XLS: 'type-xls', DOC: 'type-doc', IMG: 'type-img' }
  return map[type] ?? 'type-other'
}
function statusClass(status: string) {
  const map: Record<string, string> = { New: 'status-new', Reviewed: 'status-reviewed', Pending: 'status-pending' }
  return map[status] ?? ''
}
function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatSize(kb: number) {
  if (!kb) return ''
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
}

const INLINE_TYPES    = new Set(['pdf', 'jpg', 'jpeg', 'png'])
const MS_OFFICE_TYPES = new Set(['xls', 'xlsx', 'doc', 'docx'])

function fileUrl(doc: any) {
  return `/api/${props.dealId}/documents/${encodeURIComponent(doc.filename)}`
}
function dlUrl(doc: any) {
  return `${fileUrl(doc)}?download=1`
}
function previewDoc(doc: any) {
  const ext = doc.filename.split('.').pop()?.toLowerCase() ?? ''
  if (INLINE_TYPES.has(ext)) {
    window.open(fileUrl(doc), '_blank')
  } else if (MS_OFFICE_TYPES.has(ext)) {
    const publicUrl = `${window.location.origin}${fileUrl(doc)}`
    window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(publicUrl)}`, '_blank')
  } else {
    const a = document.createElement('a')
    a.href = dlUrl(doc)
    a.download = doc.filename
    a.click()
  }
}

// ── Doc rename ──
const renamingFile = ref<string | null>(null)
const editName = ref('')
const renameInput = ref<HTMLInputElement>()

function startRename(doc: any) {
  renamingFile.value = doc.filename
  editName.value = doc.name
  nextTick(() => renameInput.value?.focus())
}
function cancelRename() {
  renamingFile.value = null
  editName.value = ''
}
async function saveRename(doc: any) {
  if (!renamingFile.value) return
  const name = editName.value.trim()
  renamingFile.value = null
  editName.value = ''
  if (!name || name === doc.name) return
  await $fetch(`/api/${props.dealId}/documents/${encodeURIComponent(doc.filename)}`, {
    method: 'PUT',
    body: { name },
  })
  await refresh()
}

// ── Upload stub (M08) ──
const fileInput = ref<HTMLInputElement>()
let uploadCategory = ''
function triggerUpload(category: string) {
  uploadCategory = category
  fileInput.value?.click()
}
function onFileChosen() {
  alert(`Upload to ${uploadCategory} — coming in M08`)
}
</script>

<style scoped>
.documents { padding: 24px 28px; display: flex; flex-direction: column; gap: 16px; }
.docs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

.doc-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 20px;
  box-shadow: var(--shadow); display: flex; flex-direction: column;
}
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.card-header-actions { display: flex; align-items: center; gap: 6px; }
.card-title  { font-size: 12px; font-weight: 600; color: var(--text); letter-spacing: 0.01em; }
.doc-count   { font-size: 11px; color: var(--faint); }

.card-action-btn {
  width: 22px; height: 22px; border-radius: var(--radius-sm);
  border: 1px solid transparent; background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: var(--muted); transition: all 0.15s; padding: 0;
}
.card-action-btn:hover { background: var(--surface2); color: var(--text); border-color: var(--border2); }

.card-rename-input {
  flex: 1; font-size: 12px; font-weight: 600; color: var(--text);
  background: var(--surface2); border: 1px solid var(--blue);
  border-radius: var(--radius-sm); padding: 2px 6px; outline: none;
  font-family: 'DM Sans', sans-serif;
}

/* Add card */
.add-card {
  border: 1px dashed var(--border2); background: transparent; box-shadow: none;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; cursor: pointer; min-height: 120px; transition: all 0.15s;
}
.add-card:hover { background: var(--surface2); border-color: var(--text); }
.add-card-icon { font-size: 24px; color: var(--muted); line-height: 1; }
.add-card-label { font-size: 12px; color: var(--muted); }
.add-card-form { width: 100%; display: flex; flex-direction: column; gap: 10px; }
.add-card-actions { display: flex; gap: 8px; }
.add-card-confirm {
  flex: 1; padding: 6px; border-radius: var(--radius-sm);
  background: var(--blue); color: #fff; border: none; font-size: 12px;
  font-family: 'DM Sans', sans-serif; cursor: pointer; transition: opacity 0.15s;
}
.add-card-confirm:hover { opacity: 0.85; }
.add-card-cancel {
  flex: 1; padding: 6px; border-radius: var(--radius-sm);
  background: transparent; color: var(--muted); border: 1px solid var(--border2);
  font-size: 12px; font-family: 'DM Sans', sans-serif; cursor: pointer;
}
.add-card-cancel:hover { background: var(--surface2); }

.doc-empty { font-size: 12px; color: var(--faint); padding: 20px 0; text-align: center; }
.doc-list  { display: flex; flex-direction: column; flex: 1; }
.doc-row   { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--border); }
.doc-row:last-child { border-bottom: none; }

.doc-type {
  flex-shrink: 0; width: 36px; height: 36px; border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 700; letter-spacing: 0.04em;
}
.type-pdf   { background: #FDECEC; color: #A32D2D; }
.type-xls   { background: #E1F5EE; color: #0F6E56; }
.type-doc   { background: #E6F1FB; color: #185FA5; }
.type-img   { background: #F5F0FD; color: #6B3FA0; }
.type-other { background: var(--surface2); color: var(--muted); }

.doc-body { flex: 1; min-width: 0; cursor: pointer; }
.doc-body:hover .doc-name { color: var(--blue); }
.doc-name { font-size: 13px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color 0.15s; }
.doc-meta { font-size: 11px; color: var(--faint); margin-top: 2px; }

.doc-status { flex-shrink: 0; font-size: 10.5px; font-weight: 600; padding: 2px 8px; border-radius: 20px; }
.status-new      { background: var(--blue-bg);  color: var(--blue); }
.status-reviewed { background: var(--green-bg); color: var(--green-txt); }
.status-pending  { background: var(--amber-bg); color: var(--amber); }

.rename-btn {
  flex-shrink: 0; width: 28px; height: 28px; border-radius: var(--radius-sm);
  border: 1px solid transparent; background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: var(--muted); transition: all 0.15s; padding: 0;
}
.rename-btn:hover { background: var(--surface2); color: var(--text); border-color: var(--border2); }

.rename-input {
  width: 100%; font-size: 13px; font-weight: 500; color: var(--text);
  background: var(--surface2); border: 1px solid var(--blue);
  border-radius: var(--radius-sm); padding: 2px 6px; outline: none;
  font-family: 'DM Sans', sans-serif;
}

.dl-btn {
  flex-shrink: 0; width: 28px; height: 28px; border-radius: var(--radius-sm);
  border: 1px solid var(--border2); background: transparent;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: var(--muted); text-decoration: none; transition: all 0.15s;
}
.dl-btn:hover { background: var(--surface2); color: var(--text); border-color: var(--text); }

.upload-btn {
  margin-top: 14px; width: 100%; padding: 8px;
  border: 1px dashed var(--border2); border-radius: var(--radius-sm);
  background: transparent; font-family: 'DM Sans', sans-serif;
  font-size: 12px; color: var(--muted); cursor: pointer; transition: all 0.15s;
}
.upload-btn:hover { background: var(--surface2); color: var(--text); border-color: var(--text); }

.doc-summary {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 14px 24px;
  box-shadow: var(--shadow); display: flex; align-items: center;
}
.summary-item { display: flex; flex-direction: column; align-items: center; gap: 2px; flex: 1; }
.summary-num  { font-size: 20px; font-weight: 600; color: var(--text); line-height: 1; }
.summary-num.s-new      { color: var(--blue); }
.summary-num.s-reviewed { color: var(--green-txt); }
.summary-num.s-pending  { color: var(--amber); }
.summary-lbl  { font-size: 10px; color: var(--faint); text-transform: uppercase; letter-spacing: 0.06em; }
.summary-divider { width: 1px; height: 32px; background: var(--border); flex-shrink: 0; }
</style>
