import { describe, expect, it } from 'vitest'
import type { Page } from '../db/types'
import { dailyNoteContent, findDailyNote, todayTitle } from './dailyNote'

describe('dailyNote', () => {
  it('formats today as YYYY-MM-DD', () => {
    expect(todayTitle(new Date('2026-10-28T12:00:00'))).toBe('2026-10-28')
  })

  it('builds content with H1', () => {
    const doc = dailyNoteContent('2026-10-28')
    expect(doc.content?.[0]).toMatchObject({ type: 'heading', attrs: { level: 1 } })
  })

  it('finds existing root daily note', () => {
    const pages: Page[] = [
      {
        id: '1',
        parentId: null,
        title: '2026-10-28',
        icon: '📅',
        content: { type: 'doc', content: [] },
        createdAt: 1,
        updatedAt: 1,
        order: 0,
        kind: 'doc',
        isFavorite: false,
        properties: {},
      },
    ]
    expect(findDailyNote(pages, '2026-10-28')?.id).toBe('1')
  })
})
