import type { JSONContent } from '@tiptap/react'

export type TipTapDoc = JSONContent

export type PageKind = 'doc' | 'board' | 'database'

export type PropertyValue = string | number | boolean | null

export type DbPropertyType = 'text' | 'select' | 'number' | 'checkbox'

export interface DbProperty {
  id: string
  name: string
  type: DbPropertyType
  options?: string[]
}

export type DbViewType = 'table' | 'board' | 'gallery'

export interface DbView {
  id: string
  type: DbViewType
  name: string
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
  dbSchema?: DbProperty[]
  dbViews?: DbView[]
  activeViewId?: string | null
}

export type PageNode = Page & { children: PageNode[] }

export const BOARD_STATUSES = ['Backlog', 'Doing', 'Done'] as const
export type BoardStatus = (typeof BOARD_STATUSES)[number]

export function defaultDatabaseSchema(): DbProperty[] {
  return [
    { id: 'name', name: 'Name', type: 'text' },
    {
      id: 'status',
      name: 'Status',
      type: 'select',
      options: [...BOARD_STATUSES],
    },
    { id: 'tags', name: 'Tags', type: 'text' },
  ]
}

export function defaultDatabaseViews(): DbView[] {
  return [
    { id: 'table', type: 'table', name: 'Tabla' },
    { id: 'gallery', type: 'gallery', name: 'Galería' },
    { id: 'board', type: 'board', name: 'Tablero' },
  ]
}
