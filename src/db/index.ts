/**
 * Migraciones IndexedDB (Dexie)
 * -----------------------------
 * Cada cambio de esquema DEBE:
 * 1. Añadir un nuevo `this.version(N).stores({...})` (nunca mutar versiones previas).
 * 2. Declarar de nuevo los índices de tablas existentes (si se omiten, Dexie puede borrarlos).
 * 3. Usar `.upgrade(tx => …)` para backfill de campos nuevos.
 * 4. Mantener `normalizePage` / `normalizeTag` defensivos para filas legacy.
 * Una instalación nueva ejecuta todas las versiones en cadena; una antigua solo las pendientes.
 */
import Dexie, { type Table } from 'dexie'
import { DEFAULT_TITLE } from '../lib/constants'
import { createId } from '../lib/id'
import type { ImportMode } from '../lib/backup'
import { rewritePageLinkTitles } from '../lib/pageLinks'
import { collectDescendantIds } from '../lib/tree'
import {
  defaultDatabaseSchema,
  defaultDatabaseViews,
  isLivePage,
  type AttachmentMeta,
  type Bookmark,
  type BookmarkFolder,
  type BookmarkTag,
  type Page,
  type PageKind,
  type PageRevision,
  type PropertyValue,
  type SavedView,
  type Tag,
  type TipTapDoc,
} from './types'

export function emptyDoc(): TipTapDoc {
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

export function normalizePage(raw: Partial<Page> & Pick<Page, 'id'>): Page {
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
    deletedAt: raw.deletedAt ?? null,
    isTemplate: raw.isTemplate ?? false,
    tagIds: raw.tagIds ?? [],
    dbSchema: raw.dbSchema,
    dbViews: raw.dbViews,
    activeViewId: raw.activeViewId ?? null,
  }
}

export function normalizeTag(raw: Partial<Tag> & Pick<Tag, 'id'>): Tag {
  return {
    id: raw.id,
    name: raw.name?.trim() || 'etiqueta',
    createdAt: raw.createdAt ?? Date.now(),
  }
}

export function normalizeBookmarkFolder(
  raw: Partial<BookmarkFolder> & Pick<BookmarkFolder, 'id'>,
): BookmarkFolder {
  return {
    id: raw.id,
    name: raw.name?.trim() || 'Carpeta',
    parentId: raw.parentId ?? null,
    order: raw.order ?? 0,
    createdAt: raw.createdAt ?? Date.now(),
  }
}

export function normalizeBookmarkTag(
  raw: Partial<BookmarkTag> & Pick<BookmarkTag, 'id'>,
): BookmarkTag {
  return {
    id: raw.id,
    name: raw.name?.trim() || 'etiqueta',
    createdAt: raw.createdAt ?? Date.now(),
  }
}

export function normalizeBookmark(raw: Partial<Bookmark> & Pick<Bookmark, 'id'>): Bookmark {
  return {
    id: raw.id,
    title: raw.title?.trim() || 'Sin título',
    url: raw.url?.trim() || '',
    folderId: raw.folderId ?? null,
    tagIds: Array.isArray(raw.tagIds) ? [...raw.tagIds] : [],
    notes: raw.notes?.trim() || '',
    order: raw.order ?? 0,
    createdAt: raw.createdAt ?? Date.now(),
    updatedAt: raw.updatedAt ?? Date.now(),
  }
}

