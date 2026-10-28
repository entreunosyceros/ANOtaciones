import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Tooltip } from './Tooltip'

const EMOJIS = [
  '📝', '📒', '📚', '💡', '⭐', '🔥', '🎯', '🚀',
  '✅', '📌', '🗂️', '🧠', '💬', '📅', '🏠', '💼',
  '🛠️', '🎨', '🎵', '📷', '🧪', '📊', '🧩', '🔐',
  '🌱', '☕', '🌙', '☀️', '❤️', '⚡', '🏆', '🎁',
  '🐶', '🐱', '🌈', '🏝️', '✈️', '🛒', '🍳', '💻',
]

export function EmojiPicker({
  value,
  onChange,
  onClose,
}: {
  value: string | null
  onChange: (emoji: string | null) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-30 mt-1 w-56 rounded-md border border-notion-border bg-notion-bg p-2 shadow-lg"
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-xs text-notion-text/50">Elegir icono</span>
        <button
          type="button"
          className="text-xs text-notion-text/60 hover:text-notion-text"
          onClick={() => {
            onChange(null)
            onClose()
          }}
        >
          Quitar
        </button>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={`rounded p-1 text-lg hover:bg-notion-hover ${value === emoji ? 'bg-notion-active' : ''}`}
            onClick={() => {
              onChange(emoji)
              onClose()
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

export function PageIconButton({
  icon,
  fallback,
  onChange,
}: {
  icon: string | null
  fallback: ReactNode
  onChange: (emoji: string | null) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative shrink-0">
      <Tooltip content="Cambiar icono de la página">
        <button
          type="button"
          aria-label="Cambiar icono de la página"
          className="flex size-10 items-center justify-center rounded-md text-2xl hover:bg-notion-hover"
          onClick={() => setOpen((v) => !v)}
        >
          {icon ? <span>{icon}</span> : fallback}
        </button>
      </Tooltip>
      {open && (
        <EmojiPicker value={icon} onChange={onChange} onClose={() => setOpen(false)} />
      )}
    </div>
  )
}
