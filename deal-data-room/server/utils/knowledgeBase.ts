/**
 * knowledgeBase.ts — Retrieval interface for the malaysia-property knowledge base.
 *
 * v1 (today): BundledKbRetriever loads the entire vault from server/kb/manifest.json
 *             into a single prompt-cacheable block. This is correct while the KB
 *             fits in Sonnet's context window (~108K of ~200K tokens today).
 *
 * v2 (later): Swap createRetriever() to a PgVectorRetriever that does top-k vector
 *             search over Supabase. The manifest schema already carries per-note
 *             id/content/tokens/tags so embedding entries[].content needs no rework.
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export interface KbNote {
  id: string
  path: string
  title: string
  type: string
  tags: string[]
  frontmatter: Record<string, any>
  content: string
  tokens: number
  links: string[]
}

export interface KbManifest {
  version: string
  vault: string
  noteCount: number
  totalTokens: number
  notes: KbNote[]
}

export interface KbContextBlock {
  source: string
  content: string
}

export interface KbContext {
  blocks: KbContextBlock[]
  totalTokens: number
  strategy: 'full' | 'vector'
  noteCount: number
  version: string
}

export interface KnowledgeRetriever {
  getContext(opts?: {
    query?: string
    dealMeta?: any
    maxTokens?: number
  }): Promise<KbContext>
}

let _cachedManifest: KbManifest | null = null

async function loadManifest(): Promise<KbManifest> {
  if (_cachedManifest) return _cachedManifest
  // Resolve relative to process.cwd() — Nitro runs server code from project root
  const path = join(process.cwd(), 'server', 'kb', 'manifest.json')
  try {
    const raw = await readFile(path, 'utf8')
    _cachedManifest = JSON.parse(raw) as KbManifest
    return _cachedManifest
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `KB manifest missing at ${path}. Run 'npm run build:kb' first. (${err.message})`,
    })
  }
}

class BundledKbRetriever implements KnowledgeRetriever {
  async getContext(): Promise<KbContext> {
    const manifest = await loadManifest()

    // Group notes by type for legibility in the prompt
    const groups: Record<string, KbNote[]> = {}
    for (const note of manifest.notes) {
      const g = note.type || 'note'
      if (!groups[g]) groups[g] = []
      groups[g].push(note)
    }

    const sections: string[] = []
    const order = ['concept', 'area', 'developer', 'project', 'cost', 'analysis', 'source', 'note', 'entity']
    for (const type of order) {
      const list = groups[type]
      if (!list || !list.length) continue
      sections.push(`# ${type.toUpperCase()}S (${list.length})`)
      for (const n of list) {
        const tagLine = n.tags.length ? `tags: ${n.tags.join(', ')}` : ''
        sections.push(
          [
            `## ${n.id} — ${n.title}`,
            tagLine,
            n.content,
          ]
            .filter(Boolean)
            .join('\n')
        )
      }
    }

    const content = sections.join('\n\n---\n\n')
    return {
      blocks: [{ source: 'malaysia-property-vault', content }],
      totalTokens: manifest.totalTokens,
      strategy: 'full',
      noteCount: manifest.noteCount,
      version: manifest.version,
    }
  }
}

export function createRetriever(): KnowledgeRetriever {
  // v2 hook: swap to PgVectorRetriever once tokens >~160K or retrieval quality demands it.
  return new BundledKbRetriever()
}
