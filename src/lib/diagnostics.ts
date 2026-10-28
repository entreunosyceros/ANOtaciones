import type { Page, Tag } from '../db/types'
import { isLivePage } from '../db/types'
import { collectPageLinkIds, findBrokenPageLinks } from './pageLinks'

export interface DiagnosticsReport {
  totalPages: number
  livePages: number
  trashPages: number
  templates: number
  tags: number
  orphanParentIds: string[]
  brokenLinks: { fromPageId: string; targetId: string }[]
  estimatedJsonBytes: number
}

export function runDiagnostics(pages: Page[], tags: Tag[] = []): DiagnosticsReport {
  const ids = new Set(pages.map((p) => p.id))
  const live = pages.filter(isLivePage)
  const orphanParentIds = [
    ...new Set(
      live
        .map((p) => p.parentId)
        .filter((pid): pid is string => typeof pid === 'string' && !ids.has(pid)),
    ),
  ]
  const brokenLinks: DiagnosticsReport['brokenLinks'] = []
  for (const page of live) {
    for (const targetId of findBrokenPageLinks(page.content, ids)) {
      brokenLinks.push({ fromPageId: page.id, targetId })
    }
  }
  const estimatedJsonBytes = new Blob([JSON.stringify({ pages, tags })]).size
  return {
    totalPages: pages.length,
    livePages: live.filter((p) => !p.isTemplate).length,
    trashPages: pages.filter((p) => !isLivePage(p)).length,
    templates: live.filter((p) => p.isTemplate).length,
    tags: tags.length,
    orphanParentIds,
    brokenLinks,
    estimatedJsonBytes,
  }
}

export function repairOrphanParents(pages: Page[]): Page[] {
  const ids = new Set(pages.map((p) => p.id))
  return pages.map((p) =>
    p.parentId && !ids.has(p.parentId) ? { ...p, parentId: null } : p,
  )
}

export function countOutgoingLinks(pages: Page[]): number {
  return pages.reduce((n, p) => n + collectPageLinkIds(p.content).length, 0)
}
