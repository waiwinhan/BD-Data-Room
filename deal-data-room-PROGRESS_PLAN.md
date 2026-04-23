# Deal Data Room — Progress Plan
*BRDB Property Development · Wai Win Han · April 2026*

> **How to use this file**
> Update status symbols as you work: ⏳ Not started → 🔄 In progress → ✅ Done → 🚫 Blocked → 📋 Backlog
> Tick checklist items as each sub-task is completed.

---

## Overall Progress

| Module | Name | Phase | Status | Target |
|--------|------|-------|--------|--------|
| M01 | Project Scaffold | 1 | ✅ | Day 1 |
| M02 | Deal List Page + DealCard | 1 | ✅ | Day 1 |
| M03 | Dashboard Shell + Tab Layout | 1 | ✅ | Day 1 |
| M04 | Overview Tab | 1 | ✅ | Day 1–2 |
| M05 | Excel Parser (ExcelJS) | 2 | ✅ | Day 2–3 |
| M06 | Financials Tab | 2 | ✅ | Day 3 |
| M07 | Documents Tab | 3 | ✅ | Day 4 |
| M08 | Document Upload | 3 | ✅ | Day 4 |
| M09 | Risk & Legal Tab | 3 | ✅ | Day 4–5 |
| M10 | Deal Team Tab | 3 | ✅ | Day 5 |
| M11 | Auth — NDA Password Gate | 4 | ✅ | Day 5–6 |
| M12 | Multi-Deal Routing | 4 | ✅ | Day 6 |
| M13 | Deployment (Netlify) | 4 | ✅ | Apr 21 |
| M18 | Supabase DB + Storage Migration | 5 | ✅ | Apr 18 |
| M14 | Excel — BRDB Model Wiring | 2 | ✅ | Day 3 |
| M15 | Sensitivity Table | 2 | ✅ | Day 3 |
| M16 | Feasibility Model Upload (in-UI) | 3 | ✅ | Apr 17 |
| M17 | Add New Deal (modal + API) | 4 | ✅ | Apr 17 |
| M19 | Settings Modal (branding, security, defaults) | 4 | ✅ | Apr 18 |
| M20 | Trash & Permanent Delete | 4 | ✅ | Apr 19 |
| PL-01 | Supabase Auth (per-user) | Post | 📋 | Post-launch |
| PL-02 | Document Comment Threads | Post | 📋 | Post-launch |
| PL-03 | Email Notifications | Post | 📋 | Post-launch |
| PL-04 | Risk Register UI Editor | Post | 📋 | Post-launch |
| PL-05 | Deal Comparison View | Post | 📋 | Post-launch |
| PL-06 | Auto-refresh on Excel Change | Post | 📋 | Post-launch |
| PL-07 | Print / PDF Export | Post | 📋 | Post-launch |
| PL-08 | Persistent Audit Log | Post | ✅ | Apr 21 |
| M21 | Multi-Password + Login Access Log | 4 | ✅ | Apr 21 |
| M22 | Logo Editor (drag + resize) | 4 | ✅ | Apr 21 |
| M23 | Editable Deal Team + Activity Log | 4 | ✅ | Apr 21 |
| M24 | Excel Parser Multi-Template + KPI Auto-Sync | 5 | ✅ | Apr 21 |
| M25 | Documents Trash Permanent Delete + Rename Fix | 3 | ✅ | Apr 21 |
| M26 | Welcome Popup (admin-configurable GIF + message) | 4 | ✅ | Apr 21 |
| M27 | Manual SWOT & Recommendation Editing | 4 | ✅ | Apr 23 |
| M28 | Supabase RLS + Service Role Key | 5 | ✅ | Apr 23 |

**Prototype files (visual spec — open in browser before coding each module)**
- `deal-data-room-list.html` → M02 DealCard, FilterBar, PortfolioSummary
- `deal-data-room-prototype.html` → M03–M10 (all 5 dashboard tabs)

---

## Phase 1 — Working Prototype (Days 1–2)

Goal: Dashboard running locally with hardcoded/JSON data for one deal. No auth, no file uploads yet.

---

### M01 — Project Scaffold ✅

**Milestone:** Nuxt dev server running at localhost:3000 with Tailwind CSS active.

- [ ] Run `npx nuxi@latest init deal-data-room`
- [ ] `cd deal-data-room && npm install @nuxtjs/tailwindcss vue-chartjs chart.js exceljs nuxt-auth-utils`
- [ ] Add `@nuxtjs/tailwindcss` and `nuxt-auth-utils` to `nuxt.config.ts` modules array
- [ ] Create `tailwind.config.js` (or confirm auto-generated)
- [ ] Verify Tailwind works — add a test class to `app.vue`, confirm styling applies
- [ ] Create folder structure:
  - [ ] `mkdir -p data/jb-2026-04/docs`
  - [ ] `touch data/deals.json` (populate with one deal object)
  - [ ] `touch data/jb-2026-04/meta.json` (populate with Permas Jaya data)
  - [ ] `touch data/jb-2026-04/risk.json` (populate with 5 risk items)
- [ ] Create `.env` with `NUXT_SESSION_PASSWORD` and `DEAL_PASSWORD`
- [ ] Run `npm run dev` — confirm server starts without errors
- [ ] Commit: `git init && git add . && git commit -m "M01: project scaffold"`

---

### M02 — Deal List Page ✅

**Milestone:** `/` page renders the full deal list — filter bar, portfolio summary strip, and deal cards. Clicking a card navigates to the deal dashboard.

**Reference:** `deal-data-room-list.html` (open in browser as visual spec)

**Server**
- [ ] Create `server/api/deals.get.ts`:
  - [ ] Read `data/deals.json`
  - [ ] Compute portfolio aggregates: totalGDV, avgIRR, totalLandAcres, pendingBoardCount
  - [ ] Return `{ deals: [...], portfolio: { ... } }`

**Layout & global components**
- [ ] Create `layouts/default.vue` (or update `app.vue`):
  - [ ] Topbar: logo mark + "Deal Data Room" title + org subtitle
  - [ ] Right: Settings btn, Logout btn, "+ New Deal" btn
  - [ ] NDA amber banner strip below topbar (persistent on every page)

**`pages/index.vue`**
- [ ] Fetch `/api/deals` via `useFetch` → destructure `{ deals, portfolio }`
- [ ] Page header: "Active Deals" title + subtitle text

**`components/FilterBar.vue`**
- [ ] Filter pills: All | Active DD | Under Review | Signed | On Hold (each with count badge)
- [ ] Active pill: dark fill. Inactive: bordered, muted text
- [ ] Search input (right-aligned) — emits search query to parent
- [ ] Parent filters `deals` array by stage and/or search query text

**`components/PortfolioSummary.vue`**
- [ ] 4 summary cards in a row:
  - [ ] Total Pipeline GDV (sum, formatted as RM XB or RM XM)
  - [ ] Avg. Projected IRR (formatted as X.X%)
  - [ ] Total Land Area (formatted as XX.X ac)
  - [ ] Pending Board Sign-off (count + "deals" sub-label)
