<template>
  <div class="documents">

    <!-- ── CONFIRMATION DIALOG ── -->
    <Teleport to="body">
      <div v-if="confirmDialog" class="confirm-overlay" @click.self="confirmDialog = null">
        <div class="confirm-box">
          <div class="confirm-icon">🗑</div>
          <div class="confirm-msg">{{ confirmDialog.message }}</div>
          <div class="confirm-actions">
            <button class="confirm-cancel" @click="confirmDialog = null">Cancel</button>
            <button class="confirm-delete" @click="runConfirm">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>

    <div class="docs-grid">

      <!-- ── DYNAMIC CATEGORY CARDS ── -->
      <div v-for="cat in categories" :key="cat.id" class="doc-card">
        <div class="card-header">
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
            <button class="card-action-btn card-delete-btn" title="Delete category" @click="askDeleteCategory(cat)">🗑</button>
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
            <button
              class="doc-status"
              :class="[statusClass(doc.status), cyclingStatus === doc.filename ? 'status-cycling' : '']"
              title="Click to cycle status"
              @click.stop="cycleStatus(doc)"
            >{{ doc.status }}</button>
            <button class="icon-btn" title="Rename file" @click.stop="startRename(doc)">✎</button>
            <a :href="dlUrl(doc)" download class="icon-btn dl-btn" title="Download">↓</a>
            <button class="icon-btn delete-btn" title="Delete file" @click.stop="askDeleteDoc(doc)">🗑</button>
          </div>
        </div>

        <button class="upload-btn" :disabled="uploadingFor === cat.id" @click="triggerUpload(cat.id)">
          <span v-if="uploadingFor === cat.id" class="upload-spinner"></span>
          <span v-else>+ Add document</span>
        </button>
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

    <input ref="fileInput" type="file" accept=".pdf,.xlsx,.xls,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png" style="display:none" @change="onFileChosen" />

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

    <!-- ── TRASH BIN ── -->
    <div class="trash-section">
      <button class="trash-toggle" @click="trashOpen = !trashOpen">
        <span>🗑 Trash</span>
        <span v-if="trashDocCount + trashCatCount > 0" class="trash-count">{{ trashDocCount + trashCatCount }}</span>
        <span class="trash-chevron">{{ trashOpen ? '▲' : '▼' }}</span>
      </button>
      <div v-if="trashOpen" class="trash-body">

        <div v-if="trashDocCount === 0 && trashCatCount === 0" class="trash-empty">
          Trash is empty
        </div>

        <!-- Trashed categories -->
        <template v-if="trashCatCount > 0">
          <div class="trash-group-label">Categories</div>
          <div v-for="cat in trashedCategories" :key="cat.id" class="trash-row">
            <span class="trash-icon">📁</span>
            <span class="trash-name">{{ cat.label }}</span>
            <button class="restore-btn" @click="restoreCategory(cat)">↩ Restore</button>
          </div>
        </template>

        <!-- Trashed docs -->
        <template v-if="trashDocCount > 0">
          <div class="trash-group-label">Files</div>
          <div v-for="doc in trashedDocs" :key="doc.filename" class="trash-row">
            <span class="trash-badge" :class="typeClass(doc.type)">{{ doc.type }}</span>
            <span class="trash-name">{{ doc.name }}</span>
            <span class="trash-cat">{{ categoryLabel(doc.category) }}</span>
            <span class="trash-date">{{ formatDate(doc.deletedAt) }}</span>
            <button class="restore-btn" @click="restoreDoc(doc)">↩ Restore</button>
            <button class="perm-delete-btn" @click="askPermDelete(doc)">Delete forever</button>
          </div>
        </template>

      </div>
    </div>

    <!-- ── PERMANENT DELETE DIALOG ── -->
    <Teleport to="body">
      <div v-if="permDeleteTarget" class="confirm-overlay" @click.self="permDeleteTarget = null">
        <div class="confirm-box perm-box">
          <div class="perm-icon">⚠</div>
          <div class="perm-title">Delete forever?</div>
          <div class="perm-msg">
            <strong>{{ permDeleteTarget.name }}</strong> will be permanently removed and cannot be recovered.
          </div>
          <div class="confirm-actions">
            <button class="confirm-cancel" @click="permDeleteTarget = null">Cancel</button>
            <button class="perm-confirm-btn" @click="runPermDelete">Delete forever</button>
          </div>
        </div>
      </div>
    </Teleport>

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

function categoryLabel(id: string) {
  return categories.value.find((c: any) => c.id === id)?.label ?? id
}

