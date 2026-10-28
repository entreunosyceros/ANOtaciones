import { describe, expect, it } from 'vitest'
import type { Page } from '../db/types'
import { buildBreadcrumbs } from './breadcrumbs'

function page(id: string, parentId: string | null, title: string): Page {
  return {
    id,
    parentId,
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

describe('buildBreadcrumbs', () => {
  it('builds root to leaf trail', () => {
    const pages = [
      page('a', null, 'Root'),
      page('b', 'a', 'Child'),
      page('c', 'b', 'Leaf'),
    ]
    expect(buildBreadcrumbs(pages, 'c').map((p) => p.id)).toEqual(['a', 'b', 'c'])
  })
})