- [ ] Receives `portfolio` object as prop

**`components/DealCard.vue`**
- [ ] Colour accent bar (3px top border, gradient per stage)
- [ ] Deal name (bold) + ref number (mono, faint)
- [ ] Stage badges (Restricted if applicable + stage label)
- [ ] Location line with pin icon
- [ ] 3-KPI mini grid (bordered box, 3 equal cols):
  - [ ] GDV: value + psf sub-label
  - [ ] IRR: value + delta vs hurdle sub-label (green if above, red if below)
  - [ ] Land: acres + tenure sub-label
- [ ] DD progress bar: "DD Progress" label + % text + coloured fill bar
- [ ] Card footer (light bg): status dot (coloured) + stage note + "Updated {date}" right-aligned
- [ ] Hover: `translateY(-2px)` lift + stronger shadow
- [ ] Staggered fade-up on page load (`animation-delay` per card index)
- [ ] Entire card is a `<NuxtLink :to="'/' + deal.id">` wrapper

**"+ Add new deal" card**
- [ ] Dashed border, centred + icon + label
- [ ] Hover fills surface colour
- [ ] For now: `alert('Coming in Phase 4')` on click

**Stage colour map** (define as a constant in `DealCard.vue`):
```js
const stageColors = {
  'Active DD':    { bar: 'from-teal-400 to-teal-600', badge: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  'Under Review': { bar: 'from-amber-300 to-amber-500', badge: 'bg-amber-100 text-amber-800', dot: 'bg-blue-400' },
  'Signed':       { bar: 'from-purple-400 to-purple-700', badge: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  'On Hold':      { bar: 'from-gray-300 to-gray-500', badge: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
}
```

**Testing**
- [ ] Seed `deals.json` with all 5 deals from prototype (Permas Jaya, Iskandar Waterfront, Bukit Jalil, Damansara Damai, Rawang Township)
- [ ] Filter pills hide/show cards correctly
- [ ] Search box filters by name and location
- [ ] Portfolio summary reflects the correct aggregates
- [ ] Clicking Permas Jaya card navigates to `/jb-2026-04`

- [ ] Commit: `git commit -m "M02: deal list page with filter, portfolio strip, deal cards"`

---

### M03 — Dashboard Shell + Tab Layout ✅

**Milestone:** `/[dealId]` page loads with 5-tab navigation. Switching tabs shows different placeholder content.

- [ ] Create `pages/[dealId]/index.vue`
- [ ] Add `useRoute()` to get `dealId` param
- [ ] Fetch `meta.json` via `/api/[dealId]/meta` — display deal name + subtitle in header
- [ ] Build tab bar component (inline or `components/TabBar.vue`):
  - [ ] 5 tabs: Overview | Documents | Financials | Risk & Legal | Deal Team
  - [ ] Active tab: bold text + 2px bottom border
  - [ ] Inactive: muted text, hover state
  - [ ] `v-model` or reactive `activeTab` ref to control which tab content renders
- [ ] Import and render each tab component conditionally:
  - [ ] `<OverviewTab />` (placeholder div for now)
  - [ ] `<DocumentsTab />` (placeholder)
  - [ ] `<FinancialsTab />` (placeholder)
  - [ ] `<RiskTab />` (placeholder)
  - [ ] `<TeamTab />` (placeholder)
- [ ] Create the 5 component files with placeholder `<div>Tab name here</div>` content
- [ ] Add deal header (name, subtitle, stage badges, "Restricted" badge if applicable)
- [ ] Test: navigate to `/jb-2026-04`, tabs switch correctly
- [ ] Commit: `git commit -m "M03: dashboard shell and tab layout"`

---

### M04 — Overview Tab ✅

**Milestone:** Overview tab shows real data: 4 KPI cards, interactive Leaflet satellite map, DD milestones, development mix, key assumptions.

> **Apr 2026 enhancement:** Replaced static Google Maps iframe with a fully interactive Leaflet map (scroll-to-zoom, click-drag pan). Base layer: Esri World Imagery satellite + street labels. Site marker placed at deal coordinates.

- [ ] Create `server/api/[dealId]/meta.get.ts` — reads and returns `meta.json`
- [ ] Build `components/OverviewTab.vue`:

**KPI cards row (4 cards)**
  - [ ] Land area card (value + "Freehold title" sub-label)
  - [ ] Est. GDV card (value + "Blended psf RM X" sub-label from meta)
  - [ ] Land cost card (value + "RM X psf" sub-label)
  - [ ] Proj. IRR card (value + "Threshold X%" sub-label, coloured based on above/below threshold)

**Three-column grid**
  - [ ] Left: Site location card
    - [ ] Section label "Site location"
    - [ ] Google Maps embed iframe (lat/lng from meta.json)
    - [ ] Gradient overlay with parcel name + sub-label
    - [ ] "Open ↗" button linking to `https://maps.google.com/?q={lat},{lng}`
    - [ ] Coordinate pills (lat, lng, city)
    - [ ] Key proximities list (coloured dots + label + distance from meta.json)
  - [ ] Centre: DD milestones card
    - [ ] Status dot (green=done, blue=active, grey=pending)
    - [ ] Milestone label + date
    - [ ] Status badge (Done / In progress / Pending)
    - [ ] Loop over `meta.milestones` array
  - [ ] Right: Development mix card
    - [ ] Progress bars for each dev type (pct + color from meta.devMix)
    - [ ] Key assumptions grid (2×2, from meta.assumptions)

- [ ] Test: all data renders correctly from meta.json
- [ ] Test: Google Maps embed loads (may need Maps Embed API key in .env)
- [ ] Commit: `git commit -m "M04: overview tab complete"`

---

## Phase 2 — Excel Integration (Days 2–3)

Goal: Financials tab renders live data from the actual BRDB `.xlsx` model.

---

### M05 + M14 — Excel Parser & BRDB Model Wiring ✅

**Milestone:** `GET /api/[dealId]/financials` returns correct JSON from the real BRDB Excel file.

> **Apr 2026:** Implemented ExcelJS parser at `server/api/[dealId]/financials.get.ts`. Auto-detects the active phase column (first col with NDV > 0 in row 61). Extracts 15+ metrics from `Feasibility Study`, `IRR & Sensitivity`, and `Cashflow` sheets. Returns source: 'xlsx' flag so the UI shows a "Live figures" green badge. Fallback to deals.json estimates when no xlsx present. Demo file at `data/KL-2025-11/financials.xlsx` (Jalan Desa Sentosa template).
> 
> **Verified API output for KL-2025-11:** NDV 176.4M · GDV 220.2M · Construction 103.6M · NDP 38.1M · Dev margin 21.6% · Hurdle IRR 16% · Base ASP RM 680 psf · Base absorption 80%

- [ ] Copy real BRDB model to `data/jb-2026-04/financials.xlsx`
- [ ] Structure Excel file with required sheet names (or rename existing sheets):
  - [ ] `Summary` sheet with named ranges (GDV_Total, LandCost_Total, DevCost_Total, IRR_Base, DevMargin_Pct, EquityRequired, BlendedPSF, LandPSF)
  - [ ] `Cashflow` sheet: rows = years, col A = year label, col B = inflows, col C = outflows
  - [ ] `CostBreakdown` sheet: col A = category, col B = RM M value
  - [ ] `Sensitivity` sheet: row 1 = ASP headers, col A = absorption %, body = IRR values
