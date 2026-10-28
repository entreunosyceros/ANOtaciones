import { History } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePagesContext } from '../../context/PagesContext'
import type { PageRevision } from '../../db/types'
import { formatDateTimeEs } from '../../lib/dates'

export function RevisionHistory({ pageId }: { pageId: string }) {
  const { listPageRevisions, restorePageRevision, snapshotRevision } = usePagesContext()
  const [open, setOpen] = useState(false)
  const [revs, setRevs] = useState<PageRevision[]>([])

  useEffect(() => {
    if (!open) return
    void listPageRevisions(pageId).then(setRevs)
  }, [open, pageId, listPageRevisions])

  return (
    <div className="relative">
      <button
        type="button"
        title="Historial de versiones"
        aria-label="Historial de versiones"
        className="rounded-md p-1.5 text-notion-text/50 hover:bg-notion-hover"
        onClick={() => setOpen((v) => !v)}
      >
        <History className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-64 rounded-md border border-notion-border bg-notion-bg p-2 shadow-lg">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium">Historial</span>
            <button
              type="button"
              className="rounded px-1 hover:bg-notion-hover"
              onClick={() => void snapshotRevision(pageId).then(() => listPageRevisions(pageId).then(setRevs))}
            >
              Guardar ahora
            </button>
          </div>
          <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
            {revs.length === 0 ? (
              <li className="text-notion-text/45">Sin versiones</li>
            ) : (
              revs.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-1">
                  <span className="truncate">{formatDateTimeEs(r.createdAt)}</span>
                  <button
                    type="button"
                    className="shrink-0 rounded px-1 hover:bg-notion-hover"
                    onClick={() => {
                      if (window.confirm('¿Restaurar esta versión?')) {
                        void restorePageRevision(r.id).then(() => setOpen(false))
                      }
                    }}
                  >
                    Restaurar
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
