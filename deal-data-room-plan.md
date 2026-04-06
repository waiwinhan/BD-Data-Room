# Deal Data Room — Vibe Coding Plan
*BRDB Property Development · Wai Win Han · April 2026*

---

## 1. Project Overview

A private, password-gated web dashboard for managing and presenting property deal due diligence to internal teams and partners. Each deal gets its own dashboard URL with five tabs: Overview, Documents, Financials, Risk & Legal, and Deal Team. Financial data lives in the BRDB Excel feasibility model and is parsed automatically into the dashboard via ExcelJS.

### Core goals
- Replace static PDF decks with a live, interactive data room per deal
- Parse the BRDB `.xlsx` feasibility model and display KPIs, charts, sensitivity tables in real-time
- Manage deal documents (PDFs, title searches, valuations, term sheets) with status tracking
- Gate access behind a shared password (NDA wall) for v1; per-user roles for v2
- Shareable private URL — send to teammates via WhatsApp, no IT setup needed

### What this is NOT
- Not a CRM or deal pipeline tracker
- Not a replacement for Excel — Excel stays the source of truth for financials
- Not a public-facing product

---

## 2. Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | **Nuxt.js 3** (Vue 3) | Full-stack in one repo. File-based routing. Nitro server handles Excel API. Fast to vibe code. |
| Styling | **Tailwind CSS** | Utility classes — no CSS files, fast to iterate |
| Charts | **Chart.js** via `vue-chartjs` | Bar, doughnut, line charts in Financials tab |
| Maps | **Google Maps Embed API** | Site location iframe in Overview tab |
| Excel parsing | **ExcelJS** | Reads `.xlsx` server-side, outputs JSON to frontend |
| File uploads | **Nuxt built-in** (formidable) | Handles `.xlsx` and PDF uploads via multipart form |
| Auth v1 | **nuxt-auth-utils** + `.env` | Single shared password — no DB needed |
| Auth v2 | **Supabase Auth** | Per-user login with deal-scoped roles (post-launch) |
| Storage v1 | **Local filesystem** | All data in `/data` folder |
| Storage v2 | **Supabase Storage + DB** | When team > 3 people or 5+ deals |
| Deployment v1 | **Local** (`npx nuxi dev`) | Laptop + ngrok tunnel for sharing |
| Deployment v2 | **Railway** or **Vercel** | One-click deploy, private HTTPS URL |

---

## 3. Data Architecture

### v1 — Filesystem (no database)

```
deal-data-room/
├── data/
│   ├── deals.json                  ← master list of all deals
│   └── [dealId]/
│       ├── meta.json               ← name, location, stage, team, DD milestones
│       ├── financials.xlsx         ← BRDB Excel model (upload to replace)
│       ├── risk.json               ← risk register items
│       └── docs/
│           ├── loi.pdf
│           ├── loi.meta.json       ← status, uploader, date
│           ├── valuation.pdf
│           └── valuation.meta.json
```

### `deals.json` schema
```json
[
  {
    "id": "jb-2026-04",
    "name": "Permas Jaya Land Acquisition",
    "ref": "JB-2026-04",
    "location": "PTD 220475, Mukim Plentong, Johor Bahru",
    "stage": "Active DD",
    "stageColor": "green",
    "restricted": true,
    "landAcres": 5.55,
    "tenure": "Freehold",
    "gdvRM": 280000000,
    "gdvPSF": 680,
    "irr": 0.184,
    "irrHurdle": 0.16,
    "ddProgressPct": 40,
    "ddNote": "4 docs pending",
    "lastUpdated": "2026-04-06",
    "lat": 1.5023,
    "lng": 103.8223
  }
]
```

