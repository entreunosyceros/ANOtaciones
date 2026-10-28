import type { Page, TipTapDoc } from '../db/types'
import { toIsoDate } from './dates'

/** Normalize Date or YYYY-MM-DD string to calendar title (ISO interno). */
export function resolveDateTitle(date?: string | Date): string {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    return date.slice(0, 10)
  }
  const d = date instanceof Date ? date : new Date()
  return todayTitle(d)
}

export function todayTitle(date = new Date()): string {
  return toIsoDate(date)
}

export function dailyNoteContent(title: string): TipTapDoc {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: title }],
      },
      { type: 'paragraph' },
    ],
  }
}

export function findDailyNote(pages: Page[], title = todayTitle()): Page | undefined {
  return pages.find((p) => p.parentId === null && p.kind === 'doc' && p.title === title)
}
