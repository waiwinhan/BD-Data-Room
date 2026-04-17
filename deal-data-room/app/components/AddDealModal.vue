<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
        <div class="modal">

          <!-- Header -->
          <div class="modal-header">
            <div>
              <div class="modal-title">New Deal</div>
              <div class="modal-sub">Fill in the basics — you can edit everything later</div>
            </div>
            <button class="modal-close" @click="$emit('close')">✕</button>
          </div>

          <!-- Form -->
          <div class="modal-body">
            <form @submit.prevent="submit">

              <!-- Deal Name -->
              <div class="field field-full">
                <label class="field-label">Deal Name <span class="req">*</span></label>
                <input v-model="form.name" class="field-input" placeholder="e.g. Bukit Jalil Mixed Dev JV" required />
              </div>

              <!-- Location + State prefix (for ID) -->
              <div class="field-row">
                <div class="field" style="flex:3">
                  <label class="field-label">Location <span class="req">*</span></label>
                  <input v-model="form.location" class="field-input" placeholder="e.g. Bukit Jalil, Kuala Lumpur" required />
                </div>
                <div class="field" style="flex:1">
                  <label class="field-label">State Code <span class="req">*</span></label>
                  <select v-model="form.prefix" class="field-select">
                    <option value="KL">KL</option>
                    <option value="JB">JB</option>
                    <option value="SL">SL</option>
                    <option value="PG">PG</option>
                    <option value="NS">NS</option>
                    <option value="JH">JH</option>
                    <option value="MY">MY</option>
                  </select>
                </div>
              </div>

              <!-- Stage + Tenure -->
              <div class="field-row">
                <div class="field">
                  <label class="field-label">Stage</label>
                  <select v-model="form.stage" class="field-select">
                    <option>Active DD</option>
                    <option>KIV</option>
                    <option>Approved</option>
                    <option>Rejected</option>
                  </select>
                </div>
                <div class="field">
                  <label class="field-label">Tenure</label>
                  <select v-model="form.tenure" class="field-select">
                    <option>Freehold</option>
                    <option>Leasehold 99yr</option>
                    <option>Leasehold 60yr</option>
                  </select>
                </div>
              </div>

              <!-- Financial KPIs -->
              <div class="section-divider">Indicative Financials <span class="section-note">(RM Million — update later with .xlsx model)</span></div>

              <div class="field-row">
                <div class="field">
                  <label class="field-label">GDV (RM M)</label>
                  <input v-model="form.gdv" type="number" min="0" step="0.1" class="field-input" placeholder="0" />
                </div>
                <div class="field">
                  <label class="field-label">Land Cost (RM M)</label>
                  <input v-model="form.landCost" type="number" min="0" step="0.1" class="field-input" placeholder="0" />
                </div>
                <div class="field">
                  <label class="field-label">Land Area (acres)</label>
                  <input v-model="form.landAcres" type="number" min="0" step="0.01" class="field-input" placeholder="0" />
                </div>
                <div class="field">
                  <label class="field-label">Hurdle IRR (%)</label>
                  <input v-model="form.hurdleRate" type="number" min="0" max="100" step="0.5" class="field-input" placeholder="15" />
                </div>
              </div>

              <!-- Restricted + Stage Note -->
              <div class="field-row">
                <div class="field" style="flex:3">
                  <label class="field-label">Stage Note</label>
                  <input v-model="form.stageNote" class="field-input" placeholder="e.g. Title search in progress" />
                </div>
                <div class="field field-toggle" style="flex:1">
                  <label class="field-label">Confidential</label>
                  <label class="toggle">
                    <input v-model="form.restricted" type="checkbox" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <!-- Error -->
              <div v-if="error" class="form-error">{{ error }}</div>

              <!-- Actions -->
              <div class="modal-actions">
                <button type="button" class="btn-cancel" @click="$emit('close')">Cancel</button>
                <button type="submit" class="btn-submit" :disabled="saving">
                  <span v-if="saving" class="spinner"></span>
                  <span v-else>Create Deal →</span>
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ show: boolean }>()
const emit  = defineEmits<{ close: [], created: [dealId: string] }>()

const saving = ref(false)
const error  = ref('')

const defaultHurdleRate = ref(15)

const form = reactive({
  name:       '',
  location:   '',
  prefix:     'KL',
  stage:      'Active DD',
  tenure:     'Freehold',
  gdv:        '' as string | number,
  landCost:   '' as string | number,
  landAcres:  '' as string | number,
  hurdleRate: defaultHurdleRate.value,
  stageNote:  '',
  restricted: false,
})

