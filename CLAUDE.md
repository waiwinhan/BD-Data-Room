# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

BRDB Deal Data Room — a Nuxt 3 internal dashboard for property deal due diligence. Each deal gets a live interactive dashboard (Overview, Documents, Financials, Risk & Legal, Deal Team tabs) powered by local JSON data and Excel feasibility models.

## Commands

All commands run from `deal-data-room/`:

```bash
export PATH="/usr/local/bin:$PATH"   # Node is at /usr/local/bin, not in default PATH

npm run dev        # Dev server at http://localhost:3000
npm run build      # Production build
npm run preview    # Preview production build
```

## Architecture

### File layout
```
deal-data-room/
  app/
    pages/
      index.vue           # Deal list page
      [dealId]/index.vue  # 5-tab deal dashboard
    components/
      DealCard.vue         # Card on deal list
      FilterBar.vue        # Stage pills + search
      PortfolioSummary.vue # 4 KPI strip on list page
      OverviewTab.vue      # Tab 1 (KPIs, map, milestones, dev mix)
      DocumentsTab.vue     # Tab 2
      FinancialsTab.vue    # Tab 3 (charts, sensitivity table)
      RiskTab.vue          # Tab 4
      TeamTab.vue          # Tab 5
    layouts/
      default.vue          # Topbar + NDA banner wrapper
  server/api/
    deals.get.ts           # GET /api/deals → reads data/deals.json
    [dealId]/meta.get.ts   # GET /api/:dealId/meta → reads data/:dealId/meta.json
    [dealId]/meta.put.ts   # PUT /api/:dealId/meta
    [dealId]/deal.put.ts   # PUT /api/:dealId/deal (updates deals.json entry)
  nuxt.config.ts
  data/                    # Filesystem data store (NOT served publicly)
    deals.json             # Master deal list (array of deal objects)
    [dealId]/
      meta.json            # Deal metadata, milestones, dev mix, team, legal
      risk.json            # Risk register array
      financials.xlsx      # BRDB Excel feasibility model (source of truth for financials)
      docs/                # Uploaded PDFs/XLS with sidecar .meta.json files
```

### Data flow
- `data/deals.json` drives the deal list page. Key fields: `id`, `name`, `ref`, `location`, `stage`, `gdv`, `irr`, `hurdleRate`, `landAcres`, `tenure`, `ddProgress`, `updatedAt`, `stageNote`.
- `data/[dealId]/meta.json` drives the dashboard tabs. Contains `proximities`, `milestones`, `devMix`, `assumptions`, `legalStatus`, `team`.
- `data/[dealId]/risk.json` is an array of risk items with `severity` (red/amber/green).
- `nuxt.config.ts` sets `runtimeConfig.dataDir` to the absolute path of `data/` so server routes can read files correctly.

### Excel model contract (M05 — not yet implemented)
When `data/[dealId]/financials.xlsx` is present, the parser (`server/utils/parseExcel.ts`) reads:
- `Summary` sheet — named ranges: `GDV_Total`, `LandCost_Total`, `DevCost_Total`, `IRR_Base`, `DevMargin_Pct`, `EquityRequired`, `BlendedPSF`, `LandPSF`
- `Cashflow` sheet — Y1–Y5 rows, 3 columns (inflow, outflow, net)
- `CostBreakdown` sheet — Land / Construction / SGA / Finance cost categories
- `Sensitivity` sheet — IRR matrix: absorption % rows × ASP psf columns
- `Assumptions` sheet — plot ratio, build cost psf, absorption %, dev period

### Auth (M11 — not yet implemented)
v1 plan: single shared password from `.env` (`DEAL_PASSWORD=brdb2024`) validated by server middleware, session stored via `nuxt-auth-utils`. Login page at `/login`.

### Stage vocabulary
Deal stages used in `deals.json` and filter pills: `Active DD`, `KIV`, `Approved`, `Rejected`. (Earlier prototype used `Under Review`, `Signed`, `On Hold` — now superseded.)

## Key reference files
- `deal-data-room-plan.md` — full technical spec, Excel contract, API shapes
- `deal-data-room-PROGRESS_PLAN.md` — phase checklist and module status
- `deal-data-room-list.html` — visual spec for deal list page
- `deal-data-room-prototype.html` — visual spec for 5-tab dashboard
- `BRDB_Feasibility_Study_Template.xlsx` — sample Excel model
