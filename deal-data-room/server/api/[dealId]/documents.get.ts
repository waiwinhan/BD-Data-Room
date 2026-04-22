export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const sb = useSupabase()

  const { data, error } = await sb
    .from('deal_documents')
    .select('*')
    .eq('deal_id', dealId)
    .eq('trashed', false)
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const docs = (data ?? []).map((d: any) => {
    const ext = d.filename.split('.').pop()?.toLowerCase() ?? ''
    const typeMap: Record<string, string> = {
      pdf: 'PDF', xlsx: 'XLS', xls: 'XLS',
      doc: 'DOC', docx: 'DOC', ppt: 'PPT', pptx: 'PPT',
      jpg: 'IMG', jpeg: 'IMG', png: 'IMG',
    }
    return {
      filename: d.filename,
      name:     d.name ?? d.filename,
      type:     typeMap[ext] ?? ext.toUpperCase(),
      category: d.category ?? 'legal',
      status:   d.status   ?? 'New',
      uploader: d.uploader ?? '',
      date:     d.file_date ?? d.created_at?.slice(0, 10),
      sizeKB:   Math.round((d.size_bytes ?? 0) / 1024),
    }
  })

  const result: Record<string, typeof docs> = {}
  for (const doc of docs) {
    const cat = doc.category ?? 'legal'
    if (!result[cat]) result[cat] = []
    result[cat].push(doc)
  }
  return result
})
