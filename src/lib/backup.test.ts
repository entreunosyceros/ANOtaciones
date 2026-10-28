import { describe, expect, it } from 'vitest'
import type { Page } from '../db/types'
import { buildBackup, parseBackup } from './backup'

function page(id: string): Page {
  return {
    id,
    parentId: null,
    title: 'Nota',
    icon: null,
    content: { type: 'doc', content: [] },
    createdAt: 1,
    updatedAt: 1,
    order: 0,
    kind: 'doc',
    isFavorite: false,
    properties: {},
  }
}

describe('backup', () => {
  it('round-trips pages', () => {
    const pages = [page('a'), page('b')]
    const payload = buildBackup(pages)
    expect(payload.version).toBe(1)
    expect(parseBackup(payload).map((p) => p.id)).toEqual(['a', 'b'])
  })

  it('rejects invalid payload', () => {
    expect(() => parseBackup({})).toThrow()
  })
})
