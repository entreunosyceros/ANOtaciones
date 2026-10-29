import type { JSONContent } from '@tiptap/react'

export type TipTapDoc = JSONContent

export type PageKind = 'doc' | 'board' | 'database'

/** Scalar + multi-value (multi_select / relation). */
export type PropertyValue = string | number | boolean | null | string[]

export type DbPropertyType =
  | 'text'
  | 'select'
  | 'number'
  | 'checkbox'
  | 'date'
  | 'multi_select'
  | 'relation'
  | 'formula'

export interface DbProperty {
  id: string
  name: string
  type: DbPropertyType
  options?: string[]
  /** For relation: optional hint; for formula: expression string */
  formula?: string
  relationTarget?: string | null
}

export type DbViewType = 'table' | 'board' | 'gallery'

export type FilterOp = 'eq' | 'neq' | 'contains' | 'is_empty' | 'is_not_empty' | 'gt' | 'lt'

export interface FilterCondition {
  propId: string
  op: FilterOp
  value?: PropertyValue
}

export interface FilterNode {
  op: 'and' | 'or'
  conditions: Array<FilterCondition | FilterNode>
}

export interface SortSpec {
  propId: string
  dir: 'asc' | 'desc'
}

export interface DbView {
  id: string
  type: DbViewType
  name: string
  filters?: FilterNode | null
  sorts?: SortSpec[]
  groupBy?: string | null
}

export interface Tag {
  id: string
  name: string
  createdAt: number
}

/** Carpeta de URLs favoritas (independiente del árbol de páginas). */
export interface BookmarkFolder {
  id: string
  name: string
  parentId: string | null
  order: number
  createdAt: number
}

/** Etiqueta solo para bookmarks (no mezclar con Tag de páginas). */
export interface BookmarkTag {
  id: string
  name: string
  createdAt: number
}

export interface Bookmark {
  id: string
  title: string
  url: string
  folderId: string | null
  tagIds: string[]
  notes?: string
  order: number
  createdAt: number
  updatedAt: number
}

export type SavedViewScope = 'tasks' | 'dashboard'

export type TaskPriority = 'low' | 'medium' | 'high'

export interface TaskFilter {
  status?: string | null
  priority?: TaskPriority | null
  inboxOnly?: boolean
  dueBefore?: string | null
  dueAfter?: string | null
  tagId?: string | null
  query?: string
}

export interface TaskSort {
  by: 'due' | 'priority' | 'title' | 'updatedAt'
  dir: 'asc' | 'desc'
}

export type DashboardWidgetId = 'dueToday' | 'highPriority' | 'inbox' | 'favorites'

export interface SavedView {
  id: string
  name: string
  scope: SavedViewScope
  filter?: TaskFilter
  sort?: TaskSort
  widgets?: DashboardWidgetId[]
  createdAt: number
  updatedAt: number
}

export interface AttachmentMeta {
  id: string
  pageId: string
  name: string
  mime: string
  opfsPath: string
  size: number
  createdAt: number
}

export interface PageRevision {
  id: string
  pageId: string
  title: string
  content: TipTapDoc
  properties: Record<string, PropertyValue>
  createdAt: number
}

export interface Page {
  id: string
  parentId: string | null
  title: string
  icon: string | null
  content: TipTapDoc
  createdAt: number
  updatedAt: number
  order: number
  kind: PageKind
  isFavorite: boolean
  properties: Record<string, PropertyValue>
  deletedAt?: number | null
  isTemplate?: boolean
  tagIds?: string[]
  dbSchema?: DbProperty[]
  dbViews?: DbView[]
  activeViewId?: string | null
}

export type PageNode = Page & { children: PageNode[] }

export const BOARD_STATUSES = ['Pendiente', 'En curso', 'Hecho'] as const
export type BoardStatus = (typeof BOARD_STATUSES)[number]

/** Normaliza estados legacy en inglés y valores actuales en español. */
export function normalizeBoardStatus(raw: unknown): BoardStatus {
  if (raw === 'Doing' || raw === 'En curso') return 'En curso'
  if (raw === 'Done' || raw === 'Hecho') return 'Hecho'
  if (raw === 'Backlog' || raw === 'Pendiente') return 'Pendiente'
  if (typeof raw === 'string' && (BOARD_STATUSES as readonly string[]).includes(raw)) {
    return raw as BoardStatus
  }
  return 'Pendiente'
}

export function defaultDatabaseSchema(): DbProperty[] {
  return [
    { id: 'name', name: 'Nombre', type: 'text' },
    {
      id: 'status',
      name: 'Estado',
      type: 'select',
      options: [...BOARD_STATUSES],
    },
    { id: 'due', name: 'Vencimiento', type: 'date' },
    {
      id: 'priority',
      name: 'Prioridad',
      type: 'select',
      options: ['low', 'medium', 'high'],
    },
    { id: 'tags', name: 'Etiquetas', type: 'multi_select', options: [] },
  ]
}

export function defaultDatabaseViews(): DbView[] {
  return [
    { id: 'table', type: 'table', name: 'Tabla', filters: null, sorts: [], groupBy: null },
    { id: 'gallery', type: 'gallery', name: 'Galería', filters: null, sorts: [], groupBy: null },
    { id: 'board', type: 'board', name: 'Tablero', filters: null, sorts: [], groupBy: 'status' },
  ]
}

export function isLivePage(page: Page): boolean {
  return page.deletedAt == null
}

export function defaultDashboardWidgets(): DashboardWidgetId[] {
  return ['dueToday', 'highPriority', 'inbox', 'favorites']
}