- [ ] Write standalone `parse-excel.js` test script first:
  ```
  node parse-excel.js data/jb-2026-04/financials.xlsx
  ```
  - [ ] Confirm named ranges resolve correctly
  - [ ] Confirm cashflow rows parse correctly
  - [ ] Confirm sensitivity matrix reads as 2D array
- [ ] Create `server/api/[dealId]/financials.get.ts`:
  - [ ] Read file with `ExcelJS.Workbook().xlsx.readFile()`
  - [ ] Helper function `getValue(cell)` to handle formula result objects vs plain numbers vs null
  - [ ] Parse named ranges from `Summary` sheet
  - [ ] Parse `Cashflow` sheet rows
  - [ ] Parse `CostBreakdown` sheet rows
  - [ ] Parse `Sensitivity` sheet as 2D array (with row/col headers)
  - [ ] Return combined JSON object
- [ ] Test endpoint: `curl http://localhost:3000/api/jb-2026-04/financials` — verify correct values
- [ ] Commit: `git commit -m "M05: ExcelJS parser working"`

---

### M14 — Excel Model Wiring (BRDB-specific) ✅ — merged into M05 above

- [ ] Map actual BRDB named ranges to parser (verify names match exactly):
  - [ ] `GDV_Total` → `'Feasibility Study'!$AY$67`
  - [ ] `NDV_Total` → `'Feasibility Study'!$AY$77`
  - [ ] `LandCost_Total` → `'Feasibility Study'!$AY$86`
  - [ ] `NDP_Total` → `'Feasibility Study'!$AY$223`
  - [ ] `NDP_PctOfNDV` → `'Feasibility Study'!$AY$224`
  - [ ] All 81 named ranges from Summary sheet (see plan.md Section 4)
- [ ] If deal has no separate Cashflow/CostBreakdown sheets yet:
  - [ ] Add `Cashflow` sheet with year-by-year construction drawdown from main model
  - [ ] Add `CostBreakdown` sheet linking to GCC, Land, SGA, Finance totals
- [ ] Verify all KPI values match expected numbers from Excel
- [ ] Commit: `git commit -m "M14: BRDB model wired to financials API"`

---

### M06 — Financials Tab ✅

**Milestone:** Financials tab shows real KPI cards, cost doughnut, cashflow bar chart, and IRR sensitivity table — all from the Excel model.

- [ ] Build `components/FinancialsTab.vue`:
  - [ ] Fetch `/api/[dealId]/financials` via `useFetch`
  - [ ] Show loading state while fetching

**KPI cards row (4 cards)**
  - [ ] Total dev cost
  - [ ] GDV (with blended PSF sub-label)
  - [ ] Dev margin % (on GDV)
  - [ ] Equity required

**Two charts side by side**
  - [ ] Left: Cost breakdown doughnut chart (vue-chartjs)
    - [ ] Land / Construction / SGA / Finance cost segments
    - [ ] Custom legend below chart (square colour swatches + label + RM M value)
    - [ ] Cutout 62% (ring style)
    - [ ] No default Chart.js legend
  - [ ] Right: Projected cashflow bar chart (vue-chartjs)
    - [ ] Grouped bars: inflows (green) + outflows (coral) per year
    - [ ] Y-axis labels: "RM XM"
    - [ ] No default legend

**Sensitivity table**
  - [ ] Rows = absorption rate (60–100%)
  - [ ] Cols = ASP psf (RM 620–740)
  - [ ] Base case cell: green background + star symbol
  - [ ] IRR ≥ hurdle threshold: green text
  - [ ] IRR < hurdle: red text
  - [ ] Table overflow handled (horizontal scroll on mobile)

- [ ] Test: all charts render with real Excel data
- [ ] Test: sensitivity colours correct relative to hurdle rate
- [ ] Commit: `git commit -m "M06: financials tab with charts and sensitivity table"`

---

### M16 — Feasibility Model Upload (in-UI) ✅

**Milestone:** Users can upload or replace `financials.xlsx` directly from the Financials tab — no manual file copying required.

> **Apr 17 2026:** Added `POST /api/[dealId]/financials` endpoint and replaced the static data-source note banner with a full upload UI in `FinancialsTab.vue`. After upload, `refreshFin()` in the parent page re-fetches live figures and updates all KPI cards, charts, and sensitivity table without a page reload.

- [x] Create `server/api/[dealId]/financials.post.ts`:
  - [x] Parse multipart form upload via `readMultipartFormData`
  - [x] Validate `.xlsx` extension; reject anything else
  - [x] Path-traversal guard on `dealId`
  - [x] Write file to `data/[dealId]/financials.xlsx`
  - [x] Auto-create deal directory if missing
- [x] Update `FinancialsTab.vue`:
  - [x] Add `dealId` prop + `uploaded` emit
  - [x] Replace static data-note with smart upload banner
  - [x] Amber banner when estimates; green banner when live xlsx
  - [x] Hidden `<input type="file" accept=".xlsx">` triggered by button
  - [x] Upload spinner + success toast + error message (auto-dismiss)
- [x] Update `pages/[dealId]/index.vue`:
  - [x] Extract `refreshFin()` from `onMounted` so it's reusable
  - [x] Wire `@uploaded="refreshFin"` on `<FinancialsTab>`
  - [x] Pass `:deal-id="dealId"` to `<FinancialsTab>`
- [x] Commit: `git commit -m "feat(M16): in-UI financials.xlsx upload"`

**Also completed Apr 17:** Generated `BRDB_Feasibility_Study_Template.xlsx` with correct parser-compatible layout (3 sheets: `Feasibility Study`, `IRR & Sensitivity`, `Cashflow`). Added 3 parser-compatible sheets to the live Jalan Desa Sentosa feasibility study (`data/KL-2026-02/financials.xlsx`) — all 17 cell references auto-linked via cross-sheet formulas.

---

### M17 — Add New Deal (modal + API) ✅

**Milestone:** Users can create a new deal entirely from the UI — no JSON editing or folder creation required.

> **Apr 17 2026:** Replaced the placeholder alert on the "+ Add new deal" card with a fully functional modal. The API auto-generates the deal ID (`{PREFIX}-{YEAR}-{SEQ}`), creates the deal folder, writes `meta.json` with default milestone scaffold and `risk.json` as an empty array, and appends to `deals.json`. After creation the dashboard navigates directly to the new deal page.

- [x] Create `server/api/deals.post.ts`:
  - [x] Auto-generate `dealId` (`{PREFIX}-{YEAR}-{SEQ:02d}`) from existing deals
  - [x] Validate required fields (name, location)
  - [x] Append new deal to `deals.json`
  - [x] Create `data/[dealId]/` directory
  - [x] Write `meta.json` with default milestones, legalStatus, team, accessLog
  - [x] Write `risk.json` as empty array `[]`
