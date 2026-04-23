import ExcelJS from 'exceljs'

export interface FinancialsResult {
  ndv: number; gdv: number; constr: number; ndp: number; ndpMargin: number
  equityRequired: number; landCost: number
  authority: number; siteStaff: number; finance: number; marketing: number
  totalDevCost: number
  blendedPSF: number | null; landPSF: number | null
  baseASP: number; baseAbsorption: number; baseBuildCost: number
  hurdleIRR: number; devPeriodYears: number
  nfa: number; landAcres: number
  source: 'xlsx'
}

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

function cellText(ws: ExcelJS.Worksheet, row: number, col: number): string {
  const v = ws.getRow(row).getCell(col).value
  return typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : ''
}

// Find the first row containing searchText in cols 1-8 (skips footnotes starting with *)
function findRowByLabel(ws: ExcelJS.Worksheet, searchText: string, phaseCol = 9, minVal = 0): number {
  const up = searchText.toUpperCase()
  for (let r = 1; r <= 300; r++) {
    for (let c = 1; c <= 8; c++) {
      const t = cellText(ws, r, c)
      if (t.startsWith('*')) continue
      if (t.toUpperCase().includes(up)) {
        const v = num(ws, r, phaseCol)
        if (v > minVal || (minVal === 0 && v !== 0)) return r
        if (minVal === 0) return r
      }
    }
  }
  return -1
}

// Find a cost section total (sections are numbered 2, 3, 4… in col 1 or 2)
// Scans between fromRow..toRow, skipping sub-sections like "2.1"
function findSection(ws: ExcelJS.Worksheet, sectionNum: number, fromRow: number, toRow: number, phaseCol: number): number {
  const key = String(sectionNum)
  for (let r = fromRow + 1; r < toRow; r++) {
    for (let c = 1; c <= 4; c++) {
      const raw = ws.getRow(r).getCell(c).value
      const s = typeof raw === 'number' ? String(raw) : typeof raw === 'string' ? raw.trim() : ''
      // Must be exact section number or "N | Description" — no decimal sub-sections
      const first = s.split(/[\s.|]/)[0]
      if (first === key && !s.includes('.')) {
        const v = num(ws, r, phaseCol)
        if (v > 1000) return v
      }
    }
  }
  return 0
}