### `meta.json` schema (per deal)
```json
{
  "name": "Permas Jaya Land Acquisition",
  "subtitle": "PTD 220475, Mukim Plentong, Johor Bahru",
  "landAcres": 5.55,
  "tenure": "Freehold",
  "lat": 1.5023,
  "lng": 103.8223,
  "milestones": [
    { "label": "LOI executed", "date": "10 Mar 2026", "status": "done" },
    { "label": "Title search", "date": "18 Mar 2026", "status": "done" },
    { "label": "Legal due diligence", "date": "Target 15 Apr 2026", "status": "active" },
    { "label": "Financial feasibility sign-off", "date": "Target 20 Apr 2026", "status": "active" },
    { "label": "Board approval", "date": "Est. May 2026", "status": "pending" },
    { "label": "SPA execution", "date": "Est. Jun 2026", "status": "pending" }
  ],
  "devMix": [
    { "label": "Serviced apartments (600–900 sf)", "pct": 55, "color": "#5DCAA5" },
    { "label": "SoHo / SOFO units", "pct": 25, "color": "#85B7EB" },
    { "label": "Retail podium", "pct": 12, "color": "#FAC775" },
    { "label": "Car park / facilities", "pct": 8, "color": "#D3D1C7" }
  ],
  "assumptions": {
    "plotRatio": "1:6.0",
    "buildCostPsf": "RM 280",
    "absorptionRate": "80% / yr",
    "devPeriod": "4 years"
  },
  "proximities": [
    { "label": "CIQ / Customs checkpoint", "distance": "~8 km", "color": "#378ADD" },
    { "label": "Iskandar Puteri (Medini)", "distance": "~18 km", "color": "#5DCAA5" },
    { "label": "JS-SEZ core zone", "distance": "~12 km", "color": "#EF9F27" },
    { "label": "Nearest LRT (planned)", "distance": "~2.1 km", "color": "#7F77DD" }
  ],
  "team": {
    "internal": [
      { "name": "Wai Win Han", "role": "Business Development", "label": "Deal lead", "initials": "WH" },
      { "name": "Rebecca Lim", "role": "Corporate Finance", "label": "Financial modelling", "initials": "RL" },
      { "name": "Ahmad Kamil", "role": "Legal & Compliance", "label": "Legal review", "initials": "AK" },
      { "name": "Siti Tan", "role": "Project Development", "label": "Technical due diligence", "initials": "ST" }
    ],
    "external": [
      { "name": "Messrs. Zaid Ibrahim", "role": "Legal counsel", "label": "Vendor side", "initials": "ZI" },
      { "name": "Knight Frank MY", "role": "Valuation", "label": "Independent valuer", "initials": "KW" },
      { "name": "EdgeProp Analytics", "role": "Market data", "label": "Comparables", "initials": "EP" },
      { "name": "Geotech Env. Sdn Bhd", "role": "Soil investigation", "label": "Engaged — pending", "initials": "GE" }
    ]
  }
}
```

### `risk.json` schema (per deal)
```json
[
  { "title": "Zoning conversion approval delay", "severity": "high", "desc": "Current zoning permits commercial; residential conversion requires MBJB approval — typical 6–18 month timeline." },
  { "title": "Bumiputera quota compliance", "severity": "high", "desc": "Johor requirement may reduce effective sellable GDV by 8–12% if discounting applies." },
  { "title": "Construction cost escalation", "severity": "med", "desc": "Base build cost assumed RM 280 psf. Steel & labour inflation risk ±10%." },
  { "title": "JS-SEZ absorption uncertainty", "severity": "med", "desc": "Demand thesis partly anchored to Johor-Singapore SEZ spillover." },
  { "title": "Title caveat (resolved)", "severity": "low", "desc": "Caveat by financier — confirmed discharged 18 Mar 2026 per Registry search." }
]
```

---

## 4. Excel Model — Sheet Structure & Parser Contract

The BRDB Excel model is the **source of truth for all financial data**. The dashboard reads it via ExcelJS — it does NOT write back to it.

### Required sheet names (parser looks for these exactly)

| Sheet name | Contents | Dashboard section |
|-----------|---------|------------------|
| `Summary` | Named ranges for all KPIs | Overview + Financials KPI cards |
| `Cashflow` | Year-by-year inflows/outflows | Cashflow bar chart |
| `CostBreakdown` | Land, construction, SGA, finance cost | Cost doughnut chart |
| `Sensitivity` | IRR matrix (absorption % vs ASP psf) | Sensitivity table |
| `Assumptions` | Plot ratio, build cost psf, absorption, dev period | Key assumptions panel |