- [x] Create `app/components/AddDealModal.vue`:
  - [x] Fields: Deal Name, Location, State Code (KL/JB/SL/PG/NS/JH/MY), Stage, Tenure
  - [x] Financials section: GDV, Land Cost, Land Area, Hurdle IRR
  - [x] Stage Note + Confidential toggle
  - [x] Inline spinner + error message on submit
  - [x] Escape key closes modal; backdrop click closes
- [x] Update `pages/index.vue`:
  - [x] `showAddDeal` ref wired to "Add new deal" card
  - [x] `onDealCreated(dealId)` refreshes data and navigates to new deal
- [x] Commit: `git commit -m "feat(M17): add new deal modal + API"`

---

### M19 — Settings Modal (branding, security, defaults) ✅

**Milestone:** Admins can update room branding, change the shared password, and set default deal parameters entirely from the UI — no file editing required.

> **Apr 17 2026:** Built a full Settings modal (3 tabs) accessible from the topbar Settings button. Settings persisted in `data/settings.json`. Login route updated to read password from settings.json first. Logo + room name update live in the topbar on save. Fixed Leaflet map z-index overlap issue across all modals.
>
> **Apr 18–19 2026 enhancements:**
> - Room name placeholder updated to "e.g. Wai Berhad"
> - Security tab: show/hide password toggle (eye icon) added to all 3 password fields
> - Login page: room name + initials now loaded dynamically from `/api/settings` (no longer hardcoded to "BRDB Berhad")
> - Login page: show/hide toggle added to the Access Password field
> - Login page footer: removed "BRDB" → now reads "Contact your deal team administrator"
> - Login page NDA notice: company name now dynamic (uses room name from settings)

- [x] Create `data/settings.json` with defaults (roomName, logoDataUrl, defaultHurdleRate, password)
- [x] Create `server/api/settings.get.ts` — returns settings without exposing password to client
- [x] Create `server/api/settings.put.ts` — handles branding, password change (with current password verification), and hurdle rate default
- [x] Update `server/api/auth/login.post.ts` — reads password from settings.json, falls back to .env
- [x] Create `app/components/SettingsModal.vue` — 3-tab modal:
  - [x] Branding tab: room name field + logo upload (PNG/JPG/SVG, up to 2 MB, base64 stored)
  - [x] Security tab: current password verification + new password (min 6 chars) + show/hide toggles
  - [x] Defaults tab: default hurdle IRR % pre-fills Add New Deal form
- [x] Update `app/layouts/default.vue`:
  - [x] Settings button wired to open SettingsModal
  - [x] Topbar logo + room name read dynamically from settings API
  - [x] Logo/name wrapped in `<NuxtLink to="/">` — clicking navigates back to deal list
- [x] Login page loads room name from `/api/settings` — logo initials + NDA text + header all dynamic
- [x] Fix Leaflet z-index bleed — raised all modal backdrops to `z-index: 1000`, added `isolation: isolate` to map containers
- [x] Fix deal title sync — `saveChanges()` now writes name to both `meta.json` and `deals.json`
- [x] Commit: `git commit -m "feat(M19): settings modal — branding, password, defaults"`

---

### M20 — Trash & Permanent Delete ✅

**Milestone:** Deals can be moved to trash from the deal list and permanently deleted (with Supabase cleanup) from a dedicated Trash page.

> **Apr 19 2026:** Added soft-delete (trash) and hard-delete flows. Trashed deals disappear from the active deal list immediately. The `/trash` page lists all trashed deals with Restore and Delete Forever actions. Permanent delete cascades to `deal_meta`, `deal_documents`, and `deal_risk` tables in Supabase.

- [x] Supabase migration: add `trashed boolean DEFAULT false` and `trashed_at timestamptz` to `deals` table
- [x] `PUT /api/[dealId]/trash` — sets `trashed: true`, records `trashed_at` timestamp
- [x] `PUT /api/[dealId]/restore` — sets `trashed: false`, clears `trashed_at`
- [x] `DELETE /api/[dealId]` — hard delete: removes from `deal_documents`, `deal_meta`, `deal_risk`, then `deals`
- [x] `GET /api/deals/trashed` — returns all deals where `trashed = true`, ordered by `trashed_at` desc
- [x] Update `deals.get.ts` — filters out trashed deals (`.eq('trashed', false)`)
- [x] `DealCard.vue` — trash icon appears on hover (top-right); click confirms and emits `trashed` event
- [x] `pages/index.vue` — handles `@trashed` event by refreshing deal list; added "Trash" link button in page header
- [x] `pages/trash.vue` — lists trashed deals with Restore and Delete Forever buttons; empty state when clean
- [x] Commit: `git commit -m "feat(M20): trash and permanent delete with Supabase cleanup"`

---

### M15 — Sensitivity Table (detailed) ✅

**Milestone:** Sensitivity table correctly calculates and colour-codes IRR values from the parsed Sensitivity sheet.

- [ ] Parse `Sensitivity` sheet into `{ headers: string[], rows: { label: string, values: number[] }[] }`
- [ ] Hurdle rate configurable in `meta.json` (default 16%)
- [ ] Build table component:
  - [ ] Header row (ASP psf values)
  - [ ] Each row: absorption label + IRR % cells
  - [ ] Cell background logic: base case = green fill, ≥ hurdle = green text, < hurdle = red text
  - [ ] `toFixed(1) + '%'` formatting on all IRR values
- [ ] Mobile: `overflow-x: auto` wrapper on table
- [ ] Commit: `git commit -m "M15: sensitivity table component"`

---

## Phase 3 — Document Management (Days 4–5)

Goal: Documents tab shows real files with upload capability.

---

### M07 — Documents Tab ✅

**Milestone:** Documents tab lists all files in `data/[dealId]/docs/` with correct metadata and status badges.

- [ ] Create `server/api/[dealId]/documents.get.ts`:
  - [ ] Scan `data/[dealId]/docs/` directory
  - [ ] For each non-`.meta.json` file, read its `.meta.json` sidecar
  - [ ] Return array: `{ filename, originalName, category, status, uploader, uploadDate, sizeMB, ext }`
- [ ] Build `components/DocumentsTab.vue`:
  - [ ] Two-column layout: legal documents | financial & technical (filter by `category`)
  - [ ] Document row component:
    - [ ] File type badge (PDF = coral, XLS = green, DOC = blue, IMG = amber) with 3-letter label
    - [ ] Document name (from sidecar `originalName`)
    - [ ] Upload meta (uploader + date + size)
    - [ ] Status badge (New = green, Reviewed = grey, Pending = amber)
    - [ ] Click to open/download the file
  - [ ] "Upload document" button per category column
- [ ] Add seed documents to `data/jb-2026-04/docs/` with sidecar `.meta.json` files
- [ ] Test: all seed documents appear in the correct category column
- [ ] Commit: `git commit -m "M07: documents tab listing"`

---

### M08 — Document Upload ✅

**Milestone:** Users can upload PDF/XLS/DOC files from the Documents tab. New files appear immediately in the list.

