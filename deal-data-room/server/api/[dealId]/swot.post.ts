import Anthropic from '@anthropic-ai/sdk'
import { extname, basename } from 'path'
import ExcelJS from 'exceljs'

async function extractDocumentText(buffer: Buffer, ext: string): Promise<string> {
  try {
    if (ext === 'pdf') {
      const pdfParse = (await import('pdf-parse')).default
      const data = await pdfParse(buffer)
      return data.text.replace(/\s+/g, ' ').trim().slice(0, 3000)
    }
    if (ext === 'xlsx' || ext === 'xls') {
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.load(buffer)
      const lines: string[] = []
      wb.eachSheet(sheet => {
        sheet.eachRow(row => {
          const vals = (row.values as any[]).slice(1).filter(Boolean).join(' | ')
          if (vals) lines.push(vals)
        })
      })
      return lines.join('\n').slice(0, 3000)
    }
  } catch {}
  return ''
}

export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const config = useRuntimeConfig()
  const sb     = useSupabase()

  if (!config.anthropicApiKey) {
    throw createError({ statusCode: 500, message: 'ANTHROPIC_API_KEY not configured in .env' })
  }

  // ── Load deal data from Supabase ────────────────────────────────────────
  const [{ data: dealRow }, { data: metaRow }, { data: risks }] = await Promise.all([
    sb.from('deals').select('*').eq('id', dealId).single(),
    sb.from('deal_meta').select('data').eq('deal_id', dealId).single(),
    sb.from('deal_risks').select('*').eq('deal_id', dealId),
  ])

  const deal = dealRow ?? {}
  const meta = metaRow?.data ?? {}

  // ── Extract text from documents in Supabase Storage ────────────────────
  const docSections: string[] = []
  const { data: docs } = await sb.from('deal_documents').select('*').eq('deal_id', dealId).eq('trashed', false)

  for (const doc of (docs ?? [])) {
    const ext = extname(doc.filename).toLowerCase().replace('.', '')
    const storagePath = `${dealId}/docs/${doc.filename}`
    const { data: fileData } = await sb.storage.from('deal-files').download(storagePath)
    if (fileData) {
      const buffer = Buffer.from(await fileData.arrayBuffer())
      const text = await extractDocumentText(buffer, ext)
      const displayName = doc.name ?? basename(doc.filename, extname(doc.filename))
      if (text) {
        docSections.push(`[${(doc.category ?? 'general').toUpperCase()}] ${displayName}:\n${text}`)
      } else {
        docSections.push(`[${(doc.category ?? 'general').toUpperCase()}] ${displayName}: (binary/image — referenced but not parsed)`)
      }
    }
  }

  const docsContext = docSections.length > 0
    ? `\nUPLOADED DOCUMENTS (${docSections.length} file${docSections.length > 1 ? 's' : ''}):\n${docSections.join('\n\n---\n\n')}`
    : '\nUPLOADED DOCUMENTS: None uploaded yet.'

  const prompt = `You are a senior Malaysian property development analyst at BRDB Berhad. Analyse the following deal comprehensively and produce a SWOT analysis and strategic recommendation.

=== STRUCTURED DEAL DATA ===

DEAL OVERVIEW:
- Name: ${meta.name ?? dealId}
- Location: ${deal.location ?? meta.location}
- Land Area: ${meta.landArea ?? deal.land_acres} acres (${meta.tenure ?? deal.tenure})
- Stage: ${deal.stage}
- GDV: RM ${deal.gdv}M
- Projected IRR: ${deal.irr}% vs ${deal.hurdle_rate}% hurdle rate
- DD Progress: ${deal.dd_progress}%

DEVELOPMENT MIX:
${(meta.devMix ?? []).map((m: any) => `- ${m.type}: ${m.pct}%${m.units ? ` (${m.units} units)` : ''}`).join('\n')}

KEY ASSUMPTIONS:
${(meta.assumptions ?? []).map((a: any) => `- ${a.label}: ${a.value}`).join('\n')}

KEY PROXIMITIES:
${(meta.proximities ?? []).map((p: any) => `- ${p.label} (${p.distance})`).join('\n')}

LEGAL STATUS:
- Title: ${meta.legalStatus?.titleType}
- Encumbrance: ${meta.legalStatus?.encumbrance}
- Zoning: ${meta.legalStatus?.zoning}
- Bumi Quota: ${meta.legalStatus?.bumiQuota}

RISK REGISTER (${(risks ?? []).length} items):
${(risks ?? []).map((r: any) => `- [${(r.severity ?? 'unknown').toUpperCase()}] ${r.description ?? ''}`).join('\n')}

DD MILESTONES:
${(meta.milestones ?? []).filter((m: any) => m.label).map((m: any) => `- ${m.label} (${m.date}): ${m.status}`).join('\n')}

=== UPLOADED DOCUMENTS ===${docsContext}

=== INSTRUCTIONS ===
Respond ONLY with valid JSON (no markdown):
{
  "swot": {
    "strengths": ["concise point", "concise point", "concise point", "concise point"],
    "weaknesses": ["concise point", "concise point", "concise point"],
    "opportunities": ["concise point", "concise point", "concise point"],
    "threats": ["concise point", "concise point", "concise point"]
  },
  "recommendation": {
    "verdict": "Proceed" | "Proceed with Caution" | "Hold" | "Reject",
    "headline": "One sharp sentence summarising the verdict",
    "rationale": "2-3 sentences of strategic reasoning citing specific data points",
    "keyConditions": ["condition 1", "condition 2", "condition 3"]
  }
}`

  const client = new Anthropic({ apiKey: config.anthropicApiKey })
  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (message.content[0] as any).text.trim()
  const result = JSON.parse(raw)

  // Persist SWOT back to deal_meta
  const updatedMeta = { ...meta, swot: { ...result, generatedAt: new Date().toISOString(), docsAnalysed: docSections.length } }
  await sb.from('deal_meta').update({ data: updatedMeta }).eq('deal_id', dealId)

  return updatedMeta.swot
})
