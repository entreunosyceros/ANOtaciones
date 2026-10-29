import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type Side = 'top' | 'bottom' | 'left' | 'right'

export function Tooltip({
  content,
  children,
  side = 'bottom',
  className = '',
}: {
  content: string
  children: ReactNode
  side?: Side
  className?: string
}) {
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tipRef = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setPos(null)
      return
    }
    const place = () => {
      const r = triggerRef.current!.getBoundingClientRect()
      const tip = tipRef.current
      const tw = tip?.offsetWidth ?? 0
      const th = tip?.offsetHeight ?? 0
      const gap = 6
      let top = 0
      let left = 0
      if (side === 'right') {
        top = r.top + r.height / 2 - th / 2
        left = r.right + gap
      } else if (side === 'left') {
        top = r.top + r.height / 2 - th / 2
        left = r.left - tw - gap
      } else if (side === 'top') {
        top = r.top - th - gap
        left = r.left + r.width / 2 - tw / 2
      } else {
        top = r.bottom + gap
        left = r.left + r.width / 2 - tw / 2
      }
      top = Math.max(4, Math.min(top, window.innerHeight - th - 4))
      left = Math.max(4, Math.min(left, window.innerWidth - tw - 4))
      setPos({ top, left })
    }
    place()
    // Segunda pasada cuando el tip ya midió tamaño real
    requestAnimationFrame(place)
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, side, content])

  if (!content) return <>{children}</>

  return (
    <span
      ref={triggerRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open &&
        createPortal(
          <span
            ref={tipRef}
            role="tooltip"
            style={
              pos
                ? { position: 'fixed', top: pos.top, left: pos.left, zIndex: 100 }
                : { position: 'fixed', top: -9999, left: -9999, zIndex: 100, visibility: 'hidden' }
            }
            className="pointer-events-none whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900"
          >
            {content}
          </span>,
          document.body,
        )}
    </span>
  )
}
