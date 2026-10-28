import type { Page } from '../db/types'

export function filterPagesByTitle(pages: Page[], query: string): Page[] {
  const q = query.trim().toLowerCase()
  if (!q) return pages.slice().sort((a, b) => a.title.localeCompare(b.title))
  return pages
    .filter((p) => p.title.toLowerCase().includes(q))
    .sort((a, b) => a.title.localeCompare(b.title))
}