// ── Trash ──
const { data: trashData, refresh: refreshTrash } = await useFetch(() => `/api/${props.dealId}/trash`)
const trashedDocs       = computed(() => (trashData.value as any)?.docs       ?? [])
const trashedCategories = computed(() => (trashData.value as any)?.categories ?? [])
const trashDocCount     = computed(() => trashedDocs.value.length)
const trashCatCount     = computed(() => trashedCategories.value.length)
const trashOpen         = ref(false)

// ── Confirmation dialog ──
const confirmDialog = ref<{ message: string; action: () => Promise<void> } | null>(null)

function showConfirm(message: string, action: () => Promise<void>) {
  confirmDialog.value = { message, action }
}
async function runConfirm() {
  if (!confirmDialog.value) return
  const action = confirmDialog.value.action
  confirmDialog.value = null
  await action()
}

// ── Delete document ──
function askDeleteDoc(doc: any) {
  showConfirm(
    `Move "${doc.name}" to trash?`,
    async () => {
      await $fetch(`/api/${props.dealId}/documents/${encodeURIComponent(doc.filename)}`, { method: 'DELETE' })
      await Promise.all([refresh(), refreshTrash()])
      trashOpen.value = true
    }
  )
}

// ── Restore document ──
async function restoreDoc(doc: any) {
  await $fetch(`/api/${props.dealId}/trash/${encodeURIComponent(doc.filename)}`, { method: 'PUT' })
  await Promise.all([refresh(), refreshTrash()])
}

// ── Permanent delete ──
const permDeleteTarget = ref<any | null>(null)

function askPermDelete(doc: any) {
  permDeleteTarget.value = doc
}

async function runPermDelete() {
  if (!permDeleteTarget.value) return
  const doc = permDeleteTarget.value
  permDeleteTarget.value = null
  await $fetch(`/api/${props.dealId}/trash/${encodeURIComponent(doc.filename)}`, { method: 'DELETE' })
  await refreshTrash()
}

// ── Delete category ──
function askDeleteCategory(cat: any) {
  const docCount = (docsByCategory.value[cat.id] ?? []).length
  const extra = docCount > 0 ? ` (${docCount} file${docCount > 1 ? 's' : ''} will be hidden)` : ''
  showConfirm(
    `Move category "${cat.label}" to trash?${extra}`,
    async () => {
      // Remove from active list
      const updatedActive = categories.value.filter((c: any) => c.id !== cat.id)
      await $fetch(`/api/${props.dealId}/doc-categories`, { method: 'PUT', body: updatedActive })
      // Add to trash list
      const updatedTrash = [...trashedCategories.value, cat]
      await $fetch(`/api/${props.dealId}/doc-categories-trash`, { method: 'PUT', body: updatedTrash })
      await Promise.all([refreshCats(), refreshTrash()])
      trashOpen.value = true
    }
  )
}

// ── Restore category ──
async function restoreCategory(cat: any) {
  // Add back to active
  const updatedActive = [...categories.value, cat]
  await $fetch(`/api/${props.dealId}/doc-categories`, { method: 'PUT', body: updatedActive })
  // Remove from trash
  const updatedTrash = trashedCategories.value.filter((c: any) => c.id !== cat.id)
  await $fetch(`/api/${props.dealId}/doc-categories-trash`, { method: 'PUT', body: updatedTrash })
  await Promise.all([refreshCats(), refreshTrash()])
}

// ── Card rename ──
const renamingCard  = ref<string | null>(null)
const editCardLabel = ref('')

function startCardRename(cat: any) {
  renamingCard.value  = cat.id
  editCardLabel.value = cat.label
}
function cancelCardRename() { renamingCard.value = null }
async function saveCardRename(cat: any) {
  if (!renamingCard.value) return
  const label = editCardLabel.value.trim()
  renamingCard.value = null
  if (!label || label === cat.label) return
  const updated = categories.value.map((c: any) => c.id === cat.id ? { ...c, label } : c)
  await $fetch(`/api/${props.dealId}/doc-categories`, { method: 'PUT', body: updated })
  await refreshCats()
}

// ── Add card ──
const addingCard   = ref(false)
const newCardLabel = ref('')
const newCardInput = ref<HTMLInputElement>()

function startAddCard() {
  addingCard.value   = true
  newCardLabel.value = ''
  nextTick(() => newCardInput.value?.focus())
}
function cancelAddCard() { addingCard.value = false }
async function confirmAddCard() {
  const label = newCardLabel.value.trim()
  if (!label) return
  const id      = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const updated = [...categories.value, { id, label }]
  addingCard.value = false
  await $fetch(`/api/${props.dealId}/doc-categories`, { method: 'PUT', body: updated })
  await refreshCats()
}

// ── Doc rename ──
const renamingFile = ref<string | null>(null)
const editName     = ref('')
const renameInput  = ref<HTMLInputElement>()