export class AnotacionDB extends Dexie {
  pages!: Table<Page, string>
  tags!: Table<Tag, string>
  savedViews!: Table<SavedView, string>
  attachments!: Table<AttachmentMeta, string>
  revisions!: Table<PageRevision, string>
  bookmarkFolders!: Table<BookmarkFolder, string>
  bookmarkTags!: Table<BookmarkTag, string>
  bookmarks!: Table<Bookmark, string>

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
    // v3: soft-delete, templates, tagIds index + tags table
    this.version(3)
      .stores({
        pages: 'id, parentId, order, updatedAt, kind, isFavorite, deletedAt, isTemplate',
        tags: 'id, name',
      })
      .upgrade(async (tx) => {
        await tx
          .table('pages')
          .toCollection()
          .modify((page: Record<string, unknown>) => {
            if (page.deletedAt === undefined) page.deletedAt = null
            if (page.isTemplate == null) page.isTemplate = false
            if (page.tagIds == null) page.tagIds = []
          })
      })
    // v4: savedViews for productivity (filters in memory; properties stay unindexed JSON)
    this.version(4).stores({
      pages: 'id, parentId, order, updatedAt, kind, isFavorite, deletedAt, isTemplate',
      tags: 'id, name',
      savedViews: 'id, scope, updatedAt',
    })
    // v5: attachments metadata (blobs in OPFS)
    this.version(5).stores({
      pages: 'id, parentId, order, updatedAt, kind, isFavorite, deletedAt, isTemplate',
      tags: 'id, name',
      savedViews: 'id, scope, updatedAt',
      attachments: 'id, pageId, createdAt',
    })
    // v6: page revisions / version history
    this.version(6).stores({
      pages: 'id, parentId, order, updatedAt, kind, isFavorite, deletedAt, isTemplate',
      tags: 'id, name',
      savedViews: 'id, scope, updatedAt',
      attachments: 'id, pageId, createdAt',
      revisions: 'id, pageId, createdAt',
    })
    // v7: URL bookmarks with folders + tags
    this.version(7).stores({
      pages: 'id, parentId, order, updatedAt, kind, isFavorite, deletedAt, isTemplate',
      tags: 'id, name',
      savedViews: 'id, scope, updatedAt',
      attachments: 'id, pageId, createdAt',
      revisions: 'id, pageId, createdAt',
      bookmarkFolders: 'id, parentId, order',
      bookmarkTags: 'id, name',
      bookmarks: 'id, folderId, updatedAt',
    })
  }
}

export function normalizeSavedView(raw: Partial<SavedView> & Pick<SavedView, 'id'>): SavedView {
  return {
    id: raw.id,
    name: raw.name ?? 'Vista',
    scope: raw.scope === 'dashboard' ? 'dashboard' : 'tasks',
    filter: raw.filter,
    sort: raw.sort,
    widgets: raw.widgets,
    createdAt: raw.createdAt ?? Date.now(),
    updatedAt: raw.updatedAt ?? Date.now(),
  }
}

export const db = new AnotacionDB()

export async function getAllPages(): Promise<Page[]> {
  const rows = await db.pages.toArray()
  return rows.map((p) => normalizePage(p))
}

export async function getLivePages(): Promise<Page[]> {
  const all = await getAllPages()
  return all.filter(isLivePage)
}

export async function getTrashPages(): Promise<Page[]> {
  const all = await getAllPages()
  return all.filter((p) => !isLivePage(p)).sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0))
}

export async function getAllTags(): Promise<Tag[]> {
  const rows = await db.tags.toArray()
  return rows.map((t) => normalizeTag(t)).sort((a, b) => a.name.localeCompare(b.name))
}

export async function ensureBootstrapPage(): Promise<Page> {
  const live = (await getLivePages()).filter((p) => !p.isTemplate)
  if (live.length > 0) {
    const first = live.slice().sort((a, b) => a.order - b.order)[0]
    return first
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
    deletedAt: null,
    isTemplate: false,
    tagIds: [],
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
  isTemplate?: boolean
  tagIds?: string[]
}): Promise<Page> {
  const kind = input.kind ?? 'doc'
  const peers =
    input.parentId == null
      ? await db.pages.filter((p) => p.parentId === null && p.deletedAt == null).toArray()
      : await db.pages
          .where('parentId')
          .equals(input.parentId)
          .filter((p) => p.deletedAt == null)
          .toArray()
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
    deletedAt: null,
    isTemplate: input.isTemplate ?? false,
    tagIds: [...(input.tagIds ?? [])],
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
    isTemplate: page.isTemplate,
    tagIds: [...(page.tagIds ?? [])],
  })
}

export async function createPageFromTemplate(templateId: string): Promise<Page | null> {
  const source = await db.pages.get(templateId)
  if (!source) return null
  const page = normalizePage(source)
  if (!page.isTemplate) return null
  return createPage({
    parentId: null,
    title: page.title,
    kind: page.kind,
    properties: { ...page.properties },
    icon: page.icon,
    content: structuredClone(page.content),
    dbSchema: page.dbSchema ? structuredClone(page.dbSchema) : undefined,
    dbViews: page.dbViews ? structuredClone(page.dbViews) : undefined,
    activeViewId: page.activeViewId,
    isTemplate: false,
    tagIds: [...(page.tagIds ?? [])],
  })
}

