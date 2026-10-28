import { X } from 'lucide-react'
import { useEffect } from 'react'

export function ImageLightbox({
  src,
  onClose,
}: {
  src: string | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!src) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [src, onClose])

  if (!src) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Imagen a pantalla completa"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
        onClick={onClose}
      >
        <X className="size-5" />
      </button>
      <img
        src={src}
        alt=""
        className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
