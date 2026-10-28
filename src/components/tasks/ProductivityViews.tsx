import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { usePagesContext } from '../../context/PagesContext'
import type { DashboardWidgetId, TaskFilter, TaskPriority } from '../../db/types'
import { defaultDashboardWidgets } from '../../db/types'
import { getDayItems } from '../../lib/calendarDay'
import { createId } from '../../lib/id'
import { formatDateEs, formatMonthYearEs } from '../../lib/dates'
import { getDue, getPriority, getStatus, listTasks, todayIso } from '../../lib/taskProps'
import { CalendarDayPanel } from './CalendarDayPanel'

export type ProductivityMode = 'inbox' | 'tasks' | 'calendar' | 'dashboard'

export function ProductivityViews({
  mode,
  onOpenPage,
}: {
  mode: ProductivityMode
  onOpenPage: (id: string) => void
}) {
  if (mode === 'inbox') return <InboxPanel onOpenPage={onOpenPage} />
  if (mode === 'calendar') return <CalendarPanel onOpenPage={onOpenPage} />
  if (mode === 'dashboard') return <DashboardPanel onOpenPage={onOpenPage} />
  return <TaskCenter onOpenPage={onOpenPage} />
}

function InboxPanel({ onOpenPage }: { onOpenPage: (id: string) => void }) {
  const { pages, createInboxTask, patchPage } = usePagesContext()
  const [title, setTitle] = useState('')
  const tasks = useMemo(() => listTasks(pages, { inboxOnly: true }), [pages])

  return (
    <div className="mx-auto w-full max-w-2xl px-8 py-10">
      <h1 className="mb-4 text-2xl font-bold">Bandeja de entrada</h1>
      <form
        className="mb-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim()) return
          void createInboxTask({ title: title.trim() }).then(() => setTitle(''))
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Captura rápida…"
          className="min-w-0 flex-1 rounded-md border border-notion-border bg-transparent px-3 py-2 text-sm outline-none"
          aria-label="Nueva tarea en bandeja"
        />
        <button
          type="submit"
          className="rounded-md border border-notion-border px-3 py-2 text-sm hover:bg-notion-hover"
        >
          Añadir
        </button>
      </form>
      <TaskList
        tasks={tasks}
        onOpenPage={onOpenPage}
        onDone={(id) =>
          void patchPage(id, {
            properties: {
              ...(pages.find((p) => p.id === id)?.properties ?? {}),
              status: 'Done',
              inbox: false,
            },
          })
        }
      />
    </div>
  )
}

function TaskCenter({ onOpenPage }: { onOpenPage: (id: string) => void }) {
  const { pages, tags, patchPage, savedViews, saveView, deleteView } = usePagesContext()
  const [filter, setFilter] = useState<TaskFilter>({})
  const [name, setName] = useState('')
  const tasks = useMemo(() => listTasks(pages, filter, { by: 'due', dir: 'asc' }), [pages, filter])
  const taskViews = savedViews.filter((v) => v.scope === 'tasks')

  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-10">
      <h1 className="mb-4 text-2xl font-bold">Centro de tareas</h1>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <select
          className="rounded-md border border-notion-border bg-transparent px-2 py-1"
          value={filter.status ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value || null }))}
          aria-label="Filtrar por estado"
        >
          <option value="">Estado</option>
          <option value="Backlog">Backlog</option>
          <option value="Doing">Doing</option>
          <option value="Done">Done</option>
        </select>
        <select
          className="rounded-md border border-notion-border bg-transparent px-2 py-1"
          value={filter.priority ?? ''}
          onChange={(e) =>
            setFilter((f) => ({
              ...f,
              priority: (e.target.value || null) as TaskPriority | null,
            }))
          }
          aria-label="Filtrar por prioridad"
        >
          <option value="">Prioridad</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
        <select
          className="rounded-md border border-notion-border bg-transparent px-2 py-1"
          value={filter.tagId ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, tagId: e.target.value || null }))}
          aria-label="Filtrar por etiqueta"
        >
          <option value="">Etiqueta</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={!!filter.inboxOnly}
            onChange={(e) => setFilter((f) => ({ ...f, inboxOnly: e.target.checked }))}
          />
          Solo bandeja
        </label>
        <input
          value={filter.query ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
          placeholder="Buscar…"
          className="rounded-md border border-notion-border bg-transparent px-2 py-1"
        />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de vista"
          className="rounded-md border border-notion-border bg-transparent px-2 py-1"
        />
        <button
          type="button"
          className="rounded-md border border-notion-border px-2 py-1 hover:bg-notion-hover"
          onClick={() => {
            if (!name.trim()) return
            void saveView({ name: name.trim(), scope: 'tasks', filter }).then(() => setName(''))
          }}
        >
          Guardar vista
        </button>
        {taskViews.map((v) => (
          <span key={v.id} className="inline-flex items-center gap-1 rounded-md bg-notion-sidebar px-2 py-1">
            <button type="button" onClick={() => setFilter(v.filter ?? {})}>
              {v.name}
            </button>
            <button type="button" aria-label="Borrar vista" onClick={() => void deleteView(v.id)}>
              ×
            </button>
          </span>
        ))}
      </div>
      <TaskList
        tasks={tasks}
        onOpenPage={onOpenPage}
        onDone={(id) => {
          const p = pages.find((x) => x.id === id)
          if (!p) return
          void patchPage(id, { properties: { ...p.properties, status: 'Done' } })
        }}
      />
    </div>
  )
}

