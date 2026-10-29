import { Plus, Star, Table2, LayoutGrid, Columns3, Database } from 'lucide-react'
import { useMemo, useState } from 'react'
import { createId } from '../../lib/id'
import { applyDbView } from '../../lib/dbFilters'
import { evaluateFormula } from '../../lib/formulaGraph'
import { formatDateEs } from '../../lib/dates'
import {
  coercePropertyValue,
  DB_PROPERTY_TYPE_LABELS,
  displayPropertyValue,
  emptyValueForType,
  formatSelectOptionLabel,
  isValidPropertyType,
} from '../../lib/propertyTypes'
import { usePagesContext } from '../../context/PagesContext'
import {
  BOARD_STATUSES,
  type DbProperty,
  type DbPropertyType,
  type DbViewType,
  type Page,
  type PropertyValue,
} from '../../db/types'
import { Breadcrumbs } from '../layout/Breadcrumbs'
import { KanbanBoard } from '../board/KanbanBoard'
import { PageIconButton } from '../ui/EmojiPicker'

function propValue(page: Page, key: string, type?: string): string {
  const v = page.properties[key] ?? null
  if (type === 'date' && typeof v === 'string') return formatDateEs(v) || '—'
  return displayPropertyValue(v)
}

const TYPE_ALIASES: Record<string, DbPropertyType> = {
  texto: 'text',
  lista: 'select',
  número: 'number',
  numero: 'number',
  casilla: 'checkbox',
  fecha: 'date',
  'varias opciones': 'multi_select',
  relación: 'relation',
  relacion: 'relation',
  fórmula: 'formula',
  formula: 'formula',
}

function resolvePropertyType(raw: string): DbPropertyType | null {
  const key = raw.toLowerCase()
  if (isValidPropertyType(key)) return key
  return TYPE_ALIASES[key] ?? null
}

export function DatabaseView({ page }: { page: Page }) {
  const { pages, createPage, patchPage, renamePage, setActivePageId, toggleFavorite } =
    usePagesContext()
  const [filterText, setFilterText] = useState('')
  const [sortProp, setSortProp] = useState<string>('')

  const schema = page.dbSchema ?? []
  const views = page.dbViews ?? []
  const activeView = views.find((v) => v.id === page.activeViewId) ?? views[0]
  const viewType: DbViewType = activeView?.type ?? 'table'

  const rawRows = useMemo(
    () =>
      pages
        .filter((p) => p.parentId === page.id)
        .sort((a, b) => a.order - b.order),
    [pages, page.id],
  )

  const { rows, groups } = useMemo(() => {
    const filters = filterText.trim()
      ? {
          op: 'or' as const,
          conditions: schema.map((col) => ({
            propId: col.id,
            op: 'contains' as const,
            value: filterText.trim(),
          })),
        }
      : activeView?.filters ?? null
    const sorts =
      sortProp
        ? [{ propId: sortProp, dir: 'asc' as const }]
        : activeView?.sorts ?? []
    return applyDbView(rawRows, {
      filters,
      sorts,
      groupBy: activeView?.groupBy ?? null,
    })
  }, [rawRows, filterText, schema, activeView, sortProp])

  const setView = (viewId: string) => {
    void patchPage(page.id, { activeViewId: viewId })
  }

  const addProperty = () => {
    const raw = window.prompt(
      'Tipo de propiedad:\ntexto | lista | número | casilla | fecha | varias opciones | relación | fórmula\n(también acepta: text, select, number, checkbox, date, multi_select, relation, formula)',
      'texto',
    )
    if (!raw) return
    const type = resolvePropertyType(raw.trim())
    if (!type) {
      window.alert('Tipo no reconocido.')
      return
    }
    const next: DbProperty = {
      id: createId(),
      name: 'Nueva propiedad',
      type,
      options: type === 'select' || type === 'multi_select' ? ['Opción A', 'Opción B'] : [],
      formula: type === 'formula' ? 'prop("Nombre")' : undefined,
    }
    void patchPage(page.id, { dbSchema: [...schema, next] })
  }

  const addRow = () => {
    const properties: Record<string, PropertyValue> = {}
    for (const col of schema) {
      const n = col.name.toLowerCase()
      if (col.id === 'status' || n === 'status' || n === 'estado') {
        properties[col.id] = 'Pendiente'
      } else {
        properties[col.id] = emptyValueForType(col.type)
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
    const colName = schema.find((c) => c.id === propId)?.name
    if (
      propId === 'name' ||
      colName === 'Name' ||
      colName === 'Nombre'
    ) {
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

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <input
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Filtrar…"
          className="rounded-md border border-notion-border bg-transparent px-2 py-1"
        />
        <select
          value={sortProp}
          onChange={(e) => setSortProp(e.target.value)}
          className="rounded-md border border-notion-border bg-transparent px-2 py-1"
          aria-label="Ordenar por"
        >
          <option value="">Orden</option>
          {schema.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {viewType === 'gallery' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              title={`Abrir «${row.title || 'Sin título'}»`}
              aria-label={`Abrir «${row.title || 'Sin título'}»`}
              onClick={() => setActivePageId(row.id)}
              className="rounded-lg border border-notion-border bg-notion-sidebar p-4 text-left hover:bg-notion-hover"
            >
              <div className="mb-2 text-base font-semibold">{row.title || 'Sin título'}</div>
              {schema.slice(0, 2).map((col) => (
                <div key={col.id} className="text-xs text-notion-text/60">
                  <span className="opacity-70">{col.name}: </span>
                  {propValue(row, col.id, col.type) || '—'}
                </div>
              ))}
            </button>
          ))}
          {rows.length === 0 && (
            <p className="text-sm text-notion-text/50">Sin filas. Añade una con “Nueva fila”.</p>
          )}
        </div>
      ) : groups ? (
        <div className="space-y-4">
          {[...groups.entries()].map(([label, groupRows]) => (
            <div key={label}>
              <h3 className="mb-2 text-xs font-semibold uppercase text-notion-text/50">{label}</h3>
              <TableRows
                rows={groupRows}
                schema={schema}
                allPages={pages}
                onOpen={setActivePageId}
                onChange={updateCell}
              />
            </div>
          ))}
        </div>
      ) : (
        <TableRows
          rows={rows}
          schema={schema}
          allPages={pages}
          onOpen={setActivePageId}
          onChange={updateCell}
        />
      )}
    </div>
  )
}

