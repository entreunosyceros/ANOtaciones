import { RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { usePagesContext } from '../../context/PagesContext'
import { Tooltip } from '../ui/Tooltip'

export function TrashPanel({ collapsed = false }: { collapsed?: boolean }) {
  const { trashPages, restorePages, purgeTrash } = usePagesContext()
  const [open, setOpen] = useState(false)

  const list = (
    <div className={`mt-1 max-h-40 space-y-1 overflow-y-auto ${collapsed ? 'w-52 p-1' : ''}`}>
      {trashPages.length === 0 ? (
        <p className="px-2 py-1 text-[11px] text-notion-text/45">Vacía</p>
      ) : (
        <>
          {trashPages.map((page) => (
            <div
              key={page.id}
              className="flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-notion-hover"
            >
              <span className="min-w-0 flex-1 truncate text-xs">{page.title || 'Sin título'}</span>
              <Tooltip content="Restaurar">
                <button
                  type="button"
                  aria-label="Restaurar"
                  className="rounded p-0.5 text-notion-text/60 hover:text-notion-text"
                  onClick={() => void restorePages([page.id])}
                >
                  <RotateCcw className="size-3" />
                </button>
              </Tooltip>
              <Tooltip content="Eliminar definitivamente">
                <button
                  type="button"
                  aria-label="Eliminar definitivamente"
                  className="rounded p-0.5 text-notion-text/60 hover:text-notion-text"
                  onClick={() => {
                    if (window.confirm(`¿Eliminar definitivamente «${page.title}»?`)) {
                      void purgeTrash([page.id])
                    }
                  }}
                >
                  <Trash2 className="size-3" />
                </button>
              </Tooltip>
            </div>
          ))}
          <button
            type="button"
            className="w-full rounded-md px-2 py-1 text-[11px] text-red-600 hover:bg-notion-hover dark:text-red-400"
            onClick={() => {
              if (window.confirm('¿Vaciar toda la papelera?')) void purgeTrash()
            }}
          >
            Vaciar papelera
          </button>
        </>
      )}
    </div>
  )

  if (collapsed) {
    return (
      <div className="relative flex flex-col items-center border-t border-notion-border py-2">
        <Tooltip content={`Papelera (${trashPages.length})`} side="right">
          <button
            type="button"
            aria-label={`Papelera (${trashPages.length})`}
            className="flex size-9 items-center justify-center rounded-md text-notion-text/70 hover:bg-notion-hover"
            onClick={() => setOpen((v) => !v)}
          >
            <Trash2 className="size-4" />
          </button>
        </Tooltip>
        {open && (
          <div className="absolute bottom-0 left-full z-30 ml-1 rounded-md border border-notion-border bg-notion-bg shadow-lg">
            {list}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="border-t border-notion-border px-2 py-2">
      <button
        type="button"
        title="Ver páginas eliminadas"
        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-notion-text/70 hover:bg-notion-hover"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-1.5">
          <Trash2 className="size-3.5" />
          Papelera
        </span>
        <span>{trashPages.length}</span>
      </button>
      {open && list}
    </div>
  )
}