export async function importPages(
  pages: Page[],
  options: {
    mode?: ImportMode
    tags?: Tag[]
    savedViews?: SavedView[]
    attachments?: AttachmentMeta[]
    bookmarkFolders?: BookmarkFolder[]
    bookmarkTags?: BookmarkTag[]
    bookmarks?: Bookmark[]
  } = {},
): Promise<number> {
  const mode = options.mode ?? 'merge'
  const normalized = pages.map((p) => normalizePage(p))
  const tags = (options.tags ?? []).map((t) => normalizeTag(t))
  const views = (options.savedViews ?? []).map((v) => normalizeSavedView(v))
  const attachments = options.attachments ?? []
  const bookmarkFolders = (options.bookmarkFolders ?? []).map((f) => normalizeBookmarkFolder(f))
  const bookmarkTags = (options.bookmarkTags ?? []).map((t) => normalizeBookmarkTag(t))
  const bookmarks = (options.bookmarks ?? []).map((b) => normalizeBookmark(b))

  await db.transaction(
    'rw',
    [
      db.pages,
      db.tags,
      db.savedViews,
      db.attachments,
      db.bookmarkFolders,
      db.bookmarkTags,
      db.bookmarks,
    ],
    async () => {
      if (mode === 'replace') {
        await db.pages.clear()
        await db.tags.clear()
        await db.savedViews.clear()
        await db.attachments.clear()
        await db.bookmarkFolders.clear()
        await db.bookmarkTags.clear()
        await db.bookmarks.clear()
      }
      if (normalized.length) await db.pages.bulkPut(normalized)
      if (tags.length) await db.tags.bulkPut(tags)
      if (views.length) await db.savedViews.bulkPut(views)
      if (attachments.length) await db.attachments.bulkPut(attachments)
      if (bookmarkFolders.length) await db.bookmarkFolders.bulkPut(bookmarkFolders)
      if (bookmarkTags.length) await db.bookmarkTags.bulkPut(bookmarkTags)
      if (bookmarks.length) await db.bookmarks.bulkPut(bookmarks)
    },
  )

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
      | 'deletedAt'
      | 'isTemplate'
      | 'tagIds'
    >
  >,
): Promise<void> {
  await db.pages.update(id, { ...patch, updatedAt: Date.now() })
}

/** Soft-delete page and descendants. */
export async function softDeletePageCascade(id: string): Promise<string[]> {
  const all = await getAllPages()
  const live = all.filter(isLivePage)
  const ids = collectDescendantIds(live, id)
  const now = Date.now()
  await db.transaction('rw', db.pages, async () => {
    for (const pageId of ids) {
      await db.pages.update(pageId, { deletedAt: now, updatedAt: now, isFavorite: false })
    }
  })
  return ids
}

export async function restorePages(ids: string[]): Promise<void> {
  const all = await getAllPages()
  const byId = new Map(all.map((p) => [p.id, p]))
  const restoring = new Set(ids)
  const now = Date.now()

  await db.transaction('rw', db.pages, async () => {
    for (const id of ids) {
      const page = byId.get(id)
      if (!page || page.deletedAt == null) continue
      let parentId = page.parentId
      if (parentId) {
        const parent = byId.get(parentId)
        const parentGone =
          !parent || (parent.deletedAt != null && !restoring.has(parentId))
        if (parentGone) parentId = null
      }
      await db.pages.update(id, { deletedAt: null, parentId, updatedAt: now })
      byId.set(id, { ...page, deletedAt: null, parentId })
    }
  })
}

export async function purgeTrash(ids?: string[]): Promise<number> {
  const trash = await getTrashPages()
  const target = ids ? trash.filter((p) => ids.includes(p.id)) : trash
  const deleteIds = target.map((p) => p.id)
  if (deleteIds.length) await db.pages.bulkDelete(deleteIds)
  return deleteIds.length
}

/** Hard delete (used only for purge / tests). */
export async function deletePageCascade(id: string): Promise<string[]> {
  const all = await getAllPages()
  const ids = collectDescendantIds(all, id)
  await db.pages.bulkDelete(ids)
  return ids
}

export async function syncPageLinkTitles(targetPageId: string, newTitle: string): Promise<number> {
  const all = await getAllPages()
  let updated = 0
  await db.transaction('rw', db.pages, async () => {
    for (const page of all) {
      if (page.id === targetPageId) continue
      const next = rewritePageLinkTitles(page.content, targetPageId, newTitle)
      if (next !== page.content) {
        await db.pages.update(page.id, { content: next, updatedAt: Date.now() })
        updated += 1
      }
    }
  })
  return updated
}

export async function createTag(name: string): Promise<Tag> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Nombre de etiqueta vacío')
  const existing = await getAllTags()
  const dup = existing.find((t) => t.name.toLowerCase() === trimmed.toLowerCase())
  if (dup) return dup
  const tag: Tag = { id: createId(), name: trimmed, createdAt: Date.now() }
  await db.tags.add(tag)
  return tag
}

