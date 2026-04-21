import { parseFinancials } from '../../utils/parseFinancials'

export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')
  if (!dealId) throw createError({ statusCode: 400, statusMessage: 'Missing dealId' })

  const sb = useSupabase()

  const { data: fileData, error: dlErr } = await sb.storage
    .from('deal-files')
    .download(`${dealId}/financials.xlsx`)

  if (dlErr || !fileData) {
    throw createError({ statusCode: 404, statusMessage: 'No financials.xlsx found for this deal' })
  }

  const buffer = Buffer.from(await fileData.arrayBuffer())

  try {
    return await parseFinancials(buffer)
  } catch (err: any) {
    throw createError({ statusCode: 422, statusMessage: err.message ?? 'Failed to parse financials.xlsx' })
  }
})
