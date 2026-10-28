import type { Page, PageKind, Tag } from '../db/types'
import { isLivePage } from '../db/types'
import { plainTextFromContent } from './pageLinks'

export interface SearchHit {
  page: Page
  match: 'title' | 'content' | 'tag'
  snippet?: string
}

export interface SearchOptions {
  kind?: PageKind | 'all'
  tagId?: string | null
  /** Include soft-deleted pages */
  includeTrash?: boolean
  /** Include templates in results */
  includeTemplates?: boolean
}

function snippetAround(text: string, query: string, radius = 40): string {
  const lower = text.toLowerCase()
  const idx = lower.indexOf(query)
  if (idx < 0) return text.slice(0, radius * 2)
  const start = Math.max(0, idx - radius)
  const end = Math.min(text.length, idx + query.length + radius)
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}

export function filterPagesByTitle(pages: Page[], query: string): Page[] {
  return searchPages(pages, query, {}).map((h) => h.page)
}

export function searchPages(
  pages: Page[],
  query: string,
  options: SearchOptions = {},
  tags: Tag[] = [],
): SearchHit[] {
  const q = query.trim().toLowerCase()
  const kind = options.kind ?? 'all'
  const tagId = options.tagId ?? null

  let pool = pages.filter((p) => {
    if (!options.includeTrash && !isLivePage(p)) return false
    if (!options.includeTemplates && p.isTemplate) return false
    if (kind !== 'all' && p.kind !== kind) return false
    if (tagId && !(p.tagIds ?? []).includes(tagId)) return false
    return true
  })

  if (!q) {
    return pool
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((page) => ({ page, match: 'title' as const }))
  }

  const tagById = new Map(tags.map((t) => [t.id, t]))
  const hits: SearchHit[] = []

  for (const page of pool) {
    if (page.title.toLowerCase().includes(q)) {
      hits.push({ page, match: 'title' })
      continue
    }

    const pageTags = (page.tagIds ?? [])
      .map((id) => tagById.get(id)?.name ?? '')
      .join(' ')
      .toLowerCase()
    if (pageTags.includes(q)) {
      hits.push({ page, match: 'tag' })
      continue
    }

    const body = plainTextFromContent(page.content)
    if (body.toLowerCase().includes(q)) {
      hits.push({ page, match: 'content', snippet: snippetAround(body, q) })
    }
  }

  return hits.sort((a, b) => {
    const rank = { title: 0, tag: 1, content: 2 }
    const d = rank[a.match] - rank[b.match]
    if (d !== 0) return d
    return a.page.title.localeCompare(b.page.title)
  })
}
