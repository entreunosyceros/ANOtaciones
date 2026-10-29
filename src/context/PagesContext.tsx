import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  addRevision,
  createBookmark as dbCreateBookmark,
  createBookmarkFolder as dbCreateBookmarkFolder,
  createBookmarkTag as dbCreateBookmarkTag,
  createInboxTask as dbCreateInboxTask,
  createPage as dbCreatePage,
  createPageFromTemplate as dbCreateFromTemplate,
  createTag as dbCreateTag,
  deleteBookmark as dbDeleteBookmark,
  deleteBookmarkFolder as dbDeleteBookmarkFolder,
  deleteBookmarkTag as dbDeleteBookmarkTag,
  deleteSavedView as dbDeleteSavedView,
  deleteTag as dbDeleteTag,
  duplicatePage as dbDuplicatePage,
  ensureBootstrapPage,
  getAllAttachments,
  getAllBookmarkFolders,
  getAllBookmarks,
  getAllBookmarkTags,
  getAllPages,
  getAllSavedViews,
  getAllTags,
  importPages,
  listRevisions as dbListRevisions,
  purgeTrash as dbPurgeTrash,
  renameBookmarkTag as dbRenameBookmarkTag,
  restorePages as dbRestorePages,
  restoreRevision as dbRestoreRevision,
  setPageTagIds as dbSetPageTagIds,
  softDeletePageCascade,
  syncPageLinkTitles,
  updateBookmark as dbUpdateBookmark,
  updateBookmarkFolder as dbUpdateBookmarkFolder,
  updatePage,
  upsertSavedView as dbUpsertSavedView,
} from '../db'
import type {
  AttachmentMeta,
  Bookmark,
  BookmarkFolder,
  BookmarkTag,
  Page,
  PageKind,
  PageNode,
  PageRevision,
  PropertyValue,
  SavedView,
  Tag,
  TipTapDoc,
} from '../db/types'
import { isLivePage } from '../db/types'
import { createId } from '../lib/id'
import { repairOrphanParents } from '../lib/diagnostics'
import type { ImportMode, ImportReport } from '../lib/backup'
import { analyzeBackup } from '../lib/backup'
import { rewritePageLinkTitles } from '../lib/pageLinks'
import { pushRecentId, readRecentIds } from '../lib/recents'
import { dailyNoteContent, findDailyNote, resolveDateTitle } from '../lib/dailyNote'
import { buildTree } from '../lib/tree'
import { isEmptyDoc } from '../lib/emptyDoc'

const ACTIVE_KEY = 'anotacion-active-page'

