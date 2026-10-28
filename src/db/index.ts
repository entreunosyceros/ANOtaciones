import Dexie, { type Table } from 'dexie'
import { DEFAULT_TITLE } from '../lib/constants'
import { createId } from '../lib/id'
import { collectDescendantIds } from '../lib/tree'
import {
  defaultDatabaseSchema,
  defaultDatabaseViews,
  type Page,
  type PageKind,
  type PropertyValue,
  type TipTapDoc,
} from './types'

export function emptyDoc(): TipTapDoc {
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

function normalizePage(raw: Partial<Page> & Pick<Page, 'id'>): Page {
  return {
    id: raw.id,
    parentId: raw.parentId ?? null,
    title: raw.title ?? DEFAULT_TITLE,
    icon: raw.icon ?? null,
    content: raw.content ?? emptyDoc(),
    createdAt: raw.createdAt ?? Date.now(),
    updatedAt: raw.updatedAt ?? Date.now(),
    order: raw.order ?? 0,
    kind: raw.kind ?? 'doc',
    isFavorite: raw.isFavorite ?? false,
    properties: raw.properties ?? {},
    dbSchema: raw.dbSchema,
    dbViews: raw.dbViews,
    activeViewId: raw.activeViewId ?? null,
  }
}

export class AnotacionDB extends Dexie {
  pages!: Table<Page, string>

  constructor() {
    super('anotacion')
    this.version(1).stores({
      pages: 'id, parentId, order, updatedAt',
    })
    this.version(2)
      .stores({
        pages: 'id, parentId, order, updatedAt, kind, isFavorite',
      })
      .upgrade(async (tx) => {
        await tx
          .table('pages')
          .toCollection()
          .modify((page: Record<string, unknown>) => {
            if (page.kind == null) page.kind = 'doc'
            if (page.isFavorite == null) page.isFavorite = false
            if (page.properties == null) page.properties = {}
          })
      })
  }
}

export const db = new AnotacionDB()

export async function getAllPages(): Promise<Page[]> {
  const rows = await db.pages.toArray()
  return rows.map((p) => normalizePage(p))
}

export async function ensureBootstrapPage(): Promise<Page> {
  const count = await db.pages.count()
  if (count > 0) {
    const first = await db.pages.orderBy('order').first()
    if (!first) throw new Error('pages count > 0 but empty')
    return normalizePage(first)
  }

  const now = Date.now()
  const page: Page = {
    id: createId(),
    parentId: null,
    title: DEFAULT_TITLE,
    icon: null,
    content: emptyDoc(),
    createdAt: now,
    updatedAt: now,
    order: 0,
    kind: 'doc',
    isFavorite: false,
    properties: {},
  }
  await db.pages.add(page)
  return page
}

export async function createPage(input: {
  parentId: string | null
  title?: string
  kind?: PageKind
  properties?: Record<string, PropertyValue>
  icon?: string | null
  content?: TipTapDoc
  dbSchema?: Page['dbSchema']
  dbViews?: Page['dbViews']
  activeViewId?: string | null
}): Promise<Page> {
  const kind = input.kind ?? 'doc'
  const all = await db.pages.toArray()
  const peers = all.filter((p) => p.parentId === input.parentId)
  const order = peers.reduce((max, p) => Math.max(max, p.order), -1) + 1
  const now = Date.now()

  const page: Page = {
    id: createId(),
    parentId: input.parentId,
    title:
      input.title ??
      (kind === 'board'
        ? 'Nuevo tablero'
        : kind === 'database'
          ? 'Nueva base de datos'
          : DEFAULT_TITLE),
    icon: input.icon ?? null,
    content: input.content ?? emptyDoc(),
    createdAt: now,
    updatedAt: now,
    order,
    kind,
    isFavorite: false,
    properties: { ...(input.properties ?? {}) },
    ...(kind === 'database'
      ? {
          dbSchema: input.dbSchema ?? defaultDatabaseSchema(),
          dbViews: input.dbViews ?? defaultDatabaseViews(),
          activeViewId: input.activeViewId ?? 'table',
        }
      : {
          ...(input.dbSchema ? { dbSchema: input.dbSchema } : {}),
          ...(input.dbViews ? { dbViews: input.dbViews } : {}),
          ...(input.activeViewId != null ? { activeViewId: input.activeViewId } : {}),
        }),
  }
  await db.pages.add(page)
  return page
}

export async function duplicatePage(id: string): Promise<Page | null> {
  const source = await db.pages.get(id)
  if (!source) return null
  const page = normalizePage(source)
  return createPage({
    parentId: page.parentId,
    title: `${page.title} (copia)`,
    kind: page.kind,
    properties: { ...page.properties },
    icon: page.icon,
    content: structuredClone(page.content),
    dbSchema: page.dbSchema ? structuredClone(page.dbSchema) : undefined,
    dbViews: page.dbViews ? structuredClone(page.dbViews) : undefined,
    activeViewId: page.activeViewId,
  })
}

export async function importPages(pages: Page[]): Promise<number> {
  const normalized = pages.map((p) => normalizePage(p))
  await db.pages.bulkPut(normalized)
  return normalized.length
}

export async function updatePage(
  id: string,
  patch: Partial<
    Pick<
      Page,
      | 'title'
      | 'icon'
      | 'content'
      | 'order'
      | 'parentId'
      | 'kind'
      | 'isFavorite'
      | 'properties'
      | 'dbSchema'
      | 'dbViews'
      | 'activeViewId'
    >
  >,
): Promise<void> {
  await db.pages.update(id, { ...patch, updatedAt: Date.now() })
}

export async function deletePageCascade(id: string): Promise<string[]> {
  const all = await getAllPages()
  const ids = collectDescendantIds(all, id)
  await db.pages.bulkDelete(ids)
  return ids
}

export async function getChildPages(parentId: string): Promise<Page[]> {
  const all = await getAllPages()
  return all
    .filter((p) => p.parentId === parentId)
    .sort((a, b) => a.order - b.order)
}