export async function renameTag(id: string, name: string): Promise<void> {
  await db.tags.update(id, { name: name.trim() || 'etiqueta' })
}

export async function deleteTag(id: string): Promise<void> {
  await db.transaction('rw', db.pages, db.tags, async () => {
    await db.tags.delete(id)
    const pages = await db.pages.toArray()
    for (const page of pages) {
      const tagIds = page.tagIds ?? []
      if (!tagIds.includes(id)) continue
      await db.pages.update(page.id, {
        tagIds: tagIds.filter((t) => t !== id),
        updatedAt: Date.now(),
      })
    }
  })
}

export async function setPageTagIds(pageId: string, tagIds: string[]): Promise<void> {
  await updatePage(pageId, { tagIds: [...new Set(tagIds)] })
}

export async function getAllSavedViews(): Promise<SavedView[]> {
  return (await db.savedViews.toArray()).map(normalizeSavedView)
}

export async function upsertSavedView(view: SavedView): Promise<void> {
  await db.savedViews.put(normalizeSavedView({ ...view, updatedAt: Date.now() }))
}

export async function deleteSavedView(id: string): Promise<void> {
  await db.savedViews.delete(id)
}

export async function createInboxTask(input: {
  title: string
  due?: string | null
  priority?: 'low' | 'medium' | 'high' | null
}): Promise<Page> {
  return createPage({
    parentId: null,
    title: input.title.trim() || 'Nueva tarea',
    kind: 'doc',
    icon: '📥',
    properties: {
      inbox: true,
      status: 'Backlog',
      ...(input.due ? { due: input.due } : {}),
      ...(input.priority ? { priority: input.priority } : {}),
    },
  })
}

export async function getAttachmentsForPage(pageId: string): Promise<AttachmentMeta[]> {
  return db.attachments.where('pageId').equals(pageId).toArray()
}

export async function addAttachmentMeta(meta: AttachmentMeta): Promise<void> {
  await db.attachments.put(meta)
}

export async function deleteAttachmentMeta(id: string): Promise<void> {
  await db.attachments.delete(id)
}

export async function getAllAttachments(): Promise<AttachmentMeta[]> {
  return db.attachments.toArray()
}

const REVISION_KEEP = 20

export async function addRevision(page: Page): Promise<void> {
  const rev: PageRevision = {
    id: createId(),
    pageId: page.id,
    title: page.title,
    content: structuredClone(page.content),
    properties: { ...page.properties },
    createdAt: Date.now(),
  }
  await db.revisions.add(rev)
  const all = await db.revisions.where('pageId').equals(page.id).sortBy('createdAt')
  if (all.length > REVISION_KEEP) {
    const drop = all.slice(0, all.length - REVISION_KEEP)
    await db.revisions.bulkDelete(drop.map((r) => r.id))
  }
}

export async function listRevisions(pageId: string): Promise<PageRevision[]> {
  return (await db.revisions.where('pageId').equals(pageId).sortBy('createdAt')).reverse()
}

export async function restoreRevision(revisionId: string): Promise<Page | null> {
  const rev = await db.revisions.get(revisionId)
  if (!rev) return null
  await updatePage(rev.pageId, {
    title: rev.title,
    content: structuredClone(rev.content),
    properties: { ...rev.properties },
  })
  const page = await db.pages.get(rev.pageId)
  return page ? normalizePage(page) : null
}

// --- Bookmarks (URLs) ---

export async function getAllBookmarkFolders(): Promise<BookmarkFolder[]> {
  return (await db.bookmarkFolders.toArray())
    .map((f) => normalizeBookmarkFolder(f))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
}