### Named ranges in `Summary` sheet (ExcelJS reads these by name)

| Named range | Example value | Dashboard use |
|------------|--------------|---------------|
| `GDV_Total` | 280000000 | Overview KPI |
| `LandCost_Total` | 38000000 | Cost chart + KPI |
| `DevCost_Total` | 198000000 | Overview KPI |
| `IRR_Base` | 0.184 | Overview KPI (display as 18.4%) |
| `DevMargin_Pct` | 0.293 | Overview KPI (display as 29.3%) |
| `EquityRequired` | 52000000 | Overview KPI |
| `BlendedPSF` | 680 | Sub-label |
| `LandPSF` | 157 | Sub-label |

### Cashflow sheet layout (`Cashflow!A1:C6`)
```
Year  | Inflows (RM M) | Outflows (RM M)
Y1    | 0              | -58
Y2    | 42             | -72
Y3    | 88             | -55
Y4    | 96             | -28
Y5    | 54             | -10
```

### CostBreakdown sheet layout (`CostBreakdown!A1:B5`)
```
Category      | RM M
Land          | 38
Construction  | 118
SGA           | 22
Finance cost  | 20
```

### Sensitivity sheet layout (`Sensitivity!A1:F6`)
```
            | RM 620 | RM 650 | RM 680 | RM 710 | RM 740
60% abs.    | ...    | ...    | ...    | ...    | ...
70% abs.    | ...    | ...    | ...    | ...    | ...
80% abs.    | ...    | ...    | 18.4%★ | ...    | ...
90% abs.    | ...    | ...    | ...    | ...    | ...
100% abs.   | ...    | ...    | ...    | ...    | ...
```
(★ = base case, highlighted green)

### Document sidecar `.meta.json` schema
```json
{
  "originalName": "LOI — Compadu Sdn Bhd",
  "category": "legal",
  "status": "reviewed",
  "uploader": "Wai Win Han",
  "uploadDate": "2026-03-10",
  "sizeMB": 2.1
}
```

---

## 5. Project Folder Structure

```
deal-data-room/
├── pages/
│   ├── index.vue                   ← Deal list (all active deals)
│   └── [dealId]/
│       └── index.vue               ← Dashboard for one deal (5 tabs)
├── components/
│   ├── DealCard.vue                ← Card on the deal list page (colour bar, KPI grid, DD progress bar, footer)
│   ├── PortfolioSummary.vue        ← 4-card summary strip above the deal grid
│   ├── FilterBar.vue               ← Stage filter pills + search input
│   ├── OverviewTab.vue             ← KPIs, map, milestones, dev mix
│   ├── DocumentsTab.vue            ← File index with status badges
│   ├── FinancialsTab.vue           ← Charts + sensitivity table
│   ├── RiskTab.vue                 ← Risk register + legal status
│   └── TeamTab.vue                 ← Team cards + access log
├── server/
│   └── api/
│       ├── deals.get.ts            ← Returns deals.json list
│       └── [dealId]/
│           ├── meta.get.ts         ← Serves meta.json
│           ├── financials.get.ts   ← Parses .xlsx → JSON (ExcelJS)
│           ├── documents.get.ts    ← Lists /docs/ folder + sidecar
│           └── upload.post.ts      ← Handles .xlsx and PDF upload
├── middleware/
│   └── auth.ts                     ← NDA / password gate
├── data/
│   ├── deals.json
│   └── [dealId]/
│       ├── meta.json
│       ├── financials.xlsx
│       ├── risk.json
│       └── docs/
├── public/
│   └── logo.png
├── .env                            ← NUXT_SESSION_PASSWORD, DEAL_PASSWORD
└── nuxt.config.ts
```

---

## 6. Server API Endpoints

