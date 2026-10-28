import type { ReactNode } from 'react'

type Side = 'top' | 'bottom' | 'left' | 'right'

const SIDE_CLASS: Record<Side, string> = {
  top: 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-1.5 -translate-x-1/2',
  left: 'right-full top-1/2 mr-1.5 -translate-y-1/2',
  right: 'left-full top-1/2 ml-1.5 -translate-y-1/2',
}

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
  if (!content) return <>{children}</>

  return (
    <span className={`group/tip relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity delay-200 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100 dark:bg-neutral-100 dark:text-neutral-900 ${SIDE_CLASS[side]}`}
      >
        {content}
      </span>
    </span>
  )
}
