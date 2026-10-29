import type {
  AttachmentMeta,
  Bookmark,
  BookmarkFolder,
  BookmarkTag,
  Page,
  PageKind,
  SavedView,
  Tag,
  TipTapDoc,
} from '../db/types'
import { findBrokenPageLinks } from './pageLinks'

export const BACKUP_VERSION = 6 as const

export type BackupVersion = 1 | 2 | 3 | 4 | 5 | 6

export interface BackupPayload {
  version: BackupVersion
  exportedAt: number
  pages: Page[]
  tags?: Tag[]
  savedViews?: SavedView[]
  attachments?: AttachmentMeta[]
  bookmarkFolders?: BookmarkFolder[]
  bookmarkTags?: BookmarkTag[]
  bookmarks?: Bookmark[]
}

export type ImportMode = 'merge' | 'replace'

export interface ImportRejection {
  index: number
  reason: string
}

export interface ImportReport {
  accepted: Page[]
  rejected: ImportRejection[]
  orphanParentIds: string[]
  brokenPageLinks: { fromPageId: string; targetId: string }[]
  tags: Tag[]
  savedViews: SavedView[]
  attachments: AttachmentMeta[]
  bookmarkFolders: BookmarkFolder[]
  bookmarkTags: BookmarkTag[]
  bookmarks: Bookmark[]
  version: BackupVersion | null
}

const PAGE_KINDS: PageKind[] = ['doc', 'board', 'database']
const SUPPORTED = new Set([1, 2, 3, 4, 5, 6])

export function buildBackup(
  pages: Page[],
  tags: Tag[] = [],
  savedViews: SavedView[] = [],
  attachments: AttachmentMeta[] = [],
  bookmarkFolders: BookmarkFolder[] = [],
  bookmarkTags: BookmarkTag[] = [],
  bookmarks: Bookmark[] = [],
): BackupPayload {
  return {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    pages,
    tags,
    savedViews,
    attachments,
    bookmarkFolders,
    bookmarkTags,
    bookmarks,
  }
}

export function analyzeBackup(raw: unknown): ImportReport {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Backup inválido')
  }
  const data = raw as Partial<BackupPayload>
  if (!Array.isArray(data.pages)) {
    throw new Error('Backup sin páginas')
  }

  const version =
    data.version == null
      ? 1
      : SUPPORTED.has(data.version as number)
        ? (data.version as BackupVersion)
        : null

  if (data.version != null && version == null) {
    throw new Error(`Versión de respaldo no soportada: ${String(data.version)}`)
  }

  const accepted: Page[] = []
  const rejected: ImportRejection[] = []

  data.pages.forEach((entry, index) => {
    const parsed = parsePageEntry(entry)
    if ('error' in parsed) {
      rejected.push({ index, reason: parsed.error })
      return
    }
    accepted.push(parsed.page)
  })

  const ids = new Set(accepted.map((p) => p.id))
  const orphanParentIds = [
    ...new Set(
      accepted
        .map((p) => p.parentId)
        .filter((pid): pid is string => typeof pid === 'string' && !ids.has(pid)),
    ),
  ]

  const brokenPageLinks: ImportReport['brokenPageLinks'] = []
  for (const page of accepted) {
    for (const targetId of findBrokenPageLinks(page.content, ids)) {
      brokenPageLinks.push({ fromPageId: page.id, targetId })
    }
  }

  const tags = Array.isArray(data.tags)
    ? data.tags.filter(isTag).map((t) => ({
        id: t.id,
        name: String(t.name).trim() || 'etiqueta',
        createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
      }))
    : []

  const savedViews = Array.isArray(data.savedViews)
    ? data.savedViews.filter(
        (v): v is SavedView => !!v && typeof v === 'object' && typeof (v as SavedView).id === 'string',
      )
    : []

  const attachments = Array.isArray(data.attachments)
    ? data.attachments.filter(
        (a): a is AttachmentMeta =>
          !!a && typeof a === 'object' && typeof (a as AttachmentMeta).id === 'string',
      )
    : []

  const bookmarkFolders = Array.isArray(data.bookmarkFolders)
    ? data.bookmarkFolders.filter(isBookmarkFolder).map((f) => ({
        id: f.id,
        name: String(f.name).trim() || 'Carpeta',
        parentId: f.parentId == null ? null : String(f.parentId),
        order: typeof f.order === 'number' ? f.order : 0,
        createdAt: typeof f.createdAt === 'number' ? f.createdAt : Date.now(),
      }))
    : []

  const bookmarkTags = Array.isArray(data.bookmarkTags)
    ? data.bookmarkTags.filter(isBookmarkTag).map((t) => ({
        id: t.id,
        name: String(t.name).trim() || 'etiqueta',
        createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
      }))
    : []

  const bookmarks = Array.isArray(data.bookmarks)
    ? data.bookmarks.filter(isBookmark).map((b) => ({
        id: b.id,
        title: String(b.title).trim() || 'Sin título',
        url: String(b.url).trim(),
        folderId: b.folderId == null ? null : String(b.folderId),
        tagIds: Array.isArray(b.tagIds)
          ? b.tagIds.filter((id): id is string => typeof id === 'string')
          : [],
        notes: typeof b.notes === 'string' ? b.notes : '',
        order: typeof b.order === 'number' ? b.order : 0,
        createdAt: typeof b.createdAt === 'number' ? b.createdAt : Date.now(),
        updatedAt: typeof b.updatedAt === 'number' ? b.updatedAt : Date.now(),
      }))
    : []

  return {
    accepted,
    rejected,
    orphanParentIds,
    brokenPageLinks,
    tags,
    savedViews,
    attachments,
    bookmarkFolders,
    bookmarkTags,
    bookmarks,
    version: version ?? 1,
  }
}

