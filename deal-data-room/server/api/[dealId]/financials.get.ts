import ExcelJS from 'exceljs'

export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')
  if (!dealId) throw createError({ statusCode: 400, statusMessage: 'Missing dealId' })

  const sb = useSupabase()

  // Download financials.xlsx from Supabase Storage
  const { data: fileData, error: dlErr } = await sb.storage
    .from('deal-files')
    .download(`${dealId}/financials.xlsx`)

  if (dlErr || !fileData) {
    throw createError({ statusCode: 404, statusMessage: 'No financials.xlsx found for this deal' })
  }

  // Convert Blob → Buffer
  const buffer = Buffer.from(await fileData.arrayBuffer())

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)

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

  let phaseCol = 9
  for (let c = 9; c <= 53; c += 2) {
    if (num(fs, 61, c) > 0) { phaseCol = c; break }
  }

  const M = 1_000_000

  const ndv         = num(fs, 61, phaseCol)
  const gdv         = num(fs, 38, phaseCol)
  const ndp         = num(fs, 25, phaseCol)
  const devMgnRaw   = num(fs, 26, phaseCol)
  const landTotal   = Math.abs(num(fs, 69, phaseCol))
  const gcc         = Math.abs(num(fs, 79, phaseCol))
  const strataFees  = Math.abs(num(fs, 103, phaseCol))
  const planningFees    = Math.abs(num(fs, 106, phaseCol))
  const authorityContr  = Math.abs(num(fs, 109, phaseCol))
  const consultancy     = Math.abs(num(fs, 122, phaseCol))
  const otherConstr     = Math.abs(num(fs, 125, phaseCol))
  const siteAdmin       = Math.abs(num(fs, 129, phaseCol))
  const financeCharges  = Math.abs(num(fs, 144, phaseCol))
  const gdcBeforeFinance = Math.abs(num(fs, 137, phaseCol))
  const blendedPSF  = num(fs, 64, phaseCol)
  const landPSF     = num(fs, 71, phaseCol)
  const nfa         = num(fs, 16, phaseCol)
  const landAcres   = num(fs, 8,  phaseCol)

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
  const ndvM  = +(ndv / M).toFixed(1)
  const gdvM  = +(gdv / M).toFixed(1)
  const ndpM  = +(ndp / M).toFixed(1)
  const ndpPct = +((devMgnRaw > 0 ? devMgnRaw : (ndvM > 0 ? ndpM / ndvM : 0)) * 100).toFixed(1)

  if (ndvM === 0 && gdvM === 0) {
    throw createError({ statusCode: 404, statusMessage: 'financials.xlsx has no data (template only)' })
  }

  return {
    ndv: ndvM, gdv: gdvM, constr: constrM, ndp: ndpM, ndpMargin: ndpPct,
    equityRequired: landM, landCost: landM,
    authority: authorityM, siteStaff: siteStaffM, finance: financeM,
    marketing: 0, totalDevCost: totalDevCostM,
    blendedPSF: blendedPSF > 0 ? +blendedPSF.toFixed(0) : null,
    landPSF:    landPSF   > 0 ? +landPSF.toFixed(0)   : null,
    baseASP: +baseASP.toFixed(0),
    baseAbsorption: +(baseAbsorption * 100).toFixed(0),
    baseBuildCost: +baseBuildCost.toFixed(0),
    hurdleIRR: +(hurdleIRR * 100).toFixed(1),
    devPeriodYears: devPeriodYears > 0 ? devPeriodYears : 5,
    nfa: +nfa.toFixed(0), landAcres: +landAcres.toFixed(3),
    source: 'xlsx',
  }
})