function reset() {
  form.name = ''; form.location = ''; form.prefix = 'KL'
  form.stage = 'Active DD'; form.tenure = 'Freehold'
  form.gdv = ''; form.landCost = ''; form.landAcres = ''
  form.hurdleRate = defaultHurdleRate.value; form.stageNote = ''; form.restricted = false
  error.value = ''
}

watch(() => props.show, async (v) => {
  if (!v) { reset(); return }
  // Pull default hurdle rate from settings
  try {
    const s = await $fetch('/api/settings') as any
    defaultHurdleRate.value = s.defaultHurdleRate ?? 15
    form.hurdleRate = defaultHurdleRate.value
  } catch {}
})

// Close on Escape
onMounted(() => {
  const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && props.show) emit('close') }
  window.addEventListener('keydown', handler)
  onUnmounted(() => window.removeEventListener('keydown', handler))
})

async function submit() {
  if (!form.name.trim() || !form.location.trim()) {
    error.value = 'Deal name and location are required.'
    return
  }
  saving.value = true
  error.value  = ''
  try {
    const res = await $fetch('/api/deals', { method: 'POST', body: { ...form } }) as any
    emit('created', res.dealId)
    emit('close')
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to create deal. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* Backdrop */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(26,25,22,0.55);
  backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}

/* Modal box */
.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.18);
  width: 100%; max-width: 640px;
  max-height: 90vh; overflow-y: auto;
}

/* Header */
.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
}
.modal-title { font-size: 16px; font-weight: 600; color: var(--text); letter-spacing: -0.3px; }
.modal-sub   { font-size: 12px; color: var(--muted); margin-top: 3px; }
.modal-close {
  width: 28px; height: 28px; border-radius: 6px;
  border: 1px solid var(--border2); background: transparent;
  font-size: 12px; color: var(--muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; flex-shrink: 0;
}
.modal-close:hover { background: var(--surface2); color: var(--text); }

/* Body */
.modal-body { padding: 20px 24px 24px; }

/* Fields */
.field-full   { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
.field-row    { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.field        { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 0; }
.field-label  { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
.req          { color: var(--amber); }
.field-input, .field-select {
  height: 34px; padding: 0 10px;
  border: 1.5px solid var(--border2); border-radius: var(--radius-sm);
  background: var(--surface2); font-family: 'DM Sans', sans-serif;
  font-size: 13px; color: var(--text); outline: none;
  transition: border-color 0.15s; width: 100%;
}
.field-input:focus, .field-select:focus { border-color: var(--text); }
.field-select { cursor: pointer; }

/* Section divider */
.section-divider {
  font-size: 11px; font-weight: 600; color: var(--muted);
  text-transform: uppercase; letter-spacing: 0.06em;
  border-top: 1px solid var(--border); padding-top: 14px;
  margin-bottom: 14px; margin-top: 4px;
}
.section-note { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--faint); }

/* Toggle */
.field-toggle { justify-content: flex-start; }
.toggle { display: flex; align-items: center; margin-top: 4px; cursor: pointer; }
.toggle input { display: none; }
.toggle-slider {
  width: 38px; height: 22px; border-radius: 11px;
  background: var(--border2); position: relative; transition: background 0.2s;
}
.toggle-slider::after {
  content: ''; position: absolute;
  width: 16px; height: 16px; border-radius: 50%;
  background: #fff; top: 3px; left: 3px;
  transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.toggle input:checked ~ .toggle-slider { background: var(--text); }
.toggle input:checked ~ .toggle-slider::after { transform: translateX(16px); }

/* Error */
.form-error {
  font-size: 12px; color: var(--red); background: var(--red-bg);
  border: 1px solid rgba(163,45,45,0.2); border-radius: var(--radius-sm);
  padding: 8px 12px; margin-bottom: 14px;
}

/* Actions */
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 8px; }
.btn-cancel {
  height: 34px; padding: 0 16px;
  border: 1px solid var(--border2); border-radius: var(--radius-sm);
  background: transparent; font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 500; color: var(--muted);
  cursor: pointer; transition: all 0.15s;
}
.btn-cancel:hover { background: var(--surface2); color: var(--text); }
.btn-submit {
  height: 34px; padding: 0 18px;
  border: none; border-radius: var(--radius-sm);
  background: var(--text); color: #fff;
  font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s;
  display: inline-flex; align-items: center; gap: 6px;
}
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

/* Spinner */
.spinner {
  width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Transition */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s, transform 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.97) translateY(8px); }
.modal-enter-to, .modal-leave-from { opacity: 1; transform: scale(1) translateY(0); }
</style>
