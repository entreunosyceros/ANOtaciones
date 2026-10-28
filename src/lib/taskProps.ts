import type { Page, TaskFilter, TaskPriority, TaskSort } from '../db/types'
import { BOARD_STATUSES, isLivePage } from '../db/types'

/** Canonical productivity property keys on Page.properties */
export const TASK_PROP = {
  due: 'due',
  priority: 'priority',
  status: 'status',
  inbox: 'inbox',
} as const

export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high']

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }

export function getDue(page: Page): string | null {
  const v = page.properties[TASK_PROP.due]
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null
}

export function getPriority(page: Page): TaskPriority | null {
  const v = page.properties[TASK_PROP.priority]
  if (v === 'low' || v === 'medium' || v === 'high') return v
  return null
}

export function getStatus(page: Page): string | null {
  const v = page.properties[TASK_PROP.status]
  return typeof v === 'string' && v ? v : null
}

export function isInbox(page: Page): boolean {
  return page.properties[TASK_PROP.inbox] === true
}

/** A page counts as a task if it has inbox/due/priority or a board status. */
export function isTaskPage(page: Page): boolean {
  if (!isLivePage(page) || page.isTemplate) return false
  if (page.kind === 'board' || page.kind === 'database') return false
  if (isInbox(page)) return true
  if (getDue(page)) return true
  if (getPriority(page)) return true
  const status = getStatus(page)
  if (status && (BOARD_STATUSES as readonly string[]).includes(status)) return true
  return false
}

export function todayIso(d = new Date()): string {
  // Día civil local (España), no UTC
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function listTasks(pages: Page[], filter: TaskFilter = {}, sort?: TaskSort): Page[] {
  let out = pages.filter(isTaskPage)

  if (filter.inboxOnly) out = out.filter(isInbox)
  if (filter.status) out = out.filter((p) => getStatus(p) === filter.status)
  if (filter.priority) out = out.filter((p) => getPriority(p) === filter.priority)
  if (filter.dueBefore) out = out.filter((p) => {
    const due = getDue(p)
    return due != null && due <= filter.dueBefore!
  })
  if (filter.dueAfter) out = out.filter((p) => {
    const due = getDue(p)
    return due != null && due >= filter.dueAfter!
  })
  if (filter.tagId) out = out.filter((p) => (p.tagIds ?? []).includes(filter.tagId!))
  if (filter.query?.trim()) {
    const q = filter.query.trim().toLowerCase()
    out = out.filter((p) => p.title.toLowerCase().includes(q))
  }

  const s: TaskSort = sort ?? { by: 'due', dir: 'asc' }
  out = out.slice().sort((a, b) => {
    let cmp = 0
    if (s.by === 'title') cmp = a.title.localeCompare(b.title)
    else if (s.by === 'updatedAt') cmp = a.updatedAt - b.updatedAt
    else if (s.by === 'priority') {
      const pa = getPriority(a)
      const pb = getPriority(b)
      cmp = (pa ? PRIORITY_RANK[pa] : 9) - (pb ? PRIORITY_RANK[pb] : 9)
    } else {
      const da = getDue(a)
      const db = getDue(b)
      if (!da && !db) cmp = 0
      else if (!da) cmp = 1
      else if (!db) cmp = -1
      else cmp = da.localeCompare(db)
    }
    return s.dir === 'desc' ? -cmp : cmp
  })

  return out
}

export function tasksDueOn(pages: Page[], isoDate: string): Page[] {
  return listTasks(pages, {}).filter((p) => getDue(p) === isoDate)
}
