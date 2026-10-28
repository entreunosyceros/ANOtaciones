import { Plus, Star, Table2, LayoutGrid, Columns3, Database } from 'lucide-react'
import { useMemo } from 'react'
import { createId } from '../../lib/id'
import { usePagesContext } from '../../context/PagesContext'
import {
  BOARD_STATUSES,
  type DbProperty,
  type DbViewType,
  type Page,
  type PropertyValue,
} from '../../db/types'
import { Breadcrumbs } from '../layout/Breadcrumbs'
import { KanbanBoard } from '../board/KanbanBoard'
import { PageIconButton } from '../ui/EmojiPicker'

function propValue(page: Page, key: string): string {
  const v = page.properties[key]
  if (v == null) return ''
  return String(v)
}

export function DatabaseView({ page }: { page: Page }) {
  const { pages, createPage, patchPage, renamePage, setActivePageId, toggleFavorite } =
    usePagesContext()

  const schema = page.dbSchema ?? []
  const views = page.dbViews ?? []
  const activeView = views.find((v) => v.id === page.activeViewId) ?? views[0]
  const viewType: DbViewType = activeView?.type ?? 'table'

  const rows = useMemo(
    () =>
      pages
        .filter((p) => p.parentId === page.id)
        .sort((a, b) => a.order - b.order),
    [pages, page.id],
  )

  const setView = (viewId: string) => {
    void patchPage(page.id, { activeViewId: viewId })
  }

  const addProperty = () => {
    const next: DbProperty = {
      id: createId(),
      name: 'Nueva propiedad',
      type: 'text',
    }
    void patchPage(page.id, { dbSchema: [...schema, next] })
  }

  const addRow = () => {
    const properties: Record<string, PropertyValue> = {}
    for (const col of schema) {
      if (col.id === 'status' || col.name.toLowerCase() === 'status') {
        properties[col.id] = 'Backlog'
      } else if (col.type === 'checkbox') {
        properties[col.id] = false
      } else if (col.type === 'number') {
        properties[col.id] = null
      } else {
        properties[col.id] = ''
      }
    }
    void createPage({
      parentId: page.id,
      title: 'Nueva fila',
      kind: 'doc',
      properties,
      open: false,
    })
  }

  const updateCell = (row: Page, propId: string, value: PropertyValue) => {
    const nextProps = { ...row.properties, [propId]: value }
    const patch: Parameters<typeof patchPage>[1] = { properties: nextProps }
    if (propId === 'name' || schema.find((c) => c.id === propId)?.name === 'Name') {
      patch.title = String(value || 'Sin título')
    }
    void patchPage(row.id, patch)
  }

  // Board view reuses Kanban when Status exists — render lightweight board of children
  if (viewType === 'board') {
    return (
      <div className="flex h-full flex-col px-8 pb-8 pt-10">
        <DatabaseHeader
          page={page}
          views={views}
          activeViewId={activeView?.id}
          onView={setView}
          onAddRow={addRow}
          onAddProperty={addProperty}
          onRename={(t) => void renamePage(page.id, t)}
          onFavorite={() => void toggleFavorite(page.id)}
          onIcon={(emoji) => void patchPage(page.id, { icon: emoji })}
        />
        <KanbanBoard page={page} embedded />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col px-8 pb-8 pt-10">
      <DatabaseHeader
        page={page}
        views={views}
        activeViewId={activeView?.id}
        onView={setView}
        onAddRow={addRow}
        onAddProperty={addProperty}
        onRename={(t) => void renamePage(page.id, t)}
        onFavorite={() => void toggleFavorite(page.id)}
        onIcon={(emoji) => void patchPage(page.id, { icon: emoji })}
      />

      {viewType === 'gallery' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setActivePageId(row.id)}
              className="rounded-lg border border-notion-border bg-notion-sidebar p-4 text-left hover:bg-notion-hover"
            >
              <div className="mb-2 text-base font-semibold">{row.title || 'Sin título'}</div>
              {schema.slice(0, 2).map((col) => (
                <div key={col.id} className="text-xs text-notion-text/60">
                  <span className="opacity-70">{col.name}: </span>
                  {propValue(row, col.id) || '—'}
                </div>
              ))}
            </button>
          ))}
          {rows.length === 0 && (
            <p className="text-sm text-notion-text/50">Sin filas. Añade una con “Nueva fila”.</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-notion-border">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-notion-sidebar text-left text-xs text-notion-text/60">
                <th className="border-b border-notion-border px-3 py-2 font-medium">Título</th>
                {schema.map((col) => (
                  <th key={col.id} className="border-b border-notion-border px-3 py-2 font-medium">
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-notion-hover/50">
                  <td className="border-b border-notion-border px-3 py-1.5">
                    <button
                      type="button"
                      className="text-left font-medium hover:underline"
                      onClick={() => setActivePageId(row.id)}
                    >
                      {row.title || 'Sin título'}
                    </button>
                  </td>
                  {schema.map((col) => (
                    <td key={col.id} className="border-b border-notion-border px-2 py-1">
                      <CellEditor
                        col={col}
                        value={row.properties[col.id] ?? null}
                        onChange={(v) => updateCell(row, col.id, v)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="px-3 py-4 text-sm text-notion-text/50">Sin filas todavía.</p>
          )}
        </div>
      )}
    </div>
  )
}

function DatabaseHeader({
  page,
  views,
  activeViewId,
  onView,
  onAddRow,
  onAddProperty,
  onRename,
  onFavorite,
  onIcon,
}: {
  page: Page
  views: NonNullable<Page['dbViews']>
  activeViewId?: string
  onView: (id: string) => void
  onAddRow: () => void
  onAddProperty: () => void
  onRename: (title: string) => void
  onFavorite: () => void
  onIcon: (emoji: string | null) => void
}) {
  return (
    <>
      <Breadcrumbs pageId={page.id} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <PageIconButton
          icon={page.icon}
          fallback={<Database className="size-6 opacity-40" />}
          onChange={onIcon}
        />
        <input
          key={`db-title-${page.id}`}
          defaultValue={page.title}
          className="min-w-0 flex-1 bg-transparent text-3xl font-bold outline-none"
          onChange={(e) => onRename(e.target.value || 'Nueva base de datos')}
        />
        <button type="button" className="rounded-md p-1.5 hover:bg-notion-hover" onClick={onFavorite}>
          <Star className={`size-5 ${page.isFavorite ? 'fill-amber-400 text-amber-400' : 'opacity-50'}`} />
        </button>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {views.map((view) => {
          const Icon =
            view.type === 'gallery' ? LayoutGrid : view.type === 'board' ? Columns3 : Table2
          return (
            <button
              key={view.id}
              type="button"
              onClick={() => onView(view.id)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm ${
                activeViewId === view.id ? 'bg-notion-active' : 'hover:bg-notion-hover'
              }`}
            >
              <Icon className="size-3.5 opacity-60" />
              {view.name}
            </button>
          )
        })}
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onAddProperty}
            className="rounded-md border border-notion-border px-2.5 py-1 text-sm hover:bg-notion-hover"
          >
            + Propiedad
          </button>
          <button
            type="button"
            onClick={onAddRow}
            className="flex items-center gap-1 rounded-md border border-notion-border px-2.5 py-1 text-sm hover:bg-notion-hover"
          >
            <Plus className="size-3.5" />
            Nueva fila
          </button>
        </div>
      </div>
    </>
  )
}

function CellEditor({
  col,
  value,
  onChange,
}: {
  col: DbProperty
  value: PropertyValue
  onChange: (v: PropertyValue) => void
}) {
  if (col.type === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
      />
    )
  }
  if (col.type === 'select') {
    const options = col.options ?? [...BOARD_STATUSES]
    return (
      <select
        className="w-full rounded border-none bg-transparent px-1 py-1 outline-none"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  }
  if (col.type === 'number') {
    return (
      <input
        type="number"
        className="w-full bg-transparent px-1 py-1 outline-none"
        value={value == null || value === '' ? '' : Number(value)}
        onChange={(e) =>
          onChange(e.target.value === '' ? null : Number(e.target.value))
        }
      />
    )
  }
  return (
    <input
      type="text"
      className="w-full bg-transparent px-1 py-1 outline-none"
      value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