export async function getAllBookmarkTags(): Promise<BookmarkTag[]> {
  return (await db.bookmarkTags.toArray())
    .map((t) => normalizeBookmarkTag(t))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getAllBookmarks(): Promise<Bookmark[]> {
  return (await db.bookmarks.toArray())
    .map((b) => normalizeBookmark(b))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
}

export async function createBookmarkFolder(input: {
  name: string
  parentId?: string | null
}): Promise<BookmarkFolder> {
  const peers = await db.bookmarkFolders
    .filter((f) => f.parentId === (input.parentId ?? null))
    .toArray()
  const order = peers.reduce((max, f) => Math.max(max, f.order), -1) + 1
  const folder: BookmarkFolder = {
    id: createId(),
    name: input.name.trim() || 'Carpeta',
    parentId: input.parentId ?? null,
    order,
    createdAt: Date.now(),
  }
  await db.bookmarkFolders.add(folder)
  return folder
}

export async function updateBookmarkFolder(
  id: string,
  patch: Partial<Pick<BookmarkFolder, 'name' | 'parentId' | 'order'>>,
): Promise<void> {
  await db.bookmarkFolders.update(id, {
    ...patch,
    ...(patch.name != null ? { name: patch.name.trim() || 'Carpeta' } : {}),
  })
}

/** Borrar carpeta: bookmarks pasan a sin carpeta; subcarpetas suben a parentId de la borrada. */
export async function deleteBookmarkFolder(id: string): Promise<void> {
  const folder = await db.bookmarkFolders.get(id)
  if (!folder) return
  await db.transaction('rw', db.bookmarkFolders, db.bookmarks, async () => {
    const children = await db.bookmarkFolders.where('parentId').equals(id).toArray()
    for (const child of children) {
      await db.bookmarkFolders.update(child.id, { parentId: folder.parentId })
    }
    const marks = await db.bookmarks.where('folderId').equals(id).toArray()
    for (const bm of marks) {
      await db.bookmarks.update(bm.id, { folderId: null, updatedAt: Date.now() })
    }
    await db.bookmarkFolders.delete(id)
  })
}

export async function createBookmarkTag(name: string): Promise<BookmarkTag> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Nombre de etiqueta vacío')
  const existing = await getAllBookmarkTags()
  const dup = existing.find((t) => t.name.toLowerCase() === trimmed.toLowerCase())
  if (dup) return dup
  const tag: BookmarkTag = { id: createId(), name: trimmed, createdAt: Date.now() }
  await db.bookmarkTags.add(tag)
  return tag
}

export async function renameBookmarkTag(id: string, name: string): Promise<void> {
  await db.bookmarkTags.update(id, { name: name.trim() || 'etiqueta' })
}

export async function deleteBookmarkTag(id: string): Promise<void> {
  await db.transaction('rw', db.bookmarkTags, db.bookmarks, async () => {
    await db.bookmarkTags.delete(id)
    const marks = await db.bookmarks.toArray()
    for (const bm of marks) {
      const tagIds = bm.tagIds ?? []
      if (!tagIds.includes(id)) continue
      await db.bookmarks.update(bm.id, {
        tagIds: tagIds.filter((t) => t !== id),
        updatedAt: Date.now(),
      })
    }
  })
}

export function isValidBookmarkUrl(url: string): boolean {
  try {
    const u = new URL(url.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export async function createBookmark(input: {
  title: string
  url: string
  folderId?: string | null
  tagIds?: string[]
  notes?: string
}): Promise<Bookmark> {
  const url = input.url.trim()
  if (!isValidBookmarkUrl(url)) throw new Error('URL inválida (usa http:// o https://)')
  const folderId = input.folderId ?? null
  const peers =
    folderId == null
      ? await db.bookmarks.filter((b) => b.folderId == null).toArray()
      : await db.bookmarks.where('folderId').equals(folderId).toArray()
  const order = peers.reduce((max, b) => Math.max(max, b.order), -1) + 1
  const now = Date.now()
  const bookmark: Bookmark = {
    id: createId(),
    title: input.title.trim() || url,
    url,
    folderId,
    tagIds: [...new Set(input.tagIds ?? [])],
    notes: input.notes?.trim() || '',
    order,
    createdAt: now,
    updatedAt: now,
  }
  await db.bookmarks.add(bookmark)
  return bookmark
}

export async function updateBookmark(
  id: string,
  patch: Partial<Pick<Bookmark, 'title' | 'url' | 'folderId' | 'tagIds' | 'notes' | 'order'>>,
): Promise<void> {
  if (patch.url != null && !isValidBookmarkUrl(patch.url)) {
    throw new Error('URL inválida (usa http:// o https://)')
  }
  await db.bookmarks.update(id, {
    ...patch,
    ...(patch.url != null ? { url: patch.url.trim() } : {}),
    ...(patch.title != null ? { title: patch.title.trim() || 'Sin título' } : {}),
    ...(patch.notes != null ? { notes: patch.notes.trim() } : {}),
    ...(patch.tagIds != null ? { tagIds: [...new Set(patch.tagIds)] } : {}),
    updatedAt: Date.now(),
  })
}

export async function deleteBookmark(id: string): Promise<void> {
  await db.bookmarks.delete(id)
}
