import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { join, extname, basename } from 'path'

async function extractDocumentText(filePath: string, ext: string): Promise<string> {
  try {
    if (ext === 'pdf') {
      const pdfParse = (await import('pdf-parse')).default
      const buffer = readFileSync(filePath)
      const data = await pdfParse(buffer)
      // Limit to first 3000 chars per doc to avoid token overflow
      return data.text.replace(/\s+/g, ' ').trim().slice(0, 3000)
    }
    if (ext === 'xlsx' || ext === 'xls') {
      const ExcelJS = (await import('exceljs')).default
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.readFile(filePath)
      const lines: string[] = []
      wb.eachSheet(sheet => {
        sheet.eachRow(row => {
          const vals = (row.values as any[]).slice(1).filter(Boolean).join(' | ')
          if (vals) lines.push(vals)
        })
      })
      return lines.join('\n').slice(0, 3000)
    }
  } catch {
    // If parsing fails, just note the file exists
  }
  return ''
}

export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const config = useRuntimeConfig()

  if (!config.anthropicApiKey) {
    throw createError({ statusCode: 500, message: 'ANTHROPIC_API_KEY not configured in .env' })
  }

  // ── Load structured deal data ──────────────────────────────────
  const dealsPath = join(config.dataDir, 'deals.json')
  const metaPath  = join(config.dataDir, dealId, 'meta.json')
  const riskPath  = join(config.dataDir, dealId, 'risk.json')
  const docsDir   = join(config.dataDir, dealId, 'docs')

  const deals = JSON.parse(readFileSync(dealsPath, 'utf-8'))
  const deal  = deals.find((d: any) => d.id === dealId)
  const meta  = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf-8')) : {}
  const risks = existsSync(riskPath) ? JSON.parse(readFileSync(riskPath, 'utf-8')) : []

  // ── Extract text from uploaded documents ───────────────────────
  const docSections: string[] = []
  if (existsSync(docsDir)) {
    const files = readdirSync(docsDir).filter(f => !f.endsWith('.meta.json') && !f.startsWith('.'))
    for (const filename of files) {
      const filePath = join(docsDir, filename)
      const metaFile = join(docsDir, filename + '.meta.json')
      const fileMeta = existsSync(metaFile) ? JSON.parse(readFileSync(metaFile, 'utf-8')) : {}
      const ext = extname(filename).toLowerCase().replace('.', '')
      const displayName = fileMeta.name ?? basename(filename, extname(filename))
      const category = fileMeta.category ?? 'general'

      const text = await extractDocumentText(filePath, ext)
      if (text) {
        docSections.push(`[${category.toUpperCase()}] ${displayName}:\n${text}`)
      } else {
        docSections.push(`[${category.toUpperCase()}] ${displayName}: (binary/image file — referenced but not parsed)`)
      }
    }
  }

  const docsContext = docSections.length > 0
    ? `\nUPLOADED DOCUMENTS (${docSections.length} file${docSections.length > 1 ? 's' : ''}):\n${docSections.join('\n\n---\n\n')}`
    : '\nUPLOADED DOCUMENTS: None uploaded yet.'

  // ── Build prompt ───────────────────────────────────────────────
  const prompt = `You are a senior Malaysian property development analyst at BRDB Berhad. Analyse the following deal comprehensively — including structured dashboard data AND the content of all uploaded documents — then produce a SWOT analysis and a separate strategic recommendation.

=== STRUCTURED DEAL DATA ===

DEAL OVERVIEW:
- Name: ${meta.name ?? dealId}
- Location: ${deal?.location ?? meta.location}
- Land Area: ${meta.landArea ?? deal?.landAcres} acres (${meta.tenure ?? deal?.tenure})
- Stage: ${deal?.stage}
- GDV: RM ${deal?.gdv}M
- NDV: RM ${deal?.ndv ?? Math.round((deal?.gdv ?? 0) * 0.93)}M (After S&M, blended RM ${deal?.blendedPSF} psf)
- Land Cost: RM ${deal?.landCost}M (RM ${deal?.landCostPSF} psf)
- Est. Construction Cost: RM ${deal?.constructionCost ?? Math.round((deal?.gdv ?? 0) * 0.40)}M (hard cost)
- Net Dev Profit: RM ${deal?.ndp ?? '—'}M | NDP Margin: ${deal?.ndpMargin ?? '—'}% on NDV
- Projected IRR: ${deal?.irr}% vs ${deal?.hurdleRate}% hurdle rate
- DD Progress: ${deal?.ddProgress}%

DEVELOPMENT MIX:
${(meta.devMix ?? []).map((m: any) => `- ${m.type}: ${m.pct}%${m.units ? ` (${m.units} units)` : ''}${m.sqft ? ` (${m.sqft.toLocaleString()} sqft)` : ''}`).join('\n')}

KEY ASSUMPTIONS:
${(meta.assumptions ?? []).map((a: any) => `- ${a.label}: ${a.value}`).join('\n')}

KEY PROXIMITIES:
${(meta.proximities ?? []).map((p: any) => `- ${p.label} (${p.distance})`).join('\n')}

LEGAL STATUS:
- Title: ${meta.legalStatus?.titleType}
- Encumbrance: ${meta.legalStatus?.encumbrance}
- Zoning: ${meta.legalStatus?.zoning}
- Bumi Quota: ${meta.legalStatus?.bumiQuota}

RISK REGISTER (${risks.length} items):
${risks.map((r: any) => `- [${(r.severity ?? 'unknown').toUpperCase()}] ${r.title}: ${r.description ?? ''}`).join('\n')}

DD MILESTONES:
${(meta.milestones ?? []).filter((m: any) => m.label).map((m: any) => `- ${m.label} (${m.date}): ${m.status}`).join('\n')}

=== UPLOADED DOCUMENTS ===${docsContext}

=== INSTRUCTIONS ===
Based on ALL the above data (structured + documents), respond ONLY with valid JSON in this exact structure (no markdown, no explanation outside JSON):
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
    "rationale": "2-3 sentences of strategic reasoning citing specific data points from the deal",
    "keyConditions": ["condition or action item 1", "condition or action item 2", "condition or action item 3"]
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

  // Persist to meta.json
  meta.swot = { ...result, generatedAt: new Date().toISOString(), docsAnalysed: docSections.length }
  writeFileSync(metaPath, JSON.stringify(meta, null, 2))

  return meta.swot
})