- [ ] Create `server/api/[dealId]/upload.post.ts`:
  - [ ] Parse multipart form with `readMultipartFormData(event)`
  - [ ] Validate: allowed extensions (pdf, xlsx, xls, doc, docx, jpg, png)
  - [ ] Save file to `data/[dealId]/docs/[sanitized-filename]`
  - [ ] If `.xlsx` extension → also copy to `data/[dealId]/financials.xlsx`
  - [ ] Create sidecar `.meta.json` with status="new", uploader from session, date=now
  - [ ] Return `{ success: true, filename }`
- [ ] Add upload UI to `DocumentsTab.vue`:
  - [ ] File input (hidden) + styled "Upload" button
  - [ ] On file select: POST to `/api/[dealId]/upload`
  - [ ] Show upload progress / loading state
  - [ ] On success: refresh document list (`refresh()` from `useFetch`)
- [ ] Add status change UI (click status badge → cycle through New/Reviewed/Pending):
  - [ ] `PATCH /api/[dealId]/documents/[filename]` endpoint to update sidecar status
- [ ] Test: upload a PDF, verify it appears in the list with "New" status
- [ ] Test: upload an `.xlsx`, verify financials API returns updated numbers
- [ ] Commit: `git commit -m "M08: document upload"`

---

### M09 — Risk & Legal Tab ✅

**Milestone:** Risk & Legal tab shows the risk register from `risk.json` and a static legal status table.

- [ ] Add legal status fields to `meta.json`:
  ```json
  "legalStatus": {
    "titleType": "Freehold (Hakmilik Kekal)",
    "encumbrance": "Clear (post Mar 18)",
    "encumbranceStatus": "clear",
    "currentZoning": "Commercial",
    "requiredRezoning": "Residential — pending",
    "rezoningStatus": "pending",
    "bumiQuota": "30% (negotiable)",
    "legalCounsel": "Messrs. Zaid Ibrahim & Co."
  }
  ```
- [ ] Create `server/api/[dealId]/risk.get.ts` — reads `risk.json`, returns array
- [ ] Build `components/RiskTab.vue`:
  - [ ] Two-column grid
  - [ ] Left: Risk register card
    - [ ] Section label
    - [ ] Risk items: coloured dot (red=high, amber=med, green=low) + title (bold) + description
    - [ ] Loop over risk array
  - [ ] Right: Legal status card
    - [ ] Row for each field: label (muted) + value (colour-coded based on status)
    - [ ] "Clear" encumbrance = green text
    - [ ] "pending" items = amber text
    - [ ] Normal items = primary text
- [ ] Test: risk items display with correct severity colours
- [ ] Commit: `git commit -m "M09: risk and legal tab"`

---

### M10 — Deal Team Tab ✅

**Milestone:** Deal Team tab shows internal team + external advisors with avatar initials and an access log.

- [ ] Add access log to `meta.json`:
  ```json
  "accessLog": [
    { "user": "Wai Win Han", "action": "viewed", "file": "Feasibility model v4", "timestamp": "2026-04-06T09:14:00" },
    { "user": "Rebecca Lim", "action": "uploaded", "file": "Feasibility model v4", "timestamp": "2026-04-05T17:42:00" }
  ]
  ```
- [ ] Build `components/TeamTab.vue`:
  - [ ] Two-column grid: BRDB deal team | External advisors
  - [ ] Team member row: avatar circle (initials + background colour) + name + role + firm/label
  - [ ] Avatar colours: assign from a fixed palette by index (teal, blue, pink, amber, purple…)
  - [ ] Access log card below the grid:
    - [ ] Each log entry: bold user name + action + file name + formatted timestamp
    - [ ] Relative time ("Today 09:14", "Yesterday 17:42", "22 Mar 16:20")
- [ ] Append to access log when a document is viewed or uploaded (server-side, in upload.post.ts and documents.get.ts)
- [ ] Test: team members render with correct initials and colours
- [ ] Commit: `git commit -m "M10: deal team tab"`

---

## Phase 4 — Auth, Multi-deal, Deployment (Days 5–7)

Goal: NDA password gate, deal list page routing, shareable private URL.

---

### M11 — Auth — NDA Password Gate ✅

**Milestone:** All routes redirect to `/login` if unauthenticated. Login page accepts shared password from `.env`.

- [x] Install `nuxt-auth-utils` + add to `nuxt.config.ts` modules
- [x] Create `pages/login.vue`:
  - [x] BRDB logo + "Deal Data Room" heading
  - [x] NDA reminder notice (amber box)
  - [x] Password input with focus, error state, loading spinner
  - [x] On success: POST to `/api/auth/login` → set session → redirect to `/`
- [x] Create `server/api/auth/login.post.ts`:
  - [x] Compare submitted password to `config.dealPassword` (from `.env`)
  - [x] On match: `setUserSession(event, { user: { role: 'authorized' } })`
  - [x] Return `{ success: true }` or 401 with message
- [x] Create `server/api/auth/logout.post.ts`:
  - [x] `clearUserSession(event)`
- [x] Create `app/middleware/auth.ts`:
  - [x] Uses `useUserSession()` → checks `loggedIn`
  - [x] If not logged in AND not on `/login` → redirect to `/login`
- [x] Add `middleware: 'auth'` to `definePageMeta` on both `/` and `/[dealId]` pages
- [x] Logout button in topbar wired to `POST /api/auth/logout` → redirects to `/login`
- [x] Commit: `git commit -m "M11: NDA password gate"`

---

### M12 — Multi-Deal Routing ✅

**Milestone:** Multiple deals exist in `deals.json`. The deal list page shows all of them. Each links to its own dashboard.

- [x] 5 deals in `deals.json` (JB-2026-04, JB-2026-07, KL-2026-02, KL-2025-11, SL-2026-01)
- [x] All 5 deal data directories exist with `meta.json` and `risk.json`
- [x] Deal list page shows all 5 cards with filter/search
- [x] Each card navigates to the correct deal dashboard via `/[dealId]`
- [x] `/api/[dealId]/meta` returns deal-specific data per deal ID
- [x] API returns 404 with message if `meta.json` doesn't exist for a dealId
- [x] Added `app/error.vue` — branded 404/error page with "Back to Deal List" and "Login" buttons
- [x] Commit: `git commit -m "M12: multi-deal routing"`

---

### M13 — Deployment (Netlify) ✅

**Milestone:** App is running on a private HTTPS Netlify URL. Shareable with BRDB teammates.

