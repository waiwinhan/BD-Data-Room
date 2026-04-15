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
| M05 | Excel Parser (ExcelJS) | 2 | ⏳ | Day 2–3 |
| M06 | Financials Tab | 2 | ✅ | Day 3 |
| M07 | Documents Tab | 3 | ✅ | Day 4 |
| M08 | Document Upload | 3 | ✅ | Day 4 |
| M09 | Risk & Legal Tab | 3 | ✅ | Day 4–5 |
| M10 | Deal Team Tab | 3 | ✅ | Day 5 |
| M11 | Auth — NDA Password Gate | 4 | ✅ | Day 5–6 |
| M12 | Multi-Deal Routing | 4 | ✅ | Day 6 |
| M13 | Deployment (Railway / Vercel) | 4 | ⏳ | Day 6–7 |
| M14 | Excel — BRDB Model Wiring | 2 | ⏳ | Day 3 |
| M15 | Sensitivity Table | 2 | ✅ | Day 3 |
| PL-01 | Supabase Auth (per-user) | Post | 📋 | Post-launch |
| PL-02 | Document Comment Threads | Post | 📋 | Post-launch |
| PL-03 | Email Notifications | Post | 📋 | Post-launch |
| PL-04 | Risk Register UI Editor | Post | 📋 | Post-launch |
| PL-05 | Deal Comparison View | Post | 📋 | Post-launch |
| PL-06 | Auto-refresh on Excel Change | Post | 📋 | Post-launch |
| PL-07 | Print / PDF Export | Post | 📋 | Post-launch |
| PL-08 | Persistent Audit Log | Post | 📋 | Post-launch |

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

### M05 — Excel Parser (ExcelJS) ⏳

**Milestone:** `GET /api/[dealId]/financials` returns correct JSON from the real Excel file.

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

### M14 — Excel Model Wiring (BRDB-specific) ⏳

**Milestone:** Real BRDB feasibility model numbers appear correctly in the dashboard.

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

### M13 — Deployment (Netlify) ⏳

**Milestone:** App is running on a private HTTPS Netlify URL. Shareable with BRDB teammates.

> **Platform chosen: Netlify** — supports Nuxt 3 SSR via Netlify Functions, free tier available, connects directly to GitHub for auto-deploy on every push.

**Step 1 — Prepare Nuxt for Netlify**
- [ ] Install Netlify adapter: `npm install -D @netlify/nuxt`
- [ ] Add `@netlify/nuxt` to modules in `nuxt.config.ts`
- [ ] Ensure SSR stays on (do NOT add `ssr: false`) — server API routes require it

**Step 2 — Connect GitHub to Netlify**
- [ ] Log in to [app.netlify.com](https://app.netlify.com)
- [ ] Click **Add new site → Import an existing project → GitHub**
- [ ] Select repo: `waiwinhan/BD-Data-Room`
- [ ] Set **Base directory**: `deal-data-room`
- [ ] Set **Build command**: `npm run build`
- [ ] Set **Publish directory**: `deal-data-room/.output/public`

**Step 3 — Set Environment Variables in Netlify Dashboard**
- [ ] Site settings → Environment variables → Add:
  - `DEAL_PASSWORD` = strong password (change from `brdb2024` before sharing)
  - `NUXT_SESSION_PASSWORD` = random 32+ character string
  - `ANTHROPIC_API_KEY` = your Claude API key

**Step 4 — Deploy & Test**
- [ ] Trigger first deploy from Netlify dashboard
- [ ] Visit the Netlify URL (e.g. `https://brdb-data-room.netlify.app`)
- [ ] Test: unauthenticated visit redirects to `/login`
- [ ] Test: correct password grants access
- [ ] Test: all 5 deals load with correct data
- [ ] Test: Documents, Financials, Risk & Legal, Deal Team tabs all work

**Data persistence note**
- Netlify has an ephemeral filesystem — uploaded documents will NOT persist across redeploys
- For v1: `data/` folder is committed to git — all seed data is version-controlled and safe
- For v2 (post-launch): migrate file uploads to Supabase Storage or Netlify Blobs

- [ ] Share Netlify URL + password with BRDB team
- [ ] Commit: `git commit -m "M13: deployed to Netlify"`

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

### PL-08 — Persistent Audit Log 📋

**Trigger:** Compliance, tracking who accessed sensitive deal info.

- [ ] Create `deal_access_log` Supabase table: `(deal_id, user_id, action, resource, timestamp, ip)`
- [ ] Log on: deal viewed, document opened, Excel model downloaded, login
- [ ] Admin view: filterable access log per deal
- [ ] Export access log to CSV for compliance reporting
