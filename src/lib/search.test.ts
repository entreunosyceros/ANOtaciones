import { describe, expect, it } from 'vitest'
import type { Page } from '../db/types'
import { filterPagesByTitle } from './search'

function page(id: string, title: string): Page {
  return {
    id,
    parentId: null,
    title,
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

describe('filterPagesByTitle', () => {
  const pages = [page('1', 'Notas de clase'), page('2', 'Proyecto Alpha'), page('3', 'Diario')]

  it('filters by case-insensitive substring', () => {
    expect(filterPagesByTitle(pages, 'proy').map((p) => p.id)).toEqual(['2'])
  })

  it('returns all sorted when query empty', () => {
    expect(filterPagesByTitle(pages, '').map((p) => p.title)).toEqual([
      'Diario',
      'Notas de clase',
      'Proyecto Alpha',
    ])
  })
})
