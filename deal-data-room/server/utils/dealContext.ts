/**
 * dealContext.ts — Loads a deal's structured data and renders it as a markdown
 * block suitable for use as a cached system-prompt segment.
 */

export async function buildDealContext(dealId: string): Promise<string | null> {
  const sb = useSupabase()
  const [{ data: dealRow }, { data: metaRow }, { data: risks }] = await Promise.all([
    sb.from('deals').select('*').eq('id', dealId).single(),
    sb.from('deal_meta').select('data').eq('deal_id', dealId).single(),
    sb.from('deal_risks').select('*').eq('deal_id', dealId),
  ])

  if (!dealRow) return null

  const deal: any = dealRow ?? {}
  const meta: any = metaRow?.data ?? {}
  const swot = meta.swot

  const lines: string[] = []
  lines.push(`# CURRENT DEAL — ${meta.name ?? deal.name ?? dealId}`)
  lines.push('')
  lines.push('## Overview')
  lines.push(`- ID: ${dealId}`)
  if (deal.ref) lines.push(`- Ref: ${deal.ref}`)
  if (deal.location || meta.location) lines.push(`- Location: ${deal.location ?? meta.location}`)
  if (meta.landArea ?? deal.land_acres) lines.push(`- Land Area: ${meta.landArea ?? deal.land_acres} acres`)
  if (meta.tenure ?? deal.tenure) lines.push(`- Tenure: ${meta.tenure ?? deal.tenure}`)
  if (deal.stage) lines.push(`- Stage: ${deal.stage}`)
  if (deal.gdv != null) lines.push(`- GDV: RM ${deal.gdv}M`)
  if (deal.ndv != null) lines.push(`- NDV: RM ${deal.ndv}M`)
  if (deal.blended_psf != null) lines.push(`- Blended PSF: RM ${deal.blended_psf}`)
  if (deal.land_cost != null) lines.push(`- Land Cost: RM ${deal.land_cost}M`)
  if (deal.construction_cost != null) lines.push(`- Construction Cost: RM ${deal.construction_cost}M`)
  if (deal.ndp_margin != null) lines.push(`- NDP Margin: ${deal.ndp_margin}%`)
  if (deal.irr != null) lines.push(`- IRR: ${deal.irr}% vs ${deal.hurdle_rate ?? '—'}% hurdle`)
  if (deal.dd_progress != null) lines.push(`- DD Progress: ${deal.dd_progress}%`)

  if (Array.isArray(meta.devMix) && meta.devMix.length) {
    lines.push('', '## Development Mix')
    for (const m of meta.devMix) {
      lines.push(`- ${m.type}: ${m.pct}%${m.units ? ` (${m.units} units)` : ''}${m.sqft ? ` ${m.sqft} sqft` : ''}`)
    }
  }

  if (Array.isArray(meta.assumptions) && meta.assumptions.length) {
    lines.push('', '## Key Assumptions')
    for (const a of meta.assumptions) lines.push(`- ${a.label}: ${a.value}`)
  }

  if (Array.isArray(meta.proximities) && meta.proximities.length) {
    lines.push('', '## Proximities')
    for (const p of meta.proximities) lines.push(`- ${p.label} (${p.distance})`)
  }

  if (meta.legalStatus) {
    lines.push('', '## Legal Status')
    const ls = meta.legalStatus
    if (ls.titleType) lines.push(`- Title Type: ${ls.titleType}`)
    if (ls.landUse) lines.push(`- Land Use: ${ls.landUse}`)
    if (ls.encumbrance) lines.push(`- Encumbrance: ${ls.encumbrance}`)
    if (ls.zoning) lines.push(`- Zoning: ${ls.zoning}`)
    if (ls.bumiQuota) lines.push(`- Bumi Quota: ${ls.bumiQuota}`)
  }

  if (Array.isArray(risks) && risks.length) {
    lines.push('', `## Risk Register (${risks.length})`)
    for (const r of risks as any[]) {
      lines.push(`- [${(r.severity ?? '').toUpperCase()}] ${r.category ?? ''}: ${r.description ?? ''}${r.mitigation ? ` — Mitigation: ${r.mitigation}` : ''}`)
    }
  }

  if (Array.isArray(meta.milestones) && meta.milestones.length) {
    const live = meta.milestones.filter((m: any) => m.label)
    if (live.length) {
      lines.push('', '## DD Milestones')
      for (const m of live) lines.push(`- ${m.label} (${m.date ?? '—'}): ${m.status ?? '—'}`)
    }
  }

  if (swot) {
    lines.push('', '## Existing AI SWOT (previously generated)')
    if (swot.recommendation) {
      lines.push(`- Verdict: ${swot.recommendation.verdict}`)
      if (swot.recommendation.headline) lines.push(`- Headline: ${swot.recommendation.headline}`)
      if (swot.recommendation.rationale) lines.push(`- Rationale: ${swot.recommendation.rationale}`)
    }
    if (swot.swot) {
      const s = swot.swot
      if (s.strengths?.length)     lines.push(`- Strengths: ${s.strengths.join('; ')}`)
      if (s.weaknesses?.length)    lines.push(`- Weaknesses: ${s.weaknesses.join('; ')}`)
      if (s.opportunities?.length) lines.push(`- Opportunities: ${s.opportunities.join('; ')}`)
      if (s.threats?.length)       lines.push(`- Threats: ${s.threats.join('; ')}`)
    }
  }

  return lines.join('\n')
}