function TableRows({
  rows,
  schema,
  allPages,
  onOpen,
  onChange,
}: {
  rows: Page[]
  schema: DbProperty[]
  allPages: Page[]
  onOpen: (id: string) => void
  onChange: (row: Page, propId: string, value: PropertyValue) => void
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-notion-border">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="bg-notion-sidebar text-left text-xs text-notion-text/60">
            <th className="border-b border-notion-border px-3 py-2 font-medium">Título</th>
            {schema.map((col) => (
              <th key={col.id} className="border-b border-notion-border px-3 py-2 font-medium">
                {col.name}
                <span className="ml-1 opacity-40">
                  {DB_PROPERTY_TYPE_LABELS[col.type] ?? col.type}
                </span>
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
                  title={`Abrir «${row.title || 'Sin título'}»`}
                  className="text-left font-medium hover:underline"
                  onClick={() => onOpen(row.id)}
                >
                  {row.title || 'Sin título'}
                </button>
              </td>
              {schema.map((col) => (
                <td key={col.id} className="border-b border-notion-border px-2 py-1">
                  <CellEditor
                    col={col}
                    value={row.properties[col.id] ?? null}
                    row={row}
                    schema={schema}
                    allPages={allPages}
                    onChange={(v) => onChange(row, col.id, v)}
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
        <button
          type="button"
          title={page.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          aria-label={page.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          className="rounded-md p-1.5 hover:bg-notion-hover"
          onClick={onFavorite}
        >
          <Star className={`size-5 ${page.isFavorite ? 'fill-amber-400 text-amber-400' : 'opacity-50'}`} />
        </button>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {views.map((view) => {
          const Icon =
            view.type === 'gallery' ? LayoutGrid : view.type === 'board' ? Columns3 : Table2
          const viewHint =
            view.type === 'gallery'
              ? 'Vista galería'
              : view.type === 'board'
                ? 'Vista tablero'
                : 'Vista tabla'
          return (
            <button
              key={view.id}
              type="button"
              title={`${viewHint}: ${view.name}`}
              aria-label={`${viewHint}: ${view.name}`}
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
            title="Añadir una columna / propiedad"
            aria-label="Añadir una columna / propiedad"
            onClick={onAddProperty}
            className="rounded-md border border-notion-border px-2.5 py-1 text-sm hover:bg-notion-hover"
          >
            + Propiedad
          </button>
          <button
            type="button"
            title="Añadir una nueva fila"
            aria-label="Añadir una nueva fila"
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
  row,
  schema,
  allPages,
}: {
  col: DbProperty
  value: PropertyValue
  onChange: (v: PropertyValue) => void
  row: Page
  schema: DbProperty[]
  allPages: Page[]
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
            {formatSelectOptionLabel(opt)}
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
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
    )
  }
  if (col.type === 'date') {
    return (
      <input
        type="date"
        className="w-full bg-transparent px-1 py-1 outline-none"
        value={typeof value === 'string' ? value.slice(0, 10) : ''}
        onChange={(e) => onChange(coercePropertyValue('date', e.target.value))}
      />
    )
  }
  if (col.type === 'multi_select') {
    const selected = Array.isArray(value) ? value : []
    const options = col.options ?? []
    return (
      <select
        multiple
        className="max-h-16 w-full bg-transparent text-xs outline-none"
        value={selected}
        onChange={(e) => {
          const vals = [...e.target.selectedOptions].map((o) => o.value)
          onChange(vals)
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {formatSelectOptionLabel(opt)}
          </option>
        ))}
      </select>
    )
  }
  if (col.type === 'relation') {
    const selected = Array.isArray(value) ? value : []
    return (
      <select
        className="w-full bg-transparent text-xs outline-none"
        value={selected[0] ?? ''}
        onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
      >
        <option value="">—</option>
        {allPages
          .filter((p) => p.id !== row.id)
          .slice(0, 80)
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.title || 'Sin título'}
            </option>
          ))}
      </select>
    )
  }
  if (col.type === 'formula') {
    const byName: Record<string, string | number | boolean | null> = {}
    for (const c of schema) {
      const v = row.properties[c.id]
      byName[c.name] = Array.isArray(v) ? v.join(',') : (v as string | number | boolean | null)
    }
    const result = col.formula ? evaluateFormula(col.formula, byName) : null
    return <span className="px-1 text-notion-text/70">{displayPropertyValue(result)}</span>
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