function CalendarPanel({ onOpenPage }: { onOpenPage: (id: string) => void }) {
  const { pages } = usePagesContext()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedIso, setSelectedIso] = useState<string | null>(() => todayIso())
  const [focusAdd, setFocusAdd] = useState(false)
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Lunes primero: Dom=0 → 6, Lun=1 → 0, … Sáb=6 → 5
  const startWeekday = (new Date(year, month, 1).getDay() + 6) % 7

  const cells: Array<{ day: number | null; iso: string | null }> = []
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null, iso: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, iso })
  }

  const selectDay = (iso: string, add = false) => {
    setSelectedIso(iso)
    setFocusAdd(add)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 lg:flex-row">
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Calendario — {formatMonthYearEs(cursor)}
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-notion-border px-2 py-1 text-sm hover:bg-notion-hover"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
            >
              ←
            </button>
            <button
              type="button"
              className="rounded-md border border-notion-border px-2 py-1 text-sm hover:bg-notion-hover"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
            >
              →
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-notion-text/50">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            if (!c.day || !c.iso) {
              return (
                <div key={i} className="min-h-24 rounded-md border border-notion-border opacity-30" />
              )
            }
            const { dailyNote, tasks: dayTasks } = getDayItems(pages, c.iso)
            const extra = dayTasks.length > 3 ? dayTasks.length - 3 : 0
            const selected = selectedIso === c.iso
            return (
              <div
                key={i}
                className={`min-h-24 rounded-md border p-1 text-left ${
                  selected
                    ? 'border-sky-500 bg-sky-500/10'
                    : 'border-notion-border bg-notion-bg hover:bg-notion-hover/40'
                }`}
              >
                <div className="mb-0.5 flex items-center justify-between gap-0.5">
                  <button
                    type="button"
                    className="text-xs font-semibold hover:underline"
                    title={formatDateEs(c.iso!)}
                    onClick={() => selectDay(c.iso!)}
                  >
                    {c.day}
                  </button>
                  <div className="flex items-center gap-0.5">
                    {dailyNote && (
                      <span
                        className="size-1.5 rounded-full bg-emerald-500"
                        title="Hay nota del día"
                        aria-label="Hay nota del día"
                      />
                    )}
                    <button
                      type="button"
                      title="Añadir tarea este día"
                      aria-label="Añadir tarea este día"
                      className="rounded p-0.5 text-notion-text/40 hover:bg-notion-hover hover:text-notion-text"
                      onClick={(e) => {
                        e.stopPropagation()
                        selectDay(c.iso!, true)
                      }}
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                </div>
                <ul className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className="block w-full truncate rounded px-0.5 text-[10px] hover:bg-notion-hover"
                        onClick={() => onOpenPage(t.id)}
                      >
                        {t.title}
                      </button>
                    </li>
                  ))}
                  {extra > 0 && (
                    <li>
                      <button
                        type="button"
                        className="px-0.5 text-[10px] text-notion-text/45 hover:underline"
                        onClick={() => selectDay(c.iso!)}
                      >
                        +{extra} más
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
      {selectedIso && (
        <CalendarDayPanel
          key={selectedIso}
          iso={selectedIso}
          focusAdd={focusAdd}
          onClose={() => {
            setSelectedIso(null)
            setFocusAdd(false)
          }}
          onOpenPage={onOpenPage}
        />
      )}
    </div>
  )
}

