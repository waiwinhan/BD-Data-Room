export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')
  if (!dealId) throw createError({ statusCode: 400, statusMessage: 'Missing dealId' })
  if (!/^[A-Za-z0-9_-]+$/.test(dealId)) throw createError({ statusCode: 400, statusMessage: 'Invalid dealId' })

  const formData = await readMultipartFormData(event)
  if (!formData?.length) throw createError({ statusCode: 400, statusMessage: 'No file received' })

  const file = formData.find(f => f.name === 'file')
  if (!file?.data) throw createError({ statusCode: 400, statusMessage: 'Missing file field' })
  if (!file.filename?.toLowerCase().endsWith('.xlsx')) {
    throw createError({ statusCode: 400, statusMessage: 'Only .xlsx files are accepted' })
  }

  const sb = useSupabase()
  const { error } = await sb.storage
    .from('deal-files')
    .upload(`${dealId}/financials.xlsx`, file.data, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true,
    })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { ok: true, filename: file.filename, bytes: file.data.length }
})
