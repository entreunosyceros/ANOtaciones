import type { Page, TipTapDoc } from '../db/types'

export function todayTitle(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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