function startRename(doc: any) {
  renamingFile.value = doc.filename
  editName.value     = doc.name
  nextTick(() => renameInput.value?.focus())
}
function cancelRename() { renamingFile.value = null; editName.value = '' }
async function saveRename(doc: any) {
  if (!renamingFile.value) return
  const name = editName.value.trim()
  renamingFile.value = null
  editName.value     = ''
  if (!name || name === doc.name) return
  await $fetch(`/api/${props.dealId}/documents/${encodeURIComponent(doc.filename)}`, {
    method: 'PUT', body: { name },
  })
  await refresh()
}

// ── Formatting ──
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

// ── Preview / download ──
const INLINE_TYPES    = new Set(['pdf', 'jpg', 'jpeg', 'png'])
const MS_OFFICE_TYPES = new Set(['xls', 'xlsx', 'doc', 'docx'])

function fileUrl(doc: any) { return `/api/${props.dealId}/documents/${encodeURIComponent(doc.filename)}` }
function dlUrl(doc: any)   { return `${fileUrl(doc)}?download=1` }

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

// ── Upload (M08) ──
const fileInput    = ref<HTMLInputElement>()
const uploadingFor = ref<string | null>(null)
let uploadCategory = ''

function triggerUpload(category: string) {
  uploadCategory = category
  fileInput.value?.click()
}

async function onFileChosen(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const ALLOWED = /\.(pdf|xlsx|xls|doc|docx|ppt|pptx|jpg|jpeg|png)$/i
  if (!ALLOWED.test(file.name)) {
    alert(`File type not allowed. Please upload PDF, Excel, Word, PowerPoint, or image files.`)
    ;(event.target as HTMLInputElement).value = ''
    return
  }

  uploadingFor.value = uploadCategory
  const form = new FormData()
  form.append('file', file)
  form.append('category', uploadCategory)

  try {
    await $fetch(`/api/${props.dealId}/upload`, { method: 'POST', body: form })
    await refresh()
  } catch (err: any) {
    alert(`Upload failed: ${err?.data?.message ?? err.message ?? 'Unknown error'}`)
  } finally {
    uploadingFor.value = null
    ;(event.target as HTMLInputElement).value = ''
  }
}

// ── Status cycle ──
const cyclingStatus = ref<string | null>(null)

async function cycleStatus(doc: any) {
  if (cyclingStatus.value === doc.filename) return
  cyclingStatus.value = doc.filename
  try {
    await $fetch(`/api/${props.dealId}/documents/${encodeURIComponent(doc.filename)}`, { method: 'PATCH' })
    await refresh()
  } finally {
    cyclingStatus.value = null
  }
}
</script>

<style scoped>
.documents { padding: 24px 28px; display: flex; flex-direction: column; gap: 16px; }
.docs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

/* ── Confirmation dialog ── */
.confirm-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.confirm-box {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 28px 32px; max-width: 360px; width: 90%;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18); text-align: center;
}
.confirm-icon { font-size: 32px; margin-bottom: 12px; }
.confirm-msg  { font-size: 14px; color: var(--text); line-height: 1.5; margin-bottom: 20px; }
.confirm-actions { display: flex; gap: 10px; justify-content: center; }
.confirm-cancel {
  padding: 8px 20px; border-radius: var(--radius-sm);
  border: 1px solid var(--border2); background: transparent;
  font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--muted); cursor: pointer;
}
.confirm-cancel:hover { background: var(--surface2); color: var(--text); }
.confirm-delete {
  padding: 8px 20px; border-radius: var(--radius-sm);
  border: none; background: #DC2626; color: #fff;
  font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: opacity 0.15s;
}
.confirm-delete:hover { opacity: 0.85; }

/* ── Cards ── */
.doc-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 20px;
  box-shadow: var(--shadow); display: flex; flex-direction: column;
}
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.card-header-actions { display: flex; align-items: center; gap: 4px; }
.card-title  { font-size: 12px; font-weight: 600; color: var(--text); letter-spacing: 0.01em; }
.doc-count   { font-size: 11px; color: var(--faint); margin-right: 4px; }

