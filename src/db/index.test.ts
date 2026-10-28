import { beforeEach, describe, expect, it } from 'vitest'
import {
  createPage,
  db,
  deletePageCascade,
  duplicatePage,
  ensureBootstrapPage,
  getAllPages,
  importPages,
  updatePage,
} from './index'

describe('db', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('bootstraps Sin título doc when empty', async () => {
    const page = await ensureBootstrapPage()
    expect(page.title).toBe('Sin título')
    expect(page.parentId).toBeNull()
    expect(page.kind).toBe('doc')
    expect(page.isFavorite).toBe(false)
    expect(page.properties).toEqual({})
    const all = await getAllPages()
    expect(all).toHaveLength(1)
  })

  it('deletes cascade', async () => {
    const root = await ensureBootstrapPage()
    const child = await createPage({ parentId: root.id, title: 'Child' })
    await createPage({ parentId: child.id, title: 'Grand' })
    const deleted = await deletePageCascade(root.id)
    expect(deleted).toHaveLength(3)
    expect(await getAllPages()).toHaveLength(0)
  })

  it('creates board and card with status', async () => {
    const board = await createPage({ parentId: null, kind: 'board', title: 'Sprint' })
    expect(board.kind).toBe('board')
    const card = await createPage({
      parentId: board.id,
      title: 'Task',
      properties: { status: 'Doing' },
    })
    expect(card.properties.status).toBe('Doing')
    await updatePage(card.id, { properties: { ...card.properties, status: 'Done' } })
    const all = await getAllPages()
    expect(all.find((p) => p.id === card.id)?.properties.status).toBe('Done')
  })

  it('creates database with schema and views', async () => {
    const database = await createPage({ parentId: null, kind: 'database' })
    expect(database.kind).toBe('database')
    expect(database.dbSchema?.length).toBeGreaterThan(0)
    expect(database.dbViews?.map((v) => v.type).sort()).toEqual(['board', 'gallery', 'table'])
    expect(database.activeViewId).toBe('table')

    const row = await createPage({
      parentId: database.id,
      title: 'Cliente A',
      properties: { name: 'Cliente A', status: 'Backlog', tags: 'vip' },
    })
    expect(row.parentId).toBe(database.id)
    expect(row.properties.tags).toBe('vip')
  })

  it('duplicates a page without children', async () => {
    const root = await ensureBootstrapPage()
    await createPage({ parentId: root.id, title: 'Child' })
    const copy = await duplicatePage(root.id)
    expect(copy?.title).toBe(`${root.title} (copia)`)
    const all = await getAllPages()
    expect(all.filter((p) => p.parentId === copy?.id)).toHaveLength(0)
  })

  it('imports pages by upsert', async () => {
    await ensureBootstrapPage()
    const count = await importPages([
      {
        id: 'imported',
        parentId: null,
        title: 'Importada',
        icon: '📦',
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        createdAt: 1,
        updatedAt: 1,
        order: 9,
        kind: 'doc',
        isFavorite: false,
        properties: {},
      },
    ])
    expect(count).toBe(1)
    const all = await getAllPages()
    expect(all.some((p) => p.id === 'imported')).toBe(true)
  })

  it('normalizes legacy pages missing v2 fields', async () => {
    await db.pages.add({
      id: 'legacy',
      parentId: null,
      title: 'Old',
      icon: null,
      content: { type: 'doc', content: [] },
      createdAt: 1,
      updatedAt: 1,
      order: 0,
    } as never)
    const all = await getAllPages()
    const legacy = all.find((p) => p.id === 'legacy')
    expect(legacy?.kind).toBe('doc')
    expect(legacy?.isFavorite).toBe(false)
    expect(legacy?.properties).toEqual({})
  })
})
