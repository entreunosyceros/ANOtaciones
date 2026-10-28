import { describe, expect, it } from 'vitest'
import type { Page } from '../db/types'
import { buildTree, collectDescendantIds } from './tree'

function p(
  partial: Pick<Page, 'id' | 'parentId' | 'title' | 'order'> & Partial<Page>,
): Page {
  return {
    icon: null,
    content: { type: 'doc', content: [] },
    createdAt: 1,
    updatedAt: 1,
    kind: 'doc',
    isFavorite: false,
    properties: {},
    ...partial,
  }
}

const pages: Page[] = [
  p({ id: 'a', parentId: null, title: 'A', order: 0 }),
  p({ id: 'b', parentId: 'a', title: 'B', order: 0 }),
  p({ id: 'c', parentId: 'b', title: 'C', order: 0 }),
  p({ id: 'd', parentId: null, title: 'D', order: 1 }),
]

describe('buildTree', () => {
  it('nests children by parentId and sorts by order', () => {
    const tree = buildTree(pages)
    expect(tree.map((n) => n.id)).toEqual(['a', 'd'])
    expect(tree[0].children[0].id).toBe('b')
    expect(tree[0].children[0].children[0].id).toBe('c')
  })
})

describe('collectDescendantIds', () => {
  it('includes root and all nested descendants', () => {
    expect(collectDescendantIds(pages, 'a').sort()).toEqual(['a', 'b', 'c'])
  })
})
