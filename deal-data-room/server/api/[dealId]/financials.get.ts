import { existsSync } from 'node:fs'
import path from 'node:path'
import ExcelJS from 'exceljs'

export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')
  if (!dealId) throw createError({ statusCode: 400, statusMessage: 'Missing dealId' })

  const config = useRuntimeConfig()
  const xlsxPath = path.join(config.dataDir, dealId, 'financials.xlsx')

  if (!existsSync(xlsxPath)) {
    throw createError({ statusCode: 404, statusMessage: 'No financials.xlsx found for this deal' })
  }

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(xlsxPath)

  // ── Helper: safely read a numeric cell value (handles formula objects with results) ──
  function num(ws: ExcelJS.Worksheet, row: number, col: number): number {
    const cell = ws.getRow(row).getCell(col)
    const v = cell.value
    if (v === null || v === undefined) return 0
    if (typeof v === 'number') return v
    if (typeof v === 'object' && 'result' in (v as any)) {
      const r = (v as any).result
      if (typeof r === 'number') return r
    }
    return 0
  }

  const fs  = wb.getWorksheet('Feasibility Study')
  const irr = wb.getWorksheet('IRR & Sensitivity')
  const cf  = wb.getWorksheet('Cashflow')

  if (!fs) throw createError({ statusCode: 422, statusMessage: 'Missing "Feasibility Study" sheet' })

  // ── Detect the active phase column (first col ≥ 9 that has NDV > 0) ──
  // Summary row 20 = NDV. Phases start at col 9 (Phase 1a/1b), step every 2 cols.
  // Fall back to col 9 if nothing found.
  let phaseCol = 9
  for (let c = 9; c <= 53; c += 2) {
    const v = num(fs, 61, c)  // NDV row
    if (v > 0) { phaseCol = c; break }
  }

  const M = 1_000_000  // divisor for RM millions

  // ── Summary (rows 20–26, phaseCol) ──
  const ndv      = num(fs, 61, phaseCol)          // Net Development Value
  const gdv      = num(fs, 38, phaseCol)          // Gross Development Value
  const ndp      = num(fs, 25, phaseCol)          // Net Development Profit
  const devMgnRaw = num(fs, 26, phaseCol)         // Dev margin fraction (e.g. 0.216)

  // ── Gross Development Cost components (phaseCol) ──
  const landTotal       = Math.abs(num(fs, 69, phaseCol))  // Land + all related
  const gcc             = Math.abs(num(fs, 79, phaseCol))  // Gross Construction Cost
  const strataFees      = Math.abs(num(fs, 103, phaseCol))
  const planningFees    = Math.abs(num(fs, 106, phaseCol))
  const authorityContr  = Math.abs(num(fs, 109, phaseCol))
  const consultancy     = Math.abs(num(fs, 122, phaseCol))
  const otherConstr     = Math.abs(num(fs, 125, phaseCol))
  const siteAdmin       = Math.abs(num(fs, 129, phaseCol))
  const financeCharges  = Math.abs(num(fs, 144, phaseCol))
  const gdcBeforeFinance = Math.abs(num(fs, 137, phaseCol))

  // ── PSF metrics ──
  const blendedPSF = num(fs, 64, phaseCol)   // Net selling price psf
  const landPSF    = num(fs, 71, phaseCol)   // Land cost psf

  // ── Unit / area counts ──
  const nfa        = num(fs, 16, phaseCol)   // Net floor area (sqft)
  const landAcres  = num(fs, 8,  phaseCol)

  // ── IRR & Sensitivity sheet inputs ──
  const baseASP         = irr ? num(irr, 5, 2) : 680
  const baseAbsorption  = irr ? num(irr, 6, 2) : 0.8    // fraction
  const baseBuildCost   = irr ? num(irr, 7, 2) : 280
  const hurdleIRR       = irr ? num(irr, 8, 2) : 0.16   // fraction (target IRR)

  // ── Cashflow sheet ──
  const devPeriodYears = cf ? num(cf, 9, 2) : 5

  // ── Aggregate cost categories (in RM M, 1 decimal) ──
  const landM         = +(landTotal / M).toFixed(1)
  const constrM       = +(gcc / M).toFixed(1)
  const authorityM    = +((authorityContr + strataFees + planningFees) / M).toFixed(1)
  const siteStaffM    = +((consultancy + siteAdmin + otherConstr) / M).toFixed(1)
  const financeM      = +(financeCharges / M).toFixed(1)
  const marketingM    = 0   // Marketing/selling discounts sit on GDV side, not GDC
  const totalDevCostM = +(( gdcBeforeFinance + financeCharges) / M).toFixed(1)

  const ndvM    = +(ndv / M).toFixed(1)
  const gdvM    = +(gdv / M).toFixed(1)
  const ndpM    = +(ndp / M).toFixed(1)
  const ndpPct  = +((devMgnRaw > 0 ? devMgnRaw : (ndvM > 0 ? ndpM / ndvM : 0)) * 100).toFixed(1)

  // Guard: reject blank/template files that have no meaningful data
  if (ndvM === 0 && gdvM === 0) {
    throw createError({ statusCode: 404, statusMessage: 'financials.xlsx has no data (template only)' })
  }

  return {
    // KPI cards
    ndv:            ndvM,
    gdv:            gdvM,
    constr:         constrM,
    ndp:            ndpM,
    ndpMargin:      ndpPct,
    equityRequired: landM,   // land + all related costs = upfront equity proxy
    landCost:       landM,

    // Cost breakdown (for doughnut chart)
    authority:    authorityM,
    siteStaff:    siteStaffM,
    finance:      financeM,
    marketing:    marketingM,
    totalDevCost: totalDevCostM,

    // PSF metrics
    blendedPSF:   blendedPSF > 0 ? +blendedPSF.toFixed(0) : null,
    landPSF:      landPSF   > 0 ? +landPSF.toFixed(0)   : null,

    // Assumptions (used by sensitivity table + overview)
    baseASP:          +baseASP.toFixed(0),
    baseAbsorption:   +(baseAbsorption * 100).toFixed(0),  // convert to %
    baseBuildCost:    +baseBuildCost.toFixed(0),
    hurdleIRR:        +(hurdleIRR * 100).toFixed(1),       // convert to %
    devPeriodYears:   devPeriodYears > 0 ? devPeriodYears : 5,

    // Raw area data
    nfa:       +nfa.toFixed(0),
    landAcres: +landAcres.toFixed(3),

    // Source flag
    source: 'xlsx',
  }
})