> **Apr 21 2026:** Deployed to [https://bd-data-room.netlify.app](https://bd-data-room.netlify.app). Auto-deploy connected to GitHub — every push to `main` triggers a Netlify build. Environment variables (`NUXT_SESSION_PASSWORD`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`) set in Netlify dashboard. `DEAL_PASSWORD` removed from env — password now managed exclusively through Supabase settings table. Login confirmed working with session cookie auth.

- [x] Install Netlify adapter: `npm install -D @netlify/nuxt`
- [x] Add `@netlify/nuxt` to modules in `nuxt.config.ts`
- [x] Connect GitHub repo → Netlify, base directory: `deal-data-room`
- [x] Set env vars in Netlify: `NUXT_SESSION_PASSWORD`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- [x] Deploy confirmed working at `https://bd-data-room.netlify.app`
- [x] Login, session auth, all tabs verified
- [x] Commit: `git commit -m "M13: deployed to Netlify"`

---

## Phase 5 — Database & Persistent Storage

Goal: Replace flat JSON files + local filesystem with Supabase (PostgreSQL + Storage) so all data survives deploys and the app is ready for real team use.

---

### M18 — Supabase DB + Storage Migration ✅

**Milestone:** All deal data lives in Supabase. Uploaded files go to Supabase Storage. App deploys to Netlify and nothing is ever lost on redeploy.

**Why:** Netlify's filesystem is ephemeral — any deal created via UI or file uploaded is wiped on every redeploy. Supabase fixes this permanently.

---

**Step 1 — Create Supabase project (Wai does this, ~5 min)**
- [ ] Go to [supabase.com](https://supabase.com) → New project
- [ ] Name: `brdb-deal-data-room`, Region: `Southeast Asia (Singapore)`
- [ ] Copy **Project URL** and **anon public key** from Settings → API
- [ ] Add to `.env`:
  ```
  SUPABASE_URL=https://xxxx.supabase.co
  SUPABASE_ANON_KEY=eyJ...
  ```

**Step 2 — Run SQL schema in Supabase SQL editor**
- [ ] Create `deals` table (id, name, ref, location, lat, lng, stage, restricted, gdv, ndv, blended_psf, land_cost, construction_cost, ndp, ndp_margin, irr, hurdle_rate, land_acres, tenure, dd_progress, updated_at, stage_note)
- [ ] Create `deal_meta` table (deal_id PK → FK to deals, data JSONB) — stores milestones, devMix, legalStatus, team, assumptions, swot, accessLog
- [ ] Create `deal_risks` table (id UUID PK, deal_id FK, title, description, severity, created_at)
- [ ] Create Storage bucket: `deal-files` (private) — stores `{dealId}/financials.xlsx` and `{dealId}/docs/{filename}`

**Step 3 — Install Supabase client + update nuxt.config**
- [ ] `npm install @supabase/supabase-js`
- [ ] Create `server/utils/supabase.ts` — exports typed Supabase client using runtime config
- [ ] Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `nuxt.config.ts` runtimeConfig

**Step 4 — Migrate seed data from JSON → Supabase**
- [ ] Write one-off migration script: reads all `data/*.json` files, inserts into Supabase tables
- [ ] Run script locally, verify all 5 deals appear in Supabase dashboard
- [ ] Migrate existing `docs/` files to Supabase Storage

**Step 5 — Rewrite server API routes (22 files)**

*Deals:*
- [ ] `deals.get.ts` — `SELECT * FROM deals` + compute portfolio aggregates
- [ ] `deals.post.ts` — `INSERT INTO deals` + `INSERT INTO deal_meta`

*Per-deal metadata:*
- [ ] `[dealId]/meta.get.ts` — `SELECT data FROM deal_meta WHERE deal_id = ?`
- [ ] `[dealId]/meta.put.ts` — `UPDATE deal_meta SET data = ?`
- [ ] `[dealId]/deal.put.ts` — `UPDATE deals SET ... WHERE id = ?`

*Risks:*
- [ ] `[dealId]/risk.get.ts` — `SELECT * FROM deal_risks WHERE deal_id = ?`
- [ ] `[dealId]/risk.post.ts` — `INSERT INTO deal_risks`
- [ ] `[dealId]/risk/[id].put.ts` — `UPDATE deal_risks SET ...`
- [ ] `[dealId]/risk/[id].delete.ts` — `DELETE FROM deal_risks WHERE id = ?`

*File uploads → Supabase Storage:*
- [ ] `[dealId]/upload.post.ts` — `supabase.storage.from('deal-files').upload(path, buffer)`
- [ ] `[dealId]/documents.get.ts` — `supabase.storage.from('deal-files').list(dealId/docs/)`
- [ ] `[dealId]/documents/[filename].get.ts` — `createSignedUrl()` or stream from Storage
- [ ] `[dealId]/documents/[filename].delete.ts` — `supabase.storage.remove([path])`
- [ ] `[dealId]/documents/[filename].patch.ts` — update metadata in `deal_meta` JSONB
- [ ] `[dealId]/financials.get.ts` — download xlsx from Storage → parse with ExcelJS in memory
- [ ] `[dealId]/financials.post.ts` — upload xlsx to `{dealId}/financials.xlsx` in Storage

*Remaining:*
- [ ] `[dealId]/trash.get.ts`, `[dealId]/trash/[filename].put.ts` — Storage-based trash logic
- [ ] `[dealId]/doc-categories*.ts` — store custom categories in `deal_meta` JSONB
- [ ] `server/utils/accessLog.ts` — append to `deal_meta.data.accessLog` via Supabase update

**Step 6 — Deploy to Netlify with Supabase env vars**
- [ ] Add to Netlify environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `DEAL_PASSWORD`
  - `NUXT_SESSION_PASSWORD`
- [ ] Remove `data/` directory dependency from production (keep in git as backup only)
- [ ] Deploy + verify all 5 deals load from Supabase
- [ ] Test: add a new deal via UI → still there after re-deploy ✓
- [ ] Test: upload financials.xlsx → still there after re-deploy ✓

**Step 7 — Cleanup**
- [ ] Remove `fs.readFileSync` / `fs.writeFileSync` from all API routes
- [ ] Remove `config.dataDir` from `nuxt.config.ts`
- [ ] Update progress plan + commit: `git commit -m "feat(M18): Supabase DB + Storage migration"`

> **Apr 18 2026:** Migration completed. All deal data (deals, deal_meta, deal_risk, deal_documents) live in Supabase. File uploads go to `deal-files` Storage bucket. Storage RLS policies added (SELECT/INSERT/UPDATE/DELETE for anon + authenticated roles) to unblock `.xlsx` and document uploads. Overview tab KPI cards fixed — Land Cost and NDV subtitle now read from `fin` (Excel) first, falling back to deal-list values.

---

---

### M21 — Multi-Password Slots + Login Access Log ✅

**Milestone:** Admin can create multiple named password slots (e.g. Admin, Investor, Partner) and view a real-time log of all login attempts.

> **Apr 21 2026:** Replaced single shared password with a named password slots system stored in Supabase `settings` table. Each slot has a label and password. Login checks against all active slots, logs every attempt (success/fail) to a new `access_log` Supabase table. Settings → Security tab redesigned for slot management. Settings → Access Log tab shows last 100 login attempts with user label, IP, browser, and status.

- [x] Supabase migration: create `access_log` table (id, created_at, label, ip, user_agent, success)
- [x] Migrate settings from single `password` field to `passwords: [{label, password}]` array in Supabase
- [x] `login.post.ts` — checks against all password slots, logs every attempt with IP + user-agent
- [x] `GET /api/auth/access-log` — returns last 100 login attempts
- [x] `settings.put.ts` — addPassword, removePassword, updatePassword operations (Admin-only, requires admin password confirmation)
- [x] `settings.get.ts` — returns password slot labels only (never exposes actual passwords to client)
- [x] Settings → Security tab: add/edit/remove slots, show/hide password toggles, Admin password confirmation required for all changes
- [x] Settings → Access Log tab: table with date/time, label, IP, browser, success/fail badge
- [x] Non-Admin users see locked view on Security tab
- [x] Admin slot cannot be removed or renamed
- [x] Session stores `user.label` (which password slot was used to login)

---

### M22 — Logo Editor (Drag + Resize) ✅

**Milestone:** After uploading a logo, Admin can drag to reposition and use a slider to resize the image before saving.

> **Apr 21 2026:** Built an inline canvas-based logo editor in the Settings → Branding tab. After selecting an image file, an 180×180 editor viewport opens. The user can drag the image to reposition it and use a range slider (20%–400%) to scale. Apply renders the result to a 160×160 canvas and saves as base64. An "Edit Position" button re-opens the editor on an existing logo.

- [x] `rawImageSrc` state — holds original uploaded file before crop
- [x] 180×180 editor box with pointer drag (mouse + touch via Pointer Events API)
- [x] Scale range slider (0.2× – 4×, step 0.02)
- [x] Reset button centers and resets scale to 1×
- [x] Apply renders image to `<canvas>` at OUTPUT_PX × OUTPUT_PX using correct transform math, saves as PNG data URL
- [x] "Edit Position" on existing logo re-opens editor
- [x] Admin-only — non-Admin users see lock notice on Branding tab (backend also guards)

---

### M23 — Editable Deal Team + Deal Activity Log ✅

**Milestone:** Admin can add/edit/remove internal team members and external advisors from the Deal Team tab. All document and team actions are logged in a persistent per-deal activity log.

> **Apr 21 2026:** Added Edit buttons to Deal Team and External Advisors cards (Admin only). Inline editing with add/remove rows. New `deal_activity_log` Supabase table tracks all user actions per deal. `logActivity.ts` server utility non-blockingly logs to Supabase using session label. Document Access Log now shows real data from Supabase instead of static meta.json entries.

- [x] Supabase migration: create `deal_activity_log` table (id, created_at, deal_id, user_label, action, target_type, target_name)
- [x] `server/utils/logActivity.ts` — non-blocking helper, reads session label, inserts to Supabase
- [x] `PUT /api/[dealId]/team` — dedicated endpoint for team updates, logs to activity log
- [x] `GET /api/[dealId]/activity-log` — returns last 100 entries for a deal
- [x] Logging wired into: `upload.post.ts` (uploaded), `[filename].delete.ts` (deleted), `[filename].patch.ts` (status changed), `team.put.ts` (team updated)
- [x] `TeamTab.vue` — Edit button on Deal Team + External Advisors cards (Admin only)
- [x] Inline edit mode: add/remove/update rows, field validation, save/cancel
- [x] Internal member fields: Name, Role, Email
- [x] External advisor fields: Name, Role, Firm, Email
- [x] Document Access Log now fetches from `/api/[dealId]/activity-log` — real-time, per deal
- [x] Log entries show: icon (coloured by action), user label, action, target name, type badge, timestamp

---

---

### M24 — Excel Parser Multi-Template + KPI Auto-Sync ✅

**Milestone:** Excel parser handles both the old single-phase template and the new multi-phase BRDB template. Uploading a feasibility model auto-updates the deal card (NDV, NDP margin, blended PSF, land acres) without manual editing.

> **Apr 21 2026:** Refactored `financials.get.ts` into a shared utility `server/utils/parseFinancials.ts`. Parser now auto-detects template version (old vs new 2025+ multi-phase) by checking the row 61 label. New template has NDP at row 159, construction at row 78, land at row 68, etc. (all shifted from old). NDV detection now checks both rows 61 and 60 as a fallback. After upload via `financials.post.ts`, key KPIs (ndv, gdv, ndpMargin, blendedPSF, landAcres) are parsed and written back to the `deals` Supabase table — so the deal list card reflects live figures immediately without manual editing. Financials upload also auto-saves the file to Documents > Financial category.

- [x] Extract parser into `server/utils/parseFinancials.ts` shared utility
- [x] Auto-detect template version by row 61 col 1 label
- [x] NDV: check row 61 first, fall back to row 60
- [x] New template row mappings: NDP→159, devMgn→160, land→68, construction→78, authority→111/114/117, consultancy→130, siteAdmin→137, finance→152, GDC→145
- [x] `financials.post.ts`: parse buffer after upload, sync ndv/gdv/ndpMargin/blendedPSF/landAcres to `deals` table
- [x] `financials.post.ts`: auto-save copy to `deal_documents` with `category: 'financial'`

---

### M25 — Documents Trash Permanent Delete + Rename Fix ✅

**Milestone:** Trashed documents can be permanently deleted (with warning dialog) or restored. Renaming a document now persists correctly.

> **Apr 21 2026:** Added `DELETE /api/[dealId]/trash/[filename]` endpoint that removes the file from both Supabase Storage and `deal_documents` table. Trash section in DocumentsTab now always visible (shows "Trash is empty" when clean). Each trashed file has a red "Delete forever" button that opens a destructive warning dialog. Rename was broken — `documents/[filename].put.ts` was writing to a local `.meta.json` file while `documents.get.ts` reads from Supabase; rewrote the PUT handler to update the `deal_documents` Supabase table.

- [x] `DELETE /api/[dealId]/trash/[filename]` — removes from Supabase Storage + `deal_documents` table
- [x] Trash section always visible in DocumentsTab (not conditional on item count)
- [x] "Delete forever" button per trashed file → red warning dialog → permanent removal
- [x] Fix `documents/[filename].put.ts` — rewritten to update `deal_documents` in Supabase (was writing to dead local `.meta.json`)

---

### M26 — Welcome Popup (admin-configurable GIF + message) ✅

**Milestone:** A welcome popup appears on first login with a custom GIF and message, configurable by Admin from Settings.

> **Apr 21 2026:** Added a welcome popup modal that displays on first page load after login. Admin can upload a GIF and write a custom welcome message in Settings → Branding tab. Popup is dismissible and remembers dismissal per session.

- [x] Admin-configurable welcome GIF + message stored in Supabase settings table
- [x] Settings → Branding tab: GIF upload field + welcome message textarea
- [x] Popup shown on first load after login (session-scoped dismissal)
- [x] Dismiss button closes popup and suppresses for the rest of the session

---

### M27 — Manual SWOT & Recommendation Editing ✅

**Milestone:** Users can manually create or edit the SWOT analysis and AI Recommendation from the Overview tab — no AI generation required.

> **Apr 23 2026:** Added Edit / Add Manually buttons to the SWOT Analysis and AI Recommendation sections. In edit mode, each SWOT quadrant becomes a textarea (one bullet per line). The Recommendation section shows a verdict dropdown, headline input, rationale textarea, and key conditions textarea. Saves to Supabase `deal_meta` via `PUT /api/[dealId]/meta` and triggers a parent `refreshMeta()` so data persists across tab switches without page reload.
>
> **Bug fixed (Apr 23):** Auto-suggest proximities was failing with "Could not reach map service" due to: (1) Overpass API returning 406 when no `User-Agent` header is present, (2) coordinates not yet saved to Supabase when button is clicked. Fixed by adding `User-Agent` header, adding fallback mirror (`overpass.kumi.systems`), and passing current lat/lng from client in the POST body so unsaved coordinates work.

- [x] SWOT section: **Edit** button (when SWOT exists) / **Add Manually** button (when empty)
- [x] Edit mode: 4 textareas — Strengths, Weaknesses, Opportunities, Threats (one point per line)
- [x] Recommendation edit: verdict dropdown, headline input, rationale textarea, key conditions textarea
- [x] Save / Cancel buttons replace Edit button while in edit mode
- [x] `saveSwot()` calls `PUT /api/[dealId]/meta` with full updated meta + swot blob
- [x] Emits `meta-updated` event → parent calls `refreshMeta()` so data survives tab switches
- [x] Fix: pass lat/lng in POST body to `/api/[dealId]/proximities/suggest` so auto-suggest works before coordinates are saved
- [x] Fix: add `User-Agent` header to Overpass API requests (was returning 406 without it)
- [x] Fix: add `overpass.kumi.systems` as fallback mirror if primary Overpass endpoint fails

---

### M28 — Supabase RLS + Service Role Key ✅

**Milestone:** Row Level Security enabled on all public Supabase tables. Server uses service role key to bypass RLS safely.

> **Apr 23 2026:** Enabled RLS on all 6 public tables (`access_log`, `deal_activity_log`, `deal_documents`, `deals`, `settings`, `deal_risks`, `deal_meta`). Log tables (access_log, deal_activity_log) allow service role insert only — no direct client read. Data tables allow authenticated read + service role write. Switched `server/utils/supabase.ts` from anon key to service role key so all server-side API routes continue to work. Added `SUPABASE_SERVICE_ROLE_KEY` to `.env` and `nuxt.config.ts` runtimeConfig.

- [x] Enable RLS on `public.access_log` — service role insert only
- [x] Enable RLS on `public.deal_activity_log` — service role insert only
- [x] Enable RLS on `public.deal_documents` — authenticated read, service role write
- [x] Enable RLS on `public.deals` — authenticated read, service role write
- [x] Enable RLS on `public.settings` — authenticated read, service role write
- [x] Enable RLS on `public.deal_risks` — authenticated read, service role write
- [x] Enable RLS on `public.deal_meta` — authenticated read, service role write
- [x] Add `SUPABASE_SERVICE_ROLE_KEY` to `nuxt.config.ts` runtimeConfig (private)
- [x] Update `server/utils/supabase.ts` — prefer service role key over anon key
- [x] Add `SUPABASE_SERVICE_ROLE_KEY` to `.env`

---

## Post-Launch Roadmap

---

### PL-01 — Supabase Auth (per-user) 📋

**Trigger:** Team > 3 people, external lawyers/valuers need access, need deal-specific permissions.

- [ ] Create Supabase project
- [ ] Install `@supabase/supabase-js` and `@nuxtjs/supabase`
- [ ] Migrate `deals.json` to Supabase `deals` table
- [ ] Migrate `meta.json` to Supabase `deal_metadata` table
- [ ] Migrate `risk.json` to Supabase `deal_risks` table
- [ ] Set up Supabase Auth (email/password)
- [ ] Create `deal_access` table: `(user_id, deal_id, role)`
- [ ] Add Row Level Security policies
- [ ] Update all API routes to use Supabase client instead of fs.readFile
- [ ] Invite team members via Supabase Auth
- [ ] Commit: `git commit -m "PL-01: supabase auth"`

---

### PL-02 — Document Comment Threads 📋

**Trigger:** Team needs to annotate documents without emailing.

- [ ] Add `deal_document_comments` table in Supabase: `(id, deal_id, filename, user_id, comment, created_at)`
- [ ] Add comment UI to each document row in DocumentsTab
- [ ] `GET /api/[dealId]/documents/[filename]/comments`
- [ ] `POST /api/[dealId]/documents/[filename]/comments`
- [ ] Real-time comment updates via Supabase Realtime

---

### PL-03 — Email Notifications 📋

**Trigger:** Team wants alerts when new documents are uploaded or milestones change.

- [ ] Integrate Resend or SendGrid
- [ ] Trigger email on document upload: notify all team members with access to that deal
- [ ] Trigger email on milestone status change
- [ ] Unsubscribe link in each email

---

### PL-04 — Risk Register UI Editor 📋

**Trigger:** Non-technical team members need to update risk items without editing JSON.

- [ ] Add "Edit" button to Risk & Legal tab (visible to authorised roles only)
- [ ] Inline edit: click a risk item → title and description become editable fields
- [ ] Add/remove risk items from UI
- [ ] PATCH/DELETE endpoints to update `risk.json` (or Supabase table)

---

### PL-05 — Deal Comparison View 📋

**Trigger:** Board wants to compare multiple deals side-by-side.

- [ ] New page `/compare` — select 2–4 deals from deal list
- [ ] Side-by-side table: GDV / IRR / Land cost / NDP% / Equity required
- [ ] Mini bar chart per metric for visual comparison
- [ ] Export comparison to PDF

---

### PL-06 — Auto-refresh on Excel Change 📋

**Trigger:** Analyst updates the Excel model locally and wants dashboard to reflect changes immediately without manual upload.

- [ ] Server-side file watcher using `chokidar` on `data/[dealId]/financials.xlsx`
- [ ] On file change: invalidate cached parsed JSON, emit event via Supabase Realtime or SSE
- [ ] Client-side: listen for refresh event, re-fetch `/api/[dealId]/financials`
- [ ] Show "Model updated X minutes ago" timestamp in Financials tab header

---

### PL-07 — Print / PDF Export 📋

**Trigger:** Board presentations, external partner sharing.

- [ ] Add "Export to PDF" button in dashboard header
- [ ] Use `window.print()` with print-specific CSS as v1 (quick)
- [ ] v2: Puppeteer server-side rendering for a polished PDF

---

### PL-08 — Persistent Audit Log ✅

**Trigger:** Compliance, tracking who accessed sensitive deal info.

> **Apr 21 2026:** Implemented as two separate Supabase tables. `access_log` tracks all login attempts (label, IP, user-agent, success/fail) — viewable in Settings → Access Log. `deal_activity_log` tracks per-deal document and team actions (upload, delete, status change, team update) — viewable in Deal Team → Document Access Log. Both use session `user.label` as the user identifier.

- [x] Create `access_log` Supabase table — logs every login attempt with IP, browser, label, success
- [x] Create `deal_activity_log` Supabase table — logs per-deal document + team actions
- [x] Login attempt log visible to Admin in Settings → Access Log tab
- [x] Per-deal activity log visible in Deal Team tab → Document Access Log
- [ ] Export logs to CSV — post-launch
