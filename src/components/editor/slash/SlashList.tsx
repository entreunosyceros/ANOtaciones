import { forwardRef, useImperativeHandle, useState } from 'react'
import type { SlashItem } from './slashItems'

export interface SlashListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export const SlashList = forwardRef<
  SlashListRef,
  { items: SlashItem[]; command: (item: SlashItem) => void }
>(function SlashList({ items, command }, ref) {
  const [selected, setSelected] = useState(0)
  const [itemsKey, setItemsKey] = useState(() => items.map((i) => i.title).join('|'))
  const nextKey = items.map((i) => i.title).join('|')
  if (nextKey !== itemsKey) {
    setItemsKey(nextKey)
    setSelected(0)
  }
  const safeSelected = items.length ? Math.min(selected, items.length - 1) : 0

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelected((s) => (s + items.length - 1) % Math.max(items.length, 1))
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelected((s) => (s + 1) % Math.max(items.length, 1))
        return true
      }
      if (event.key === 'Enter') {
        const item = items[safeSelected]
        if (item) command(item)
        return true
      }
      return false
    },
  }))

  if (!items.length) {
    return (
      <div className="rounded-md border border-notion-border bg-notion-bg p-2 text-sm text-notion-text/50 shadow-lg">
        Sin resultados
      </div>
    )
  }

  return (
    <div className="z-50 max-h-72 w-64 overflow-y-auto rounded-md border border-notion-border bg-notion-bg p-1 shadow-lg">
      {items.map((item, index) => (
        <button
          key={item.title}
          type="button"
          className={`flex w-full flex-col rounded px-2 py-1.5 text-left text-sm ${
            index === safeSelected ? 'bg-notion-active' : 'hover:bg-notion-hover'
          }`}
          onClick={() => command(item)}
        >
          <span className="font-medium text-notion-text">{item.title}</span>
          <span className="text-xs text-notion-text/50">{item.description}</span>
        </button>
      ))}
    </div>
  )
})
