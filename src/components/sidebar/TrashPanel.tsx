import { RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePagesContext } from '../../context/PagesContext'
import { Tooltip } from '../ui/Tooltip'

export function TrashPanel({ collapsed = false }: { collapsed?: boolean }) {
  const { trashPages, restorePages, purgeTrash } = usePagesContext()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const flyoutRef = useRef<HTMLDivElement>(null)
  const [flyPos, setFlyPos] = useState<{ bottom: number; left: number } | null>(null)

  useEffect(() => {
    if (!collapsed) setOpen(false)
  }, [collapsed])

  useLayoutEffect(() => {
    if (!open || !collapsed || !btnRef.current) {
      setFlyPos(null)
      return
    }
    const place = () => {
      const r = btnRef.current!.getBoundingClientRect()
      setFlyPos({
        bottom: Math.max(8, window.innerHeight - r.bottom),
        left: r.right + 4,
      })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open, collapsed])

  useEffect(() => {
    if (!open || !collapsed) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t) || flyoutRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, collapsed])

  const list = (
    <div className={`max-h-40 space-y-1 overflow-y-auto ${collapsed ? 'w-52 p-1' : 'mt-1'}`}>
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
      <div
        ref={rootRef}
        className="relative flex flex-col items-center border-t border-notion-border py-2"
      >
        <Tooltip content={`Papelera (${trashPages.length})`} side="right">
          <button
            ref={btnRef}
            type="button"
            aria-label={`Papelera (${trashPages.length})`}
            aria-expanded={open}
            className="flex size-9 items-center justify-center rounded-md text-notion-text/70 hover:bg-notion-hover"
            onClick={() => setOpen((v) => !v)}
          >
            <Trash2 className="size-4" />
          </button>
        </Tooltip>
        {open &&
          flyPos &&
          createPortal(
            <div
              ref={flyoutRef}
              style={{
                position: 'fixed',
                bottom: flyPos.bottom,
                left: flyPos.left,
                zIndex: 80,
              }}
              className="rounded-md border border-notion-border bg-notion-bg shadow-lg"
            >
              {list}
            </div>,
            document.body,
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
