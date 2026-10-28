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
  createPage as dbCreatePage,
  deletePageCascade,
  duplicatePage as dbDuplicatePage,
  ensureBootstrapPage,
  getAllPages,
  importPages,
  updatePage,
} from '../db'
import type { Page, PageKind, PageNode, PropertyValue, TipTapDoc } from '../db/types'
import { pushRecentId, readRecentIds } from '../lib/recents'
import { dailyNoteContent, findDailyNote, todayTitle } from '../lib/dailyNote'
import { buildTree } from '../lib/tree'
import { isEmptyDoc } from '../lib/emptyDoc'

const ACTIVE_KEY = 'anotacion-active-page'

interface PagesContextValue {
  pages: Page[]
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
  }) => Promise<Page>
  deletePage: (id: string) => Promise<void>
  renamePage: (id: string, title: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  duplicatePage: (id: string) => Promise<Page | null>
  openOrCreateDailyNote: () => Promise<Page>
  importBackup: (pages: Page[]) => Promise<number>
  patchPage: (
    id: string,
    patch: Parameters<typeof updatePage>[1],
  ) => Promise<void>
  refresh: () => Promise<void>
}

const PagesContext = createContext<PagesContextValue | null>(null)

function pickActiveId(pages: Page[], preferred: string | null): string | null {
  if (preferred && pages.some((p) => p.id === preferred)) return preferred
  const roots = pages.filter((p) => p.parentId === null).sort((a, b) => a.order - b.order)
  return roots[0]?.id ?? pages[0]?.id ?? null
}

export function PagesProvider({ children }: { children: ReactNode }) {
  const [pages, setPages] = useState<Page[]>([])
  const [activePageId, setActivePageIdState] = useState<string | null>(null)
  const [recentIds, setRecentIds] = useState<string[]>(() => readRecentIds())
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const all = await getAllPages()
    setPages(all)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await ensureBootstrapPage()
      const all = await getAllPages()
      if (cancelled) return
      setPages(all)
      const stored = localStorage.getItem(ACTIVE_KEY)
      const next = pickActiveId(all, stored)
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
      const deleted = await deletePageCascade(id)
      let all = await getAllPages()
      if (all.length === 0) {
        await ensureBootstrapPage()
        all = await getAllPages()
      }
      setPages(all)
      if (activePageId && deleted.includes(activePageId)) {
        const next = pickActiveId(all, null)
        setActivePageIdState(next)
        if (next) {
          localStorage.setItem(ACTIVE_KEY, next)
          setRecentIds(pushRecentId(next))
        }
      }
    },
    [activePageId],
  )

  const renamePage = useCallback(
    async (id: string, title: string) => {
      await updatePage(id, { title })
      await refresh()
    },
    [refresh],
  )

  const toggleFavorite = useCallback(
    async (id: string) => {
      const page = pages.find((p) => p.id === id)
      if (!page) return
      await updatePage(id, { isFavorite: !page.isFavorite })
      await refresh()
    },
    [pages, refresh],
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

  const openOrCreateDailyNote = useCallback(async () => {
    const title = todayTitle()
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
  }, [pages, createPage, setActivePageId])

  const importBackup = useCallback(
    async (incoming: Page[]) => {
      const count = await importPages(incoming)
      await refresh()
      return count
    },
    [refresh],
  )

  const patchPage = useCallback(
    async (id: string, patch: Parameters<typeof updatePage>[1]) => {
      await updatePage(id, patch)
      await refresh()
    },
    [refresh],
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
    () => pages.find((p) => p.id === activePageId) ?? null,
    [pages, activePageId],
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
      renamePage,
      toggleFavorite,
      duplicatePage,
      openOrCreateDailyNote,
      importBackup,
      patchPage,
      refresh,
    }),
    [
      pages,
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
      renamePage,
      toggleFavorite,
      duplicatePage,
      openOrCreateDailyNote,
      importBackup,
      patchPage,
      refresh,
    ],
  )

  return <PagesContext.Provider value={value}>{children}</PagesContext.Provider>
}

export function usePagesContext(): PagesContextValue {
  const ctx = useContext(PagesContext)
  if (!ctx) throw new Error('usePagesContext must be used within PagesProvider')
  return ctx
}