### `GET /api/deals`
Returns the full `deals.json` array. Powers the deal list page and portfolio summary strip.

Also computes and returns aggregate portfolio stats:
```json
{
  "deals": [...],
  "portfolio": {
    "totalGDV": 1240000000,
    "avgIRR": 0.178,
    "totalLandAcres": 48.3,
    "pendingBoardCount": 2
  }
}
```

### `GET /api/[dealId]/meta`
Returns `data/[dealId]/meta.json`. Powers Overview tab KPI cards, milestones, dev mix, map, team.

### `GET /api/[dealId]/financials`
Parses `data/[dealId]/financials.xlsx` via ExcelJS:
1. Read named ranges from `Summary` sheet → KPI object
2. Read `Cashflow!A1:C6` → cashflow array
3. Read `CostBreakdown!A1:B5` → cost breakdown array
4. Read `Sensitivity!A1:F6` → 2D IRR matrix
5. Return combined JSON response

```typescript
// server/api/[dealId]/financials.get.ts
import ExcelJS from 'exceljs'
import { readFile } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const dealId = event.context.params?.dealId
  const filePath = join(process.cwd(), 'data', dealId, 'financials.xlsx')
  
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(filePath)
  
  // Helper: get named range value
  const getNamed = (name: string) => {
    const def = wb.definedNames.getNames()
    // ... resolve to cell value
  }
  
  const summary = {
    gdvTotal: getNamed('GDV_Total'),
    landCost: getNamed('LandCost_Total'),
    devCost: getNamed('DevCost_Total'),
    irr: getNamed('IRR_Base'),
    margin: getNamed('DevMargin_Pct'),
    equity: getNamed('EquityRequired'),
    blendedPSF: getNamed('BlendedPSF'),
    landPSF: getNamed('LandPSF'),
  }
  
  // Read cashflow sheet
  const cfSheet = wb.getWorksheet('Cashflow')
  const cashflow = []
  cfSheet.eachRow((row, i) => {
    if (i === 1) return // skip header
    cashflow.push({ year: row.getCell(1).value, inflow: row.getCell(2).value, outflow: row.getCell(3).value })
  })
  
  // ... similarly for CostBreakdown and Sensitivity
  
  return { summary, cashflow, costBreakdown, sensitivity }
})
```

### `GET /api/[dealId]/documents`
Scans `data/[dealId]/docs/` directory. For each non-`.meta.json` file, reads its sidecar `.meta.json`. Returns array of document objects.

### `POST /api/[dealId]/upload`
Accepts multipart form. If file is `.xlsx` → replaces `financials.xlsx`. If PDF/DOC → saves to `docs/` with sidecar `.meta.json` created.

---

## 7. Pages & Components

### 7.1 Deal List Page (`/`)

**Header (topbar)**
- BRDB logo mark + "Deal Data Room" title + org subtitle
- Right: Settings button, Logout button, "+ New Deal" button

**NDA banner strip** (amber, persistent across all pages)

**Page header**
- "Active Deals" title + subtitle
- No date — page is always current

**Filter bar**
- Filter pills: All (count) | Active DD | Under Review | Signed | On Hold
- Active pill: dark fill. Inactive: border only
- Search box (right-aligned) — live filters cards by deal name/location text

**Portfolio summary strip** (4 cards above the deal grid)
- Total Pipeline GDV (sum across all deals)
- Avg. Projected IRR
- Total Land Area (acres)
- Pending Board Sign-off (count)

**Deal grid** (`auto-fill`, min 360px per card)
- Each `DealCard.vue` has:
  - **Colour accent bar** at top (3px) — gradient per stage: green=Active DD, blue=new DD, amber=Under Review, purple=Signed, grey=On Hold
  - Deal name + reference number (mono font)
  - Stage badges (Restricted + stage)
  - Location line with pin icon
  - **3-KPI mini grid** (bordered): GDV | IRR (with ± vs hurdle sub-label) | Land area + tenure
  - **DD progress bar** — label "DD Progress" + % value + coloured fill bar
  - **Card footer**: status dot + stage note + last updated date