.card-action-btn {
  width: 22px; height: 22px; border-radius: var(--radius-sm);
  border: 1px solid transparent; background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: var(--muted); transition: all 0.15s; padding: 0;
}
.card-action-btn:hover { background: var(--surface2); color: var(--text); border-color: var(--border2); }
.card-delete-btn:hover { background: #FEE2E2; color: #DC2626; border-color: #FECACA; }

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
.add-card-icon  { font-size: 24px; color: var(--muted); line-height: 1; }
.add-card-label { font-size: 12px; color: var(--muted); }
.add-card-form  { width: 100%; display: flex; flex-direction: column; gap: 10px; }
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

/* ── Doc rows ── */
.doc-empty { font-size: 12px; color: var(--faint); padding: 20px 0; text-align: center; }
.doc-list  { display: flex; flex-direction: column; flex: 1; }
.doc-row   { display: flex; align-items: center; gap: 8px; padding: 9px 0; border-bottom: 1px solid var(--border); }
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

.icon-btn {
  flex-shrink: 0; width: 26px; height: 26px; border-radius: var(--radius-sm);
  border: 1px solid transparent; background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: var(--muted); text-decoration: none; transition: all 0.15s; padding: 0;
}
.icon-btn:hover   { background: var(--surface2); color: var(--text); border-color: var(--border2); }
.dl-btn           { border-color: var(--border2); }
.delete-btn:hover { background: #FEE2E2; color: #DC2626; border-color: #FECACA; }

.rename-input {
  width: 100%; font-size: 13px; font-weight: 500; color: var(--text);
  background: var(--surface2); border: 1px solid var(--blue);
  border-radius: var(--radius-sm); padding: 2px 6px; outline: none;
  font-family: 'DM Sans', sans-serif;
}

.upload-btn {
  margin-top: 14px; width: 100%; padding: 8px;
  border: 1px dashed var(--border2); border-radius: var(--radius-sm);
  background: transparent; font-family: 'DM Sans', sans-serif;
  font-size: 12px; color: var(--muted); cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.upload-btn:hover:not(:disabled) { background: var(--surface2); color: var(--text); border-color: var(--text); }
.upload-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.upload-spinner {
  width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid var(--border2); border-top-color: var(--blue);
  animation: spin 0.6s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.doc-status { cursor: pointer; transition: opacity 0.15s; }
.doc-status:hover { opacity: 0.75; }
.status-cycling { opacity: 0.5; pointer-events: none; }

/* ── Summary strip ── */
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

/* ── Trash bin ── */
.trash-section {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden;
}
.trash-toggle {
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 12px 20px; background: transparent; border: none;
  font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--muted);
  cursor: pointer; text-align: left; transition: background 0.15s;
}
.trash-toggle:hover { background: var(--surface2); }
.trash-count {
  background: var(--surface2); border-radius: 20px;
  padding: 1px 8px; font-size: 11px; font-weight: 600; color: var(--text);
}
.trash-chevron { margin-left: auto; font-size: 10px; }

.trash-body { padding: 0 20px 16px; }
.trash-group-label {
  font-size: 10px; font-weight: 600; color: var(--faint);
  text-transform: uppercase; letter-spacing: 0.06em;
  padding: 12px 0 6px;
}
.trash-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 0; border-bottom: 1px solid var(--border);
}
.trash-row:last-child { border-bottom: none; }
.trash-icon  { font-size: 16px; flex-shrink: 0; }
.trash-badge {
  flex-shrink: 0; width: 32px; height: 32px; border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 8px; font-weight: 700; letter-spacing: 0.04em;
}
.trash-name { flex: 1; font-size: 13px; color: var(--muted); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.trash-cat  { font-size: 11px; color: var(--faint); flex-shrink: 0; }
.trash-date { font-size: 11px; color: var(--faint); flex-shrink: 0; }
.trash-empty {
  font-size: 12px; color: var(--faint); padding: 16px 0; text-align: center;
}
.restore-btn {
  flex-shrink: 0; padding: 4px 12px; border-radius: var(--radius-sm);
  border: 1px solid var(--border2); background: transparent;
  font-family: 'DM Sans', sans-serif; font-size: 11px; color: var(--text);
  cursor: pointer; transition: all 0.15s;
}
.restore-btn:hover { background: var(--surface2); border-color: var(--text); }

.perm-delete-btn {
  flex-shrink: 0; padding: 4px 12px; border-radius: var(--radius-sm);
  border: 1px solid #FECACA; background: transparent;
  font-family: 'DM Sans', sans-serif; font-size: 11px; color: #DC2626;
  cursor: pointer; transition: all 0.15s;
}
.perm-delete-btn:hover { background: #FEE2E2; border-color: #DC2626; }

/* Permanent delete dialog */
.perm-box { border-top: 3px solid #DC2626; }
.perm-icon { font-size: 28px; margin-bottom: 8px; }
.perm-title {
  font-size: 15px; font-weight: 600; color: #DC2626; margin-bottom: 10px;
}
.perm-msg {
  font-size: 13px; color: var(--muted); line-height: 1.5; margin-bottom: 20px;
}
.perm-confirm-btn {
  padding: 8px 20px; border-radius: var(--radius-sm);
  border: none; background: #DC2626; color: #fff;
  font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s;
}
.perm-confirm-btn:hover { opacity: 0.85; }
</style>