export function parseBackup(raw: unknown): Page[] {
  return analyzeBackup(raw).accepted
}

export function downloadBackupJson(
  pages: Page[],
  tags: Tag[] = [],
  savedViews: SavedView[] = [],
  attachments: AttachmentMeta[] = [],
  bookmarkFolders: BookmarkFolder[] = [],
  bookmarkTags: BookmarkTag[] = [],
  bookmarks: Bookmark[] = [],
  filename = 'anotaciones-backup.json',
) {
  const blob = new Blob(
    [
      JSON.stringify(
        buildBackup(pages, tags, savedViews, attachments, bookmarkFolders, bookmarkTags, bookmarks),
        null,
        2,
      ),
    ],
    { type: 'application/json' },
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function parsePageEntry(entry: unknown): { page: Page } | { error: string } {
  if (!entry || typeof entry !== 'object') return { error: 'entrada no es un objeto' }
  const raw = entry as Record<string, unknown>
  if (typeof raw.id !== 'string' || !raw.id) return { error: 'falta id' }
  if (raw.parentId != null && typeof raw.parentId !== 'string') {
    return { error: 'parentId inválido' }
  }
  if (raw.kind != null && !PAGE_KINDS.includes(raw.kind as PageKind)) {
    return { error: 'kind inválido' }
  }
  if (raw.createdAt != null && typeof raw.createdAt !== 'number') {
    return { error: 'createdAt inválido' }
  }
  if (raw.updatedAt != null && typeof raw.updatedAt !== 'number') {
    return { error: 'updatedAt inválido' }
  }
  if (raw.order != null && typeof raw.order !== 'number') {
    return { error: 'order inválido' }
  }
  if (raw.content != null && (typeof raw.content !== 'object' || Array.isArray(raw.content))) {
    return { error: 'content inválido' }
  }

  const tagIds = Array.isArray(raw.tagIds)
    ? raw.tagIds.filter((id): id is string => typeof id === 'string')
    : []

  const page: Page = {
    id: raw.id,
    parentId: (raw.parentId as string | null | undefined) ?? null,
    title: typeof raw.title === 'string' ? raw.title : 'Sin título',
    icon: typeof raw.icon === 'string' ? raw.icon : null,
    content:
      (raw.content as TipTapDoc | undefined) ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
    order: typeof raw.order === 'number' ? raw.order : 0,
    kind: (raw.kind as PageKind | undefined) ?? 'doc',
    isFavorite: Boolean(raw.isFavorite),
    properties:
      raw.properties && typeof raw.properties === 'object' && !Array.isArray(raw.properties)
        ? (raw.properties as Page['properties'])
        : {},
    deletedAt: typeof raw.deletedAt === 'number' ? raw.deletedAt : null,
    isTemplate: Boolean(raw.isTemplate),
    tagIds,
    dbSchema: Array.isArray(raw.dbSchema) ? (raw.dbSchema as Page['dbSchema']) : undefined,
    dbViews: Array.isArray(raw.dbViews) ? (raw.dbViews as Page['dbViews']) : undefined,
    activeViewId:
      raw.activeViewId == null
        ? null
        : typeof raw.activeViewId === 'string'
          ? raw.activeViewId
          : null,
  }

  return { page }
}

function isTag(value: unknown): value is Tag {
  return !!value && typeof value === 'object' && typeof (value as Tag).id === 'string'
}

function isBookmarkFolder(value: unknown): value is BookmarkFolder {
  return !!value && typeof value === 'object' && typeof (value as BookmarkFolder).id === 'string'
}

function isBookmarkTag(value: unknown): value is BookmarkTag {
  return !!value && typeof value === 'object' && typeof (value as BookmarkTag).id === 'string'
}

function isBookmark(value: unknown): value is Bookmark {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as Bookmark).id === 'string' &&
    typeof (value as Bookmark).url === 'string'
  )
}
