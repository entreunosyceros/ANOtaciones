import type { Page } from '../db/types'
import { isLivePage } from '../db/types'
import { collectPageLinkIds } from './pageLinks'

/** Pages (live) that contain a pageLink to targetId. */
export function findBacklinks(pages: Page[], targetId: string): Page[] {
  return pages
    .filter(isLivePage)
    .filter((p) => p.id !== targetId)
    .filter((p) => collectPageLinkIds(p.content).includes(targetId))
    .sort((a, b) => a.title.localeCompare(b.title))
}
