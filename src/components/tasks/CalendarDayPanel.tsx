import { CalendarDays, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { usePagesContext } from '../../context/PagesContext'
import type { Page } from '../../db/types'
import { getDayItems } from '../../lib/calendarDay'
import { formatDateEs, formatDateLongEs } from '../../lib/dates'

export function CalendarDayPanel({
  iso,
  onClose,
  onOpenPage,
  focusAdd = false,
}: {
  iso: string
  onClose: () => void
  onOpenPage: (id: string) => void
  focusAdd?: boolean
}) {
  const { pages, openOrCreateDailyNote, createDayTask, patchPage, deletePage } = usePagesContext()
  const { dailyNote, tasks } = getDayItems(pages, iso)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (focusAdd) inputRef.current?.focus()
  }, [focusAdd, iso])

  const label = formatDateLongEs(iso)

  const clearDue = (page: Page) => {
    const rest = { ...page.properties }
    delete rest.due
    void patchPage(page.id, { properties: rest })
  }

  return (
    <aside className="flex w-full flex-col rounded-lg border border-notion-border bg-notion-sidebar p-4 lg:w-80 lg:shrink-0">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-notion-text/45">Día</p>
          <h2 className="text-base font-semibold capitalize">{label}</h2>
        </div>
        <button
          type="button"
          title="Cerrar"
          aria-label="Cerrar panel del día"
          className="rounded-md p-1 hover:bg-notion-hover"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>
      </div>

      <section className="mb-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-notion-text/60">
          <CalendarDays className="size-3.5" />
          Nota del día
        </h3>
        {dailyNote ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="min-w-0 flex-1 truncate rounded-md border border-notion-border bg-notion-bg px-2 py-1.5 text-left text-sm hover:bg-notion-hover"
              onClick={() => onOpenPage(dailyNote.id)}
            >
              Abrir nota del {formatDateEs(iso)}
            </button>
            <button
              type="button"
              title="Mover nota a la papelera"
              aria-label="Mover nota a la papelera"
              className="rounded-md p-1.5 text-notion-text/50 hover:bg-notion-hover hover:text-notion-text"
              onClick={() => {
                if (window.confirm(`¿Enviar la nota del ${iso} a la papelera?`)) {
                  void deletePage(dailyNote.id)
                }
              }}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="w-full rounded-md border border-dashed border-notion-border px-2 py-1.5 text-sm hover:bg-notion-hover"
            onClick={() => void openOrCreateDailyNote(iso).then((p) => onOpenPage(p.id))}
          >
            Crear nota del día
          </button>
        )}
      </section>

      <section className="mb-3 min-h-0 flex-1">
        <h3 className="mb-2 text-xs font-semibold text-notion-text/60">Tareas ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <p className="text-xs text-notion-text/45">Ninguna tarea con este vencimiento.</p>
        ) : (
          <ul className="max-h-56 space-y-1 overflow-y-auto">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-1 rounded-md border border-notion-border bg-notion-bg px-1.5 py-1"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left text-sm hover:underline"
                  onClick={() => onOpenPage(t.id)}
                  title="Editar tarea"
                >
                  {t.title || 'Sin título'}
                </button>
                <button
                  type="button"
                  title="Quitar del día (mantener página)"
                  aria-label="Quitar del día"
                  className="rounded px-1 text-[10px] text-notion-text/50 hover:bg-notion-hover hover:text-notion-text"
                  onClick={() => clearDue(t)}
                >
                  Quitar
                </button>
                <button
                  type="button"
                  title="Mover a la papelera"
                  aria-label="Eliminar tarea"
                  className="rounded p-1 text-notion-text/50 hover:bg-notion-hover hover:text-notion-text"
                  onClick={() => {
                    if (window.confirm(`¿Eliminar «${t.title}»?`)) void deletePage(t.id)
                  }}
                >
                  <Trash2 className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form
        className="mt-auto flex gap-1 border-t border-notion-border pt-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim()) return
          void createDayTask({ title: title.trim(), due: iso }).then(() => setTitle(''))
        }}
      >
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nueva tarea…"
          aria-label="Nueva tarea del día"
          className="min-w-0 flex-1 rounded-md border border-notion-border bg-notion-bg px-2 py-1.5 text-sm outline-none"
        />
        <button
          type="submit"
          title="Añadir tarea"
          aria-label="Añadir tarea"
          className="rounded-md border border-notion-border px-2 py-1.5 hover:bg-notion-hover"
        >
          <Plus className="size-4" />
        </button>
      </form>
    </aside>
  )
}
