import type { Page } from '../db/types'

export function buildBreadcrumbs(pages: Page[], pageId: string): Page[] {
  const byId = new Map(pages.map((p) => [p.id, p]))
  const trail: Page[] = []
  let current = byId.get(pageId)
  const guard = new Set<string>()
  while (current && !guard.has(current.id)) {
    guard.add(current.id)
    trail.unshift(current)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }
  return trail
}