- Hover: card lifts (`translateY(-2px)`) with stronger shadow
- Staggered fade-up animation on page load (80ms delay between cards)
- Cards link to `/[dealId]` dashboard on click

**Deal stages & colours**
| Stage | Bar colour | Badge colour |
|-------|-----------|-------------|
| Active DD | Green gradient | Green |
| Under Review | Amber gradient | Amber |
| Signed | Purple gradient | Purple |
| On Hold | Grey gradient | Grey |

**"+ Add new deal" card** — dashed border, centres a + icon and "Add new deal" label. Hover fills white. Links to new deal form (Phase 4).

**Prototype reference:** `deal-data-room-list.html`

### 7.2 Deal Dashboard (`/[dealId]`)

Five-tab layout. Tab bar sticks to top. Each tab is a separate Vue component.

#### Tab 1 — Overview

Three-column grid:
- **Left**: Site location card with Google Maps embed iframe, coordinate pills, key proximities list
- **Centre**: DD milestones tracker (done/active/pending dots + dates)
- **Right**: Development mix progress bars + key assumptions grid (plot ratio, build cost psf, absorption rate, dev period)

Top: 4 KPI cards — Land area, Est. GDV, Land cost (psf sub-label), Proj. IRR (threshold sub-label)

#### Tab 2 — Documents

Two-column grid: Legal documents | Financial & technical
Each document row: file type badge (PDF/XLS/DOC/IMG) + name + upload meta + status badge (New/Reviewed/Pending)
Clicking a document opens/downloads the file.
Upload button: opens file picker → POST to `/api/[dealId]/upload`

#### Tab 3 — Financials

Top: 4 KPI cards — Total dev cost, GDV, Dev margin %, Equity required
Two charts side by side:
- Left: Cost breakdown doughnut (Land / Construction / SGA / Finance cost)
- Right: Projected cashflow bar (Y1–Y5, green inflows / coral outflows)

Below: Sensitivity table — IRR % across ASP psf (cols) × absorption rate (rows). Base case cell highlighted green. Cells below hurdle rate in red, above in green.

#### Tab 4 — Risk & Legal

Two-column grid:
- Left: Risk register — colour-coded dots (red/amber/green) + title + description
- Right: Legal status table — title type, encumbrance, current zoning, required rezoning, bumi quota, legal counsel

#### Tab 5 — Deal Team

Two-column grid: BRDB deal team | External advisors
Each person: initials avatar (coloured) + name + role + label
Below: Document access log — who viewed/uploaded what + timestamp

---

## 8. Authentication

### v1 — Shared password (no database)
```typescript
// .env
NUXT_SESSION_PASSWORD=your-32-char-secret-here
DEAL_PASSWORD=brdbdataroom2026

// middleware/auth.ts
export default defineNuxtRouteMiddleware(async () => {
  const session = await useUserSession()
  if (!session.user) {
    return navigateTo('/login')
  }
})

// pages/login.vue
// POST password to /api/auth/login → set session → redirect to /
```

### v2 — Supabase Auth (per-user, deal-scoped)
Migrate when: team > 3 people, external partners need access, need per-deal access control.

---

## 9. Vibe Coding Tips

1. **One feature per session** — "Add the cashflow chart to FinancialsTab" not "build the whole financials tab"
2. **Always paste current component code** into the prompt — don't ask Claude to guess
3. **Copy the prototype design** — the HTML/CSS from the claude.ai artifact is the design spec
4. **Keep Excel sheet names stable** — the parser breaks if sheets are renamed after Phase 2
5. **Test ExcelJS locally first** — write `node parse-excel.js` standalone before wiring into Nuxt
6. **Don't over-engineer auth in v1** — one shared password in `.env` is enough for 2–5 people
7. **Commit after each phase** — `git commit -m "phase 2: excel integration working"` for easy rollback
8. **Use `vue-chartjs` wrappers** — don't write raw Chart.js, use the Vue component wrappers
9. **Named ranges over cell addresses** — if named ranges exist in Excel, prefer them so layout changes don't break the parser

