#!/usr/bin/env node
/**
 * build-kb.mjs — Bundles the malaysia-property Obsidian vault into a structured manifest.
 *
 * Reads from OBSIDIAN_VAULT_PATH (or the default Windows path), walks all .md files,
 * parses YAML frontmatter (lightweight — captures the raw block as text),
 * and emits server/kb/manifest.json.
 *
 * Output shape is RAG-ready: each note has id/content/tokens/tags so a future
 * pgvector implementation can embed entries[].content directly without re-chunking.
 *
 * Run: npm run build:kb
 */

import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')

const DEFAULT_VAULT = 'C:\\Users\\whwai\\Desktop\\Obsidian\\malaysia-property'
const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || DEFAULT_VAULT
const OUT_DIR = join(PROJECT_ROOT, 'server', 'kb')
const OUT_FILE = join(OUT_DIR, 'manifest.json')

const SKIP_DIRS = new Set(['.obsidian', '.git', 'raw-sources', 'node_modules', '.trash'])

function approxTokens(text) {
  return Math.ceil(text.length / 4)
}

function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return { frontmatter: {}, frontmatterRaw: '', body: raw }
  const end = raw.indexOf('\n---', 3)
  if (end === -1) return { frontmatter: {}, frontmatterRaw: '', body: raw }
  const fmText = raw.slice(3, end).trim()
  const body = raw.slice(end + 4).replace(/^\s*\n/, '')
  const frontmatter = {}
  for (const line of fmText.split('\n')) {
    const m = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/)
    if (!m) continue
    const key = m[1]
    let val = m[2].trim()
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
    } else if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1)
    } else if (val === 'true' || val === 'false') {
      val = val === 'true'
    } else if (val !== '' && !isNaN(Number(val))) {
      val = Number(val)
    }
    frontmatter[key] = val
  }
  return { frontmatter, frontmatterRaw: fmText, body }
}

function extractWikiLinks(text) {
  const links = []
  const re = /\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g
  let m
  while ((m = re.exec(text)) !== null) links.push(m[1].trim())
  return [...new Set(links)]
}

async function walk(dir, vault, files = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(full, vault, files)
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(full)
    }
  }
  return files
}

function classifyType(relPath) {
  const top = relPath.split(sep)[0]
  if (top === 'concepts') return 'concept'
  if (top === 'entities') {
    const sub = relPath.split(sep)[1]
    if (sub === 'developers') return 'developer'
    if (sub === 'areas') return 'area'
    if (sub === 'projects') return 'project'
    return 'entity'
  }
  if (top === 'construction-costs') return 'cost'
  if (top === 'market-analysis') return 'analysis'
  if (top === 'sources') return 'source'
  return 'note'
}

async function main() {
  console.log(`[build-kb] Vault: ${VAULT_PATH}`)
  try {
    const s = await stat(VAULT_PATH)
    if (!s.isDirectory()) throw new Error('not a directory')
  } catch (err) {
    console.warn(`[build-kb] Vault not accessible (${err.message}).`)
    if (process.env.NETLIFY === 'true') {
      console.warn('[build-kb] Netlify build detected — assuming committed manifest exists. Skipping.')
      process.exit(0)
    }
    console.error('[build-kb] Set OBSIDIAN_VAULT_PATH or commit server/kb/manifest.json before deploying.')
    process.exit(1)
  }

  const files = await walk(VAULT_PATH, VAULT_PATH)
  console.log(`[build-kb] Found ${files.length} markdown files`)

  const notes = []
  let totalTokens = 0
  let skipped = 0

  for (const file of files) {
    const raw = await readFile(file, 'utf8')
    const { frontmatter, body } = parseFrontmatter(raw)
    if (frontmatter.draft === true) { skipped++; continue }

    const relPath = relative(VAULT_PATH, file).replace(/\\/g, '/')
    const id = relPath.replace(/\.md$/, '')
    const title = frontmatter.title || frontmatter.name || id.split('/').pop()
    const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : (frontmatter.tags ? [frontmatter.tags] : [])
    const tokens = approxTokens(body)

    notes.push({
      id,
      path: relPath,
      title,
      type: classifyType(relPath.replace(/\//g, sep)),
      tags,
      frontmatter,
      content: body.trim(),
      tokens,
      links: extractWikiLinks(body),
    })
    totalTokens += tokens
  }

  notes.sort((a, b) => a.id.localeCompare(b.id))

  const manifest = {
    version: new Date().toISOString(),
    vault: 'malaysia-property',
    vaultPath: VAULT_PATH,
    noteCount: notes.length,
    skippedDrafts: skipped,
    totalTokens,
    notes,
  }

  await mkdir(OUT_DIR, { recursive: true })
  await writeFile(OUT_FILE, JSON.stringify(manifest, null, 2), 'utf8')
  console.log(`[build-kb] Wrote ${notes.length} notes (~${totalTokens.toLocaleString()} tokens) → ${OUT_FILE}`)
}

main().catch(err => {
  console.error('[build-kb] FAILED:', err)
  process.exit(1)
})
