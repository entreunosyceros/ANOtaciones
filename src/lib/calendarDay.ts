import type { Page } from '../db/types'
import { isLivePage } from '../db/types'
import { findDailyNote } from './dailyNote'
import { getDue, isTaskPage } from './taskProps'

export interface DayItems {
  iso: string
  dailyNote: Page | undefined
  tasks: Page[]
}

/** Daily note + tasks due on iso (excludes the daily note itself from tasks). */
export function getDayItems(pages: Page[], iso: string): DayItems {
  const live = pages.filter((p) => isLivePage(p) && !p.isTemplate)
  const dailyNote = findDailyNote(live, iso)
  const tasks = live
    .filter((p) => isTaskPage(p) && getDue(p) === iso)
    .filter((p) => p.id !== dailyNote?.id)
    .sort((a, b) => a.title.localeCompare(b.title))
  return { iso, dailyNote, tasks }
}
