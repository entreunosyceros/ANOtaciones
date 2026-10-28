import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { usePagesContext } from '../../context/PagesContext'
import { filterPagesByTitle } from '../../lib/search'

export function CommandPalette() {
  const { pages, setActivePageId } = usePagesContext()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)

  const results = useMemo(() => filterPagesByTitle(pages, query), [pages, query])

  useEffect(() => {
    const openPalette = () => {
      setOpen(true)
      setQuery('')
      setSelected(0)
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
        setQuery('')
        setSelected(0)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    const onCustom = () => openPalette()
    window.addEventListener('keydown', onKey)
    window.addEventListener('anotacion:open-search', onCustom)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('anotacion:open-search', onCustom)
    }
  }, [])

  useEffect(() => setSelected(0), [query])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg border border-notion-border bg-notion-bg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-notion-border px-3 py-2">
          <Search className="size-4 text-notion-text/40" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar páginas…"
            className="w-full bg-transparent py-1.5 text-sm outline-none"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelected((s) => Math.min(s + 1, results.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelected((s) => Math.max(s - 1, 0))
              } else if (e.key === 'Enter') {
                const page = results[selected]
                if (page) {
                  setActivePageId(page.id)
                  setOpen(false)
                }
              }
            }}
          />
        </div>
        <ul className="max-h-72 overflow-y-auto p-1">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-notion-text/50">Sin resultados</li>
          ) : (
            results.map((page, i) => (
              <li key={page.id}>
                <button
                  type="button"
                  className={`flex w-full rounded px-3 py-2 text-left text-sm ${
                    i === selected ? 'bg-notion-active' : 'hover:bg-notion-hover'
                  }`}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => {
                    setActivePageId(page.id)
                    setOpen(false)
                  }}
                >
                  {page.title || 'Sin título'}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