---

## 10. Database Migration Path

Start with the filesystem. Migrate to Supabase when these triggers hit:

| Trigger | What to add | Effort |
|---------|------------|--------|
| 5+ deals, JSON files hard to manage | Supabase Postgres — deals + metadata table | Half a day |
| Team > 3 people, need per-user roles | Supabase Auth with Row Level Security | 1 day |
| Documents shared across multiple devices | Supabase Storage (replaces /data/docs/) | Half a day |
| Real-time collaboration (comments, edits) | Supabase Realtime subscriptions | 1–2 days |
| External partners need access | Invite-only Supabase accounts with deal-scoped roles | 1 day |

**Do NOT set up Supabase on day one.** Get the dashboard working first.

---

## 11. First Commands to Run

```bash
# 1. Create the Nuxt project
npx nuxi@latest init deal-data-room
cd deal-data-room

# 2. Install all dependencies
npm install @nuxtjs/tailwindcss vue-chartjs chart.js exceljs
npm install nuxt-auth-utils

# 3. Add modules to nuxt.config.ts
# modules: ['@nuxtjs/tailwindcss', 'nuxt-auth-utils']

# 4. Create data folder structure
mkdir -p data/jb-2026-04/docs
touch data/deals.json
touch data/jb-2026-04/meta.json
touch data/jb-2026-04/risk.json
cp /path/to/brdb-model.xlsx data/jb-2026-04/financials.xlsx

# 5. Set environment variables
echo "NUXT_SESSION_PASSWORD=your-32-char-secret-here" >> .env
echo "DEAL_PASSWORD=brdbdataroom2026" >> .env

# 6. Start dev server
npm run dev
# → opens at http://localhost:3000
```

---

## 12. Post-Launch Roadmap

| # | Feature | Priority |
|---|---------|---------|
| PL-01 | Per-user login (Supabase Auth) with deal access control | High |
| PL-02 | Document comment threads (per file) | Medium |
| PL-03 | Email notifications on new document upload | Medium |
| PL-04 | Risk register in-UI editor (no JSON editing) | Low |
| PL-05 | Deal comparison view (side-by-side IRR/GDV across deals) | Low |
| PL-06 | Auto-refresh when Excel file changes (server-side file watcher) | Low |
| PL-07 | Print / export to PDF button for board presentations | Medium |
| PL-08 | Audit log — persistent access log per deal | Medium |

---

## 13. Prototype Reference Files

Both prototype HTML files serve as the **visual spec** for vibe coding. When prompting Claude Code, paste the relevant section of the prototype as a design reference.

| File | Purpose |
|------|---------|
| `deal-data-room-list.html` | Deal list page — topbar, NDA strip, filter bar, portfolio summary strip, deal grid with 5 deal cards |
| `deal-data-room-prototype.html` | Deal dashboard — 5-tab layout (Overview, Documents, Financials, Risk & Legal, Deal Team) |

**How to use them when vibe coding:**
1. Open the HTML file in browser to see the design
2. Copy the relevant section (e.g. the DealCard HTML+CSS) into your Claude Code prompt
3. Ask: *"Convert this HTML/CSS to a Vue 3 component using Tailwind CSS. The data comes from props: `{ name, ref, location, stage, gdvRM, irr, irrHurdle, landAcres, tenure, ddProgressPct, ddNote, lastUpdated }`"*

| # | Feature | Priority |
|---|---------|---------|
| PL-01 | Per-user login (Supabase Auth) with deal access control | High |
| PL-02 | Document comment threads (per file) | Medium |
| PL-03 | Email notifications on new document upload | Medium |
| PL-04 | Risk register in-UI editor (no JSON editing) | Low |
| PL-05 | Deal comparison view (side-by-side IRR/GDV across deals) | Low |
| PL-06 | Auto-refresh when Excel file changes (server-side file watcher) | Low |
| PL-07 | Print / export to PDF button for board presentations | Medium |
| PL-08 | Audit log — persistent access log per deal | Medium |