function DashboardPanel({ onOpenPage }: { onOpenPage: (id: string) => void }) {
  const { pages, favorites, savedViews, saveView } = usePagesContext()
  const dash = savedViews.find((v) => v.scope === 'dashboard')
  const widgets = dash?.widgets ?? defaultDashboardWidgets()
  const today = todayIso()
  const dueToday = listTasks(pages).filter((p) => getDue(p) === today)
  const high = listTasks(pages, { priority: 'high' })
  const inbox = listTasks(pages, { inboxOnly: true })

  const toggleWidget = (id: DashboardWidgetId) => {
    const next = widgets.includes(id) ? widgets.filter((w) => w !== id) : [...widgets, id]
    void saveView({
      id: dash?.id ?? createId(),
      name: dash?.name ?? 'Panel',
      scope: 'dashboard',
      widgets: next,
    })
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-10">
      <h1 className="mb-2 text-2xl font-bold">Panel de control</h1>
      <div className="mb-6 flex flex-wrap gap-2 text-xs">
        {defaultDashboardWidgets().map((id) => (
          <button
            key={id}
            type="button"
            className={`rounded-md border px-2 py-1 ${
              widgets.includes(id) ? 'border-notion-border bg-notion-active' : 'border-notion-border opacity-50'
            }`}
            onClick={() => toggleWidget(id)}
          >
            {id}
          </button>
        ))}
      </div>
      <div className="space-y-6">
        {widgets.includes('dueToday') && (
          <Widget title="Vencen hoy" tasks={dueToday} onOpenPage={onOpenPage} />
        )}
        {widgets.includes('highPriority') && (
          <Widget title="Alta prioridad" tasks={high} onOpenPage={onOpenPage} />
        )}
        {widgets.includes('inbox') && <Widget title="Bandeja" tasks={inbox} onOpenPage={onOpenPage} />}
        {widgets.includes('favorites') && (
          <Widget title="Favoritos" tasks={favorites} onOpenPage={onOpenPage} />
        )}
      </div>
    </div>
  )
}

function Widget({
  title,
  tasks,
  onOpenPage,
}: {
  title: string
  tasks: { id: string; title: string }[]
  onOpenPage: (id: string) => void
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-notion-text/70">{title}</h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-notion-text/40">Nada por aquí</p>
      ) : (
        <ul className="space-y-1">
          {tasks.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-sm hover:bg-notion-hover"
                onClick={() => onOpenPage(t.id)}
              >
                {t.title || 'Sin título'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function TaskList({
  tasks,
  onOpenPage,
  onDone,
}: {
  tasks: ReturnType<typeof listTasks>
  onOpenPage: (id: string) => void
  onDone: (id: string) => void
}) {
  if (!tasks.length) return <p className="text-sm text-notion-text/50">Sin tareas</p>
  return (
    <ul className="divide-y divide-notion-border rounded-md border border-notion-border">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-center gap-2 px-3 py-2 text-sm">
          <button
            type="button"
            title="Marcar hecha"
            className="size-4 rounded border border-notion-border"
            onClick={() => onDone(t.id)}
          />
          <button type="button" className="min-w-0 flex-1 truncate text-left hover:underline" onClick={() => onOpenPage(t.id)}>
            {t.title || 'Sin título'}
          </button>
          <span className="text-[11px] text-notion-text/45">{getPriority(t) ?? '—'}</span>
          <span className="text-[11px] text-notion-text/45">
            {getDue(t) ? formatDateEs(getDue(t)) : '—'}
          </span>
          <span className="text-[11px] text-notion-text/45">{getStatus(t) ?? '—'}</span>
        </li>
      ))}
    </ul>
  )
}
