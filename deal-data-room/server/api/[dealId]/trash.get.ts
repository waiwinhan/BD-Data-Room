import { extname } from 'path'

export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const sb = useSupabase()

  const { data } = await sb
    .from('deal_documents')
    .select('*')
    .eq('deal_id', dealId)
    .eq('trashed', true)
    .order('created_at', { ascending: false })

  const typeMap: Record<string, string> = {
    pdf: 'PDF', xlsx: 'XLS', xls: 'XLS',
    doc: 'DOC', docx: 'DOC', ppt: 'PPT', pptx: 'PPT',
    jpg: 'IMG', jpeg: 'IMG', png: 'IMG',
  }

  const docs = (data ?? []).map((d: any) => {
    const ext = extname(d.filename).toLowerCase().replace('.', '')
    return {
      filename:  d.filename,
      name:      d.name ?? d.filename,
      type:      typeMap[ext] ?? ext.toUpperCase(),
      category:  d.category ?? 'legal',
      deletedAt: d.updated_at ?? d.created_at,
    }
  })

  return { docs, categories: [] }
})
