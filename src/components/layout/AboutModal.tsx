import { ExternalLink, X } from 'lucide-react'
import { useEffect } from 'react'

const REPO_URL = 'https://github.com/entreunosyceros/ANOtaciones'

export function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        className="relative w-full max-w-sm rounded-lg border border-notion-border bg-notion-bg p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Cerrar"
          className="absolute right-3 top-3 rounded-md p-1 text-notion-text/50 hover:bg-notion-hover hover:text-notion-text"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <img
            src="/logo.png"
            alt="ANOtaciones"
            className="mb-4 size-16 rounded-lg object-contain"
          />
          <h2 id="about-title" className="mb-2 text-lg font-semibold tracking-tight">
            ANOtaciones
          </h2>
          <p className="mb-5 text-sm leading-relaxed text-notion-text/70">
            Espacio local para notas, tableros Kanban y bases de datos. Todo se guarda en tu
            navegador, sin cuenta ni servidor.
          </p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-notion-border bg-notion-sidebar px-4 py-2 text-sm font-medium text-notion-text hover:bg-notion-hover"
          >
            Ver en GitHub
            <ExternalLink className="size-3.5 opacity-60" />
          </a>
        </div>
      </div>
    </div>
  )
}