export async function parseFinancials(buffer: Buffer): Promise<FinancialsResult> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)

  const fs  = wb.getWorksheet('Feasibility Study')
  const irr = wb.getWorksheet('IRR & Sensitivity')
  const cf  = wb.getWorksheet('Cashflow')

  if (!fs) throw new Error('Missing "Feasibility Study" sheet')

  // --- Locate NDV row (exact label, no asterisk) and determine phaseCol ---
  let ndvRow = -1
  for (let r = 1; r <= 300 && ndvRow < 0; r++) {
    for (let c = 1; c <= 8; c++) {
      const t = cellText(fs, r, c)
      if (!t.startsWith('*') && t.toUpperCase() === 'NET DEVELOPMENT VALUE (NDV)') {
        ndvRow = r; break
      }
    }
  }
  if (ndvRow < 0) throw new Error('Cannot find NET DEVELOPMENT VALUE (NDV) in Feasibility Study sheet')

  let phaseCol = 9
  for (let c = 9; c <= 53; c += 2) {
    if (num(fs, ndvRow, c) > 0) { phaseCol = c; break }
  }

  const M = 1_000_000

  // --- Core totals via label search ---
  const ndvRaw = num(fs, ndvRow, phaseCol)

  const gdvRow = findRowByLabel(fs, 'GROSS DEVELOPMENT VALUE (GDV)', phaseCol, 0)
  const gdvRaw = gdvRow > 0 ? num(fs, gdvRow, phaseCol) : 0

  // NDP: look for a row with "(NDP) AFTER FINANCIAL CHARGES" that has a money value (> 1)
  let ndpRaw = 0
  for (let r = ndvRow; r <= 300; r++) {
    for (let c = 1; c <= 8; c++) {
      const t = cellText(fs, r, c).toUpperCase()
      if (t.includes('NDP') && t.includes('AFTER FINANCIAL CHARGES')) {
        const v = num(fs, r, phaseCol)
        if (v > 1) { ndpRaw = v; break }
      }
    }
    if (ndpRaw > 0) break
  }
  // Fallback: "Net Development Profit (NDP) =>" style (old template)
  if (ndpRaw === 0) {
    for (let r = 1; r <= ndvRow; r++) {
      for (let c = 1; c <= 8; c++) {
        const t = cellText(fs, r, c).toUpperCase()
        if (t.includes('NET DEVELOPMENT PROFIT') && t.includes('NDP')) {
          const v = num(fs, r, phaseCol)
          if (v > 1) { ndpRaw = v; break }
        }
      }
      if (ndpRaw > 0) break
    }
  }

  // GDC before finance
  const gdcRow = findRowByLabel(fs, 'NET DEVELOPMENT COST (GDC) BEFORE FINANCE CHARGES', phaseCol, 0)
  const gdcBeforeFinance = gdcRow > 0 ? Math.abs(num(fs, gdcRow, phaseCol)) : 0

  // Finance charges (section 11, between GDC and end)
  const gdcAfterRow = findRowByLabel(fs, 'NET DEVELOPMENT COST (GDC) AFTER FINANCIAL CHARGES', phaseCol, 0)
  let financeCharges = 0
  if (gdcAfterRow > 0 && gdcRow > 0) {
    financeCharges = Math.abs(num(fs, gdcAfterRow, phaseCol)) - gdcBeforeFinance
  }
  if (financeCharges <= 0 && gdcRow > 0) {
    financeCharges = findSection(fs, 11, gdcRow, gdcRow + 30, phaseCol)
  }

  // Land (section 2) and Construction/GCC (section 3)
  const landTotal = findSection(fs, 2, ndvRow, gdcRow > 0 ? gdcRow : ndvRow + 150, phaseCol)
  const gcc       = findSection(fs, 3, ndvRow, gdcRow > 0 ? gdcRow : ndvRow + 150, phaseCol)

  // Authority fees (sections 4+5+6 or just 6)
  const sec4 = findSection(fs, 4, ndvRow, gdcRow > 0 ? gdcRow : ndvRow + 150, phaseCol) // strata
  const sec5 = findSection(fs, 5, ndvRow, gdcRow > 0 ? gdcRow : ndvRow + 150, phaseCol) // planning
  const sec6 = findSection(fs, 6, ndvRow, gdcRow > 0 ? gdcRow : ndvRow + 150, phaseCol) // authority contr
  // Consultancy (7), other (8), site admin (9)
  const sec7 = findSection(fs, 7, ndvRow, gdcRow > 0 ? gdcRow : ndvRow + 150, phaseCol)
  const sec8 = findSection(fs, 8, ndvRow, gdcRow > 0 ? gdcRow : ndvRow + 150, phaseCol)
  const sec9 = findSection(fs, 9, ndvRow, gdcRow > 0 ? gdcRow : ndvRow + 150, phaseCol)

  // Blended PSF: ndvRow+3 is "Net Selling Price psf" in all observed template versions
  const blendedPSFRaw = num(fs, ndvRow + 3, phaseCol)

  // Land PSF, NFA, land acres — still at relative positions from NDV row in all templates
  // These shifted along with NDV so offset is stable within each section
  const nfa      = num(fs, ndvRow - 9, phaseCol) || num(fs, 16, phaseCol)
  const landAcres = num(fs, ndvRow - 13, phaseCol) || num(fs, 8, phaseCol)

  // NDP margin — compute directly, don't trust the % cell (often 0 due to formula evaluation)
  const ndpPct = ndvRaw > 0 ? +((ndpRaw / ndvRaw) * 100).toFixed(1) : 0

  // IRR sheet inputs
  const baseASP        = irr ? num(irr, 5, 2) : 680
  const baseAbsorption = irr ? num(irr, 6, 2) : 0.8
  const baseBuildCost  = irr ? num(irr, 7, 2) : 280
  const hurdleIRR      = irr ? num(irr, 8, 2) : 0.16
  const devPeriodYears = cf  ? num(cf,  9, 2) : 5

  const landM         = +(landTotal / M).toFixed(1)
  const constrM       = +(gcc / M).toFixed(1)
  const authorityM    = +((sec4 + sec5 + sec6) / M).toFixed(1)
  const siteStaffM    = +((sec7 + sec8 + sec9) / M).toFixed(1)
  const financeM      = +(financeCharges / M).toFixed(1)
  const totalDevCostM = +((gdcBeforeFinance + financeCharges) / M).toFixed(1)
  const ndvM = +(ndvRaw / M).toFixed(1)
  const gdvM = +(gdvRaw / M).toFixed(1)
  const ndpM = +(ndpRaw / M).toFixed(1)

  if (ndvM === 0 && gdvM === 0) throw new Error('financials.xlsx has no data (template only)')

  return {
    ndv: ndvM, gdv: gdvM, constr: constrM, ndp: ndpM, ndpMargin: ndpPct,
    equityRequired: landM, landCost: landM,
    authority: authorityM, siteStaff: siteStaffM, finance: financeM,
    marketing: 0, totalDevCost: totalDevCostM,
    blendedPSF: blendedPSFRaw > 0 && blendedPSFRaw < 100000 ? +blendedPSFRaw.toFixed(0) : null,
    landPSF: null,
    baseASP: +baseASP.toFixed(0),
    baseAbsorption: +(baseAbsorption * 100).toFixed(0),
    baseBuildCost: +baseBuildCost.toFixed(0),
    hurdleIRR: +(hurdleIRR * 100).toFixed(1),
    devPeriodYears: devPeriodYears > 0 ? devPeriodYears : 5,
    nfa: +nfa.toFixed(0), landAcres: +landAcres.toFixed(3),
    source: 'xlsx',
  }
}
