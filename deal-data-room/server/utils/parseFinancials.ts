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

export async function parseFinancials(buffer: Buffer): Promise<FinancialsResult> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)

  const fs  = wb.getWorksheet('Feasibility Study')
  const irr = wb.getWorksheet('IRR & Sensitivity')
  const cf  = wb.getWorksheet('Cashflow')

  if (!fs) throw new Error('Missing "Feasibility Study" sheet')

  // NDV can be at row 61 (old template) or row 60 (newer template variant)
  let phaseCol = 9
  for (let c = 9; c <= 53; c += 2) {
    if (num(fs, 61, c) > 0 || num(fs, 60, c) > 0) { phaseCol = c; break }
  }

  // Detect template version: old template has NDV label at row 61 col 1;
  // new multi-phase template (2025+) shifted NDP to row 159, land to 68, construction to 78, etc.
  const row61Label = fs.getRow(61).getCell(1).value
  const isNew = typeof row61Label !== 'string' || !(row61Label as string).includes('NET DEVELOPMENT VALUE')

  const M = 1_000_000

  const ndvRaw        = num(fs, 61, phaseCol) || num(fs, 60, phaseCol)
  const gdvRaw        = num(fs, 38, phaseCol)
  const ndpRaw        = isNew ? num(fs, 159, phaseCol) : num(fs, 25, phaseCol)
  const devMgnRaw     = isNew ? num(fs, 160, phaseCol) : num(fs, 26, phaseCol)
  const landTotal     = Math.abs(isNew ? num(fs, 68, phaseCol) : num(fs, 69, phaseCol))
  const gcc           = Math.abs(isNew ? num(fs, 78,  phaseCol) : num(fs, 79,  phaseCol))
  const strataFees    = Math.abs(isNew ? num(fs, 111, phaseCol) : num(fs, 103, phaseCol))
  const planningFees  = Math.abs(isNew ? num(fs, 114, phaseCol) : num(fs, 106, phaseCol))
  const authorityContr= Math.abs(isNew ? num(fs, 117, phaseCol) : num(fs, 109, phaseCol))
  const consultancy   = Math.abs(isNew ? num(fs, 130, phaseCol) : num(fs, 122, phaseCol))
  const otherConstr   = Math.abs(isNew ? num(fs, 133, phaseCol) : num(fs, 125, phaseCol))
  const siteAdmin     = Math.abs(isNew ? num(fs, 137, phaseCol) : num(fs, 129, phaseCol))
  const financeCharges= Math.abs(isNew ? num(fs, 152, phaseCol) : num(fs, 144, phaseCol))
  const gdcBeforeFinance = Math.abs(isNew ? num(fs, 145, phaseCol) : num(fs, 137, phaseCol))
  const blendedPSFRaw = isNew ? num(fs, 63, phaseCol) : num(fs, 64, phaseCol)
  const landPSFRaw    = isNew ? num(fs, 67, phaseCol) : num(fs, 71, phaseCol)
  const nfa           = num(fs, 16, phaseCol)
  const landAcres     = num(fs, 8,  phaseCol)

  const baseASP        = irr ? num(irr, 5, 2) : 680
  const baseAbsorption = irr ? num(irr, 6, 2) : 0.8
  const baseBuildCost  = irr ? num(irr, 7, 2) : 280
  const hurdleIRR      = irr ? num(irr, 8, 2) : 0.16
  const devPeriodYears = cf  ? num(cf,  9, 2) : 5

  const landM      = +(landTotal / M).toFixed(1)
  const constrM    = +(gcc / M).toFixed(1)
  const authorityM = +((authorityContr + strataFees + planningFees) / M).toFixed(1)
  const siteStaffM = +((consultancy + siteAdmin + otherConstr) / M).toFixed(1)
  const financeM   = +(financeCharges / M).toFixed(1)
  const totalDevCostM = +((gdcBeforeFinance + financeCharges) / M).toFixed(1)
  const ndvM  = +(ndvRaw / M).toFixed(1)
  const gdvM  = +(gdvRaw / M).toFixed(1)
  const ndpM  = +(ndpRaw / M).toFixed(1)
  const ndpPct = +((devMgnRaw > 0 ? devMgnRaw : (ndvRaw > 0 ? ndpRaw / ndvRaw : 0)) * 100).toFixed(1)

  if (ndvM === 0 && gdvM === 0) throw new Error('financials.xlsx has no data (template only)')

  return {
    ndv: ndvM, gdv: gdvM, constr: constrM, ndp: ndpM, ndpMargin: ndpPct,
    equityRequired: landM, landCost: landM,
    authority: authorityM, siteStaff: siteStaffM, finance: financeM,
    marketing: 0, totalDevCost: totalDevCostM,
    blendedPSF: blendedPSFRaw > 0 ? +blendedPSFRaw.toFixed(0) : null,
    landPSF:    landPSFRaw   > 0 ? +landPSFRaw.toFixed(0)   : null,
    baseASP: +baseASP.toFixed(0),
    baseAbsorption: +(baseAbsorption * 100).toFixed(0),
    baseBuildCost: +baseBuildCost.toFixed(0),
    hurdleIRR: +(hurdleIRR * 100).toFixed(1),
    devPeriodYears: devPeriodYears > 0 ? devPeriodYears : 5,
    nfa: +nfa.toFixed(0), landAcres: +landAcres.toFixed(3),
    source: 'xlsx',
  }
}