interface PagesContextValue {
  pages: Page[]
  allPages: Page[]
  trashPages: Page[]
  templates: Page[]
  tags: Tag[]
  tree: PageNode[]
  favorites: Page[]
  recents: Page[]
  activePageId: string | null
  activePage: Page | null
  loading: boolean
  showWelcome: boolean
  setActivePageId: (id: string) => void
  createPage: (input: {
    parentId: string | null
    title?: string
    kind?: PageKind
    properties?: Record<string, PropertyValue>
    open?: boolean
    content?: TipTapDoc
    icon?: string | null
    isTemplate?: boolean
    tagIds?: string[]
  }) => Promise<Page>
  deletePage: (id: string) => Promise<void>
  restorePages: (ids: string[]) => Promise<void>
  purgeTrash: (ids?: string[]) => Promise<void>
  renamePage: (id: string, title: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  duplicatePage: (id: string) => Promise<Page | null>
  createFromTemplate: (templateId: string) => Promise<Page | null>
  markAsTemplate: (id: string, isTemplate: boolean) => Promise<void>
  openOrCreateDailyNote: (date?: string | Date) => Promise<Page>
  createDayTask: (input: { title: string; due: string }) => Promise<Page>
  importBackup: (raw: unknown, mode?: ImportMode) => Promise<ImportReport>
  createTag: (name: string) => Promise<Tag>
  deleteTag: (id: string) => Promise<void>
  setPageTags: (pageId: string, tagIds: string[]) => Promise<void>
  patchPage: (
    id: string,
    patch: Parameters<typeof updatePage>[1],
  ) => Promise<void>
  refresh: () => Promise<void>
  savedViews: SavedView[]
  attachments: AttachmentMeta[]
  bookmarkFolders: BookmarkFolder[]
  bookmarkTags: BookmarkTag[]
  bookmarks: Bookmark[]
  createBookmarkFolder: (input: { name: string; parentId?: string | null }) => Promise<BookmarkFolder>
  updateBookmarkFolder: (
    id: string,
    patch: Partial<Pick<BookmarkFolder, 'name' | 'parentId' | 'order'>>,
  ) => Promise<void>
  deleteBookmarkFolder: (id: string) => Promise<void>
  createBookmarkTag: (name: string) => Promise<BookmarkTag>
  renameBookmarkTag: (id: string, name: string) => Promise<void>
  deleteBookmarkTag: (id: string) => Promise<void>
  createBookmark: (input: {
    title: string
    url: string
    folderId?: string | null
    tagIds?: string[]
    notes?: string
  }) => Promise<Bookmark>
  updateBookmark: (
    id: string,
    patch: Partial<Pick<Bookmark, 'title' | 'url' | 'folderId' | 'tagIds' | 'notes' | 'order'>>,
  ) => Promise<void>
  deleteBookmark: (id: string) => Promise<void>
  createInboxTask: (input: {
    title: string
    due?: string | null
    priority?: 'low' | 'medium' | 'high' | null
  }) => Promise<Page>
  saveView: (view: Omit<SavedView, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<SavedView>
  deleteView: (id: string) => Promise<void>
  listPageRevisions: (pageId: string) => Promise<PageRevision[]>
  restorePageRevision: (revisionId: string) => Promise<void>
  snapshotRevision: (pageId: string) => Promise<void>
  repairOrphans: () => Promise<number>
}

const PagesContext = createContext<PagesContextValue | null>(null)

function pickActiveId(pages: Page[], preferred: string | null): string | null {
  const live = pages.filter((p) => isLivePage(p) && !p.isTemplate)
  if (preferred && live.some((p) => p.id === preferred)) return preferred
  const roots = live.filter((p) => p.parentId === null).sort((a, b) => a.order - b.order)
  return roots[0]?.id ?? live[0]?.id ?? null
}

export function PagesProvider({ children }: { children: ReactNode }) {
  const [allPages, setAllPages] = useState<Page[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([])
  const [bookmarkFolders, setBookmarkFolders] = useState<BookmarkFolder[]>([])
  const [bookmarkTags, setBookmarkTags] = useState<BookmarkTag[]>([])
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [activePageId, setActivePageIdState] = useState<string | null>(null)
  const [recentIds, setRecentIds] = useState<string[]>(() => readRecentIds())
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const [pagesRows, tagRows, viewRows, attRows, folderRows, bmTagRows, bmRows] =
      await Promise.all([
        getAllPages(),
        getAllTags(),
        getAllSavedViews(),
        getAllAttachments(),
        getAllBookmarkFolders(),
        getAllBookmarkTags(),
        getAllBookmarks(),
      ])
    setAllPages(pagesRows)
    setTags(tagRows)
    setSavedViews(viewRows)
    setAttachments(attRows)
    setBookmarkFolders(folderRows)
    setBookmarkTags(bmTagRows)
    setBookmarks(bmRows)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await ensureBootstrapPage()
      const [pagesRows, tagRows, viewRows, attRows, folderRows, bmTagRows, bmRows] =
        await Promise.all([
          getAllPages(),
          getAllTags(),
          getAllSavedViews(),
          getAllAttachments(),
          getAllBookmarkFolders(),
          getAllBookmarkTags(),
          getAllBookmarks(),
        ])
      if (cancelled) return
      setAllPages(pagesRows)
      setTags(tagRows)
      setSavedViews(viewRows)
      setAttachments(attRows)
      setBookmarkFolders(folderRows)
      setBookmarkTags(bmTagRows)
      setBookmarks(bmRows)
      const stored = localStorage.getItem(ACTIVE_KEY)
      const next = pickActiveId(pagesRows, stored)
      setActivePageIdState(next)
      if (next) {
        localStorage.setItem(ACTIVE_KEY, next)
        setRecentIds(pushRecentId(next))
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const pages = useMemo(
    () => allPages.filter((p) => isLivePage(p) && !p.isTemplate),
    [allPages],
  )
  const trashPages = useMemo(
    () =>
      allPages
        .filter((p) => !isLivePage(p))
        .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0)),
    [allPages],
  )
  const templates = useMemo(
    () => allPages.filter((p) => isLivePage(p) && !!p.isTemplate),
    [allPages],
  )

  const setActivePageId = useCallback((id: string) => {
    setActivePageIdState(id)
    localStorage.setItem(ACTIVE_KEY, id)
    setRecentIds(pushRecentId(id))
  }, [])

  const createPage = useCallback(
    async (input: {
      parentId: string | null
      title?: string
      kind?: PageKind
      properties?: Record<string, PropertyValue>
      open?: boolean
      content?: TipTapDoc
      icon?: string | null
      isTemplate?: boolean
      tagIds?: string[]
    }) => {
      const { open = true, ...rest } = input
      const page = await dbCreatePage(rest)
      await refresh()
      if (open) setActivePageId(page.id)
      return page
    },
    [refresh, setActivePageId],
  )

  const deletePage = useCallback(
    async (id: string) => {
      const deleted = await softDeletePageCascade(id)
      let rows = await getAllPages()
      const live = rows.filter((p) => isLivePage(p) && !p.isTemplate)
      if (live.length === 0) {
        await ensureBootstrapPage()
        rows = await getAllPages()
      }
      setAllPages(rows)
      if (activePageId && deleted.includes(activePageId)) {
        const next = pickActiveId(rows, null)
        setActivePageIdState(next)
        if (next) {
          localStorage.setItem(ACTIVE_KEY, next)
          setRecentIds(pushRecentId(next))
        }
      }
    },
    [activePageId],
  )

  const restorePages = useCallback(
    async (ids: string[]) => {
      await dbRestorePages(ids)
      await refresh()
    },
    [refresh],
  )

  const purgeTrash = useCallback(
    async (ids?: string[]) => {
      await dbPurgeTrash(ids)
      await refresh()
    },
    [refresh],
  )

  const renamePage = useCallback(async (id: string, title: string) => {
    setAllPages((prev) =>
      prev.map((p) => {
        if (p.id === id) return { ...p, title, updatedAt: Date.now() }
        const nextContent = rewritePageLinkTitles(p.content, id, title)
        if (nextContent === p.content) return p
        return { ...p, content: nextContent }
      }),
    )
    await updatePage(id, { title })
    await syncPageLinkTitles(id, title)
  }, [])

  const toggleFavorite = useCallback(
    async (id: string) => {
      const page = allPages.find((p) => p.id === id)
      if (!page) return
      const nextFavorite = !page.isFavorite
      setAllPages((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, isFavorite: nextFavorite, updatedAt: Date.now() } : p,
        ),
      )
      await updatePage(id, { isFavorite: nextFavorite })
    },
    [allPages],
  )

  const duplicatePage = useCallback(
    async (id: string) => {
      const page = await dbDuplicatePage(id)
      await refresh()
      if (page) setActivePageId(page.id)
      return page
    },
    [refresh, setActivePageId],
  )

  const createFromTemplate = useCallback(
    async (templateId: string) => {
      const page = await dbCreateFromTemplate(templateId)
      await refresh()
      if (page) setActivePageId(page.id)
      return page
    },
    [refresh, setActivePageId],
  )

  const markAsTemplate = useCallback(
    async (id: string, isTemplate: boolean) => {
      await updatePage(id, { isTemplate })
      await refresh()
    },
    [refresh],
  )

  const openOrCreateDailyNote = useCallback(
    async (date?: string | Date) => {
      const title = resolveDateTitle(date)
      const existing = findDailyNote(pages, title)
      if (existing) {
        setActivePageId(existing.id)
        return existing
      }
      return createPage({
        parentId: null,
        title,
        kind: 'doc',
        icon: '📅',
        content: dailyNoteContent(title),
      })
    },
    [pages, createPage, setActivePageId],
  )

  const createDayTask = useCallback(
    async (input: { title: string; due: string }) => {
      return createPage({
        parentId: null,
        title: input.title.trim() || 'Nueva tarea',
        kind: 'doc',
        icon: '✅',
        properties: {
          due: input.due.slice(0, 10),
          status: 'Backlog',
          inbox: false,
        },
        open: false,
      })
    },
    [createPage],
  )

  const importBackup = useCallback(
    async (raw: unknown, mode: ImportMode = 'merge') => {
      const report = analyzeBackup(raw)
      await importPages(report.accepted, {
        mode,
        tags: report.tags,
        savedViews: report.savedViews,
        attachments: report.attachments,
        bookmarkFolders: report.bookmarkFolders,
        bookmarkTags: report.bookmarkTags,
        bookmarks: report.bookmarks,
      })
      await refresh()
      let rows = await getAllPages()
      if (rows.filter((p) => isLivePage(p) && !p.isTemplate).length === 0) {
        await ensureBootstrapPage()
        rows = await getAllPages()
        setAllPages(rows)
      }
      const next = pickActiveId(rows, activePageId)
      if (next) setActivePageId(next)
      return report
    },
    [refresh, activePageId, setActivePageId],
  )

  const createBookmarkFolder = useCallback(
    async (input: { name: string; parentId?: string | null }) => {
      const folder = await dbCreateBookmarkFolder(input)
      await refresh()
      return folder
    },
    [refresh],
  )

  const updateBookmarkFolderFn = useCallback(
    async (
      id: string,
      patch: Partial<Pick<BookmarkFolder, 'name' | 'parentId' | 'order'>>,
    ) => {
      await dbUpdateBookmarkFolder(id, patch)
      await refresh()
    },
    [refresh],
  )

  const deleteBookmarkFolderFn = useCallback(
    async (id: string) => {
      await dbDeleteBookmarkFolder(id)
      await refresh()
    },
    [refresh],
  )

  const createBookmarkTagFn = useCallback(
    async (name: string) => {
      const tag = await dbCreateBookmarkTag(name)
      await refresh()
      return tag
    },
    [refresh],
  )

  const renameBookmarkTagFn = useCallback(
    async (id: string, name: string) => {
      await dbRenameBookmarkTag(id, name)
      await refresh()
    },
    [refresh],
  )

  const deleteBookmarkTagFn = useCallback(
    async (id: string) => {
      await dbDeleteBookmarkTag(id)
      await refresh()
    },
    [refresh],
  )

  const createBookmarkFn = useCallback(
    async (input: {
      title: string
      url: string
      folderId?: string | null
      tagIds?: string[]
      notes?: string
    }) => {
      const bm = await dbCreateBookmark(input)
      await refresh()
      return bm
    },
    [refresh],
  )

  const updateBookmarkFn = useCallback(
    async (
      id: string,
      patch: Partial<Pick<Bookmark, 'title' | 'url' | 'folderId' | 'tagIds' | 'notes' | 'order'>>,
    ) => {
      await dbUpdateBookmark(id, patch)
      await refresh()
    },
    [refresh],
  )

  const deleteBookmarkFn = useCallback(
    async (id: string) => {
      await dbDeleteBookmark(id)
      await refresh()
    },
    [refresh],
  )

  const createInboxTask = useCallback(
    async (input: {
      title: string
      due?: string | null
      priority?: 'low' | 'medium' | 'high' | null
    }) => {
      const page = await dbCreateInboxTask(input)
      await refresh()
      return page
    },
    [refresh],
  )

  const saveView = useCallback(
    async (view: Omit<SavedView, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const now = Date.now()
      const full: SavedView = {
        id: view.id ?? createId(),
        name: view.name,
        scope: view.scope,
        filter: view.filter,
        sort: view.sort,
        widgets: view.widgets,
        createdAt: now,
        updatedAt: now,
      }
      await dbUpsertSavedView(full)
      await refresh()
      return full
    },
    [refresh],
  )

  const deleteView = useCallback(
    async (id: string) => {
      await dbDeleteSavedView(id)
      await refresh()
    },
    [refresh],
  )

  const listPageRevisions = useCallback(async (pageId: string) => dbListRevisions(pageId), [])

  const restorePageRevision = useCallback(
    async (revisionId: string) => {
      await dbRestoreRevision(revisionId)
      await refresh()
    },
    [refresh],
  )

  const snapshotRevision = useCallback(
    async (pageId: string) => {
      const page = allPages.find((p) => p.id === pageId)
      if (!page) return
      await addRevision(page)
    },
    [allPages],
  )

  const repairOrphans = useCallback(async () => {
    const repaired = repairOrphanParents(allPages)
    let n = 0
    for (const p of repaired) {
      const orig = allPages.find((x) => x.id === p.id)
      if (orig && orig.parentId !== p.parentId) {
        await updatePage(p.id, { parentId: null })
        n++
      }
    }
    await refresh()
    return n
  }, [allPages, refresh])

  const createTag = useCallback(
    async (name: string) => {
      const tag = await dbCreateTag(name)
      await refresh()
      return tag
    },
    [refresh],
  )

  const deleteTag = useCallback(
    async (id: string) => {
      await dbDeleteTag(id)
      await refresh()
    },
    [refresh],
  )

  const setPageTags = useCallback(
    async (pageId: string, tagIds: string[]) => {
      setAllPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, tagIds, updatedAt: Date.now() } : p)),
      )
      await dbSetPageTagIds(pageId, tagIds)
    },
    [],
  )

  const patchPage = useCallback(
    async (id: string, patch: Parameters<typeof updatePage>[1]) => {
      setAllPages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p)),
      )
      await updatePage(id, patch)
    },
    [],
  )

  const tree = useMemo(() => buildTree(pages), [pages])
  const favorites = useMemo(
    () => pages.filter((p) => p.isFavorite).sort((a, b) => a.title.localeCompare(b.title)),
    [pages],
  )
  const recents = useMemo(() => {
    const byId = new Map(pages.map((p) => [p.id, p]))
    return recentIds.map((id) => byId.get(id)).filter((p): p is Page => !!p)
  }, [pages, recentIds])
  const activePage = useMemo(
    () => allPages.find((p) => p.id === activePageId && isLivePage(p)) ?? null,
    [allPages, activePageId],
  )
  const showWelcome = useMemo(() => {
    if (pages.length !== 1) return false
    const only = pages[0]
    return (
      only.kind === 'doc' &&
      !only.isFavorite &&
      (only.title === 'Sin título' || only.title === 'Untitled') &&
      isEmptyDoc(only.content)
    )
  }, [pages])

  const value = useMemo<PagesContextValue>(
    () => ({
      pages,
      allPages,
      trashPages,
      templates,
      tags,
      tree,
      favorites,
      recents,
      activePageId,
      activePage,
      loading,
      showWelcome,
      setActivePageId,
      createPage,
      deletePage,
      restorePages,
      purgeTrash,
      renamePage,
      toggleFavorite,
      duplicatePage,
      createFromTemplate,
      markAsTemplate,
      openOrCreateDailyNote,
      createDayTask,
      importBackup,
      createTag,
      deleteTag,
      setPageTags,
      patchPage,
      refresh,
      savedViews,
      attachments,
      bookmarkFolders,
      bookmarkTags,
      bookmarks,
      createBookmarkFolder,
      updateBookmarkFolder: updateBookmarkFolderFn,
      deleteBookmarkFolder: deleteBookmarkFolderFn,
      createBookmarkTag: createBookmarkTagFn,
      renameBookmarkTag: renameBookmarkTagFn,
      deleteBookmarkTag: deleteBookmarkTagFn,
      createBookmark: createBookmarkFn,
      updateBookmark: updateBookmarkFn,
      deleteBookmark: deleteBookmarkFn,
      createInboxTask,
      saveView,
      deleteView,
      listPageRevisions,
      restorePageRevision,
      snapshotRevision,
      repairOrphans,
    }),
    [
      pages,
      allPages,
      trashPages,
      templates,
      tags,
      tree,
      favorites,
      recents,
      activePageId,
      activePage,
      loading,
      showWelcome,
      setActivePageId,
      createPage,
      deletePage,
      restorePages,
      purgeTrash,
      renamePage,
      toggleFavorite,
      duplicatePage,
      createFromTemplate,
      markAsTemplate,
      openOrCreateDailyNote,
      createDayTask,
      importBackup,
      createTag,
      deleteTag,
      setPageTags,
      patchPage,
      refresh,
      savedViews,
      attachments,
      bookmarkFolders,
      bookmarkTags,
      bookmarks,
      createBookmarkFolder,
      updateBookmarkFolderFn,
      deleteBookmarkFolderFn,
      createBookmarkTagFn,
      renameBookmarkTagFn,
      deleteBookmarkTagFn,
      createBookmarkFn,
      updateBookmarkFn,
      deleteBookmarkFn,
      createInboxTask,
      saveView,
      deleteView,
      listPageRevisions,
      restorePageRevision,
      snapshotRevision,
      repairOrphans,
    ],
  )

  return <PagesContext.Provider value={value}>{children}</PagesContext.Provider>
}

export function usePagesContext(): PagesContextValue {
  const ctx = useContext(PagesContext)
  if (!ctx) throw new Error('usePagesContext must be used within PagesProvider')
  return ctx
}
