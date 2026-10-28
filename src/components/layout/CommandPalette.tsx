import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { usePagesContext } from '../../context/PagesContext'
import type { PageKind } from '../../db/types'
import { searchPages } from '../../lib/search'

const KINDS: { value: PageKind | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'doc', label: 'Docs' },
  { value: 'board', label: 'Tableros' },
  { value: 'database', label: 'BBDD' },
]

export function CommandPalette() {
  const { pages, tags, setActivePageId } = usePagesContext()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [kind, setKind] = useState<PageKind | 'all'>('all')
  const [tagId, setTagId] = useState<string | null>(null)

  const results = useMemo(
    () => searchPages(pages, query, { kind, tagId }, tags),
    [pages, query, kind, tagId, tags],
  )

  useEffect(() => {
    const openPalette = () => {
      setOpen(true)
      setQuery('')
      setSelected(0)
      setKind('all')
      setTagId(null)
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
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(0)
            }}
            placeholder="Buscar en títulos y contenido…"
            className="w-full bg-transparent py-1.5 text-sm outline-none"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelected((s) => Math.min(s + 1, Math.max(results.length - 1, 0)))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelected((s) => Math.max(s - 1, 0))
              } else if (e.key === 'Enter') {
                const hit = results[selected]
                if (hit) {
                  setActivePageId(hit.page.id)
                  setOpen(false)
                }
              }
            }}
          />
        </div>
        <div className="flex flex-wrap gap-1 border-b border-notion-border px-3 py-2">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              className={`rounded-md px-2 py-0.5 text-[11px] ${
                kind === k.value ? 'bg-notion-active' : 'hover:bg-notion-hover'
              }`}
              onClick={() => {
                setKind(k.value)
                setSelected(0)
              }}
            >
              {k.label}
            </button>
          ))}
          {tags.length > 0 && (
            <select
              className="ml-auto rounded-md border border-notion-border bg-transparent px-1 py-0.5 text-[11px]"
              value={tagId ?? ''}
              onChange={(e) => {
                setTagId(e.target.value || null)
                setSelected(0)
              }}
              aria-label="Filtrar por etiqueta"
            >
              <option value="">Todas las etiquetas</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <ul className="max-h-72 overflow-y-auto p-1">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-notion-text/50">Sin resultados</li>
          ) : (
            results.map((hit, i) => (
              <li key={hit.page.id}>
                <button
                  type="button"
                  className={`flex w-full flex-col rounded px-3 py-2 text-left text-sm ${
                    i === selected ? 'bg-notion-active' : 'hover:bg-notion-hover'
                  }`}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => {
                    setActivePageId(hit.page.id)
                    setOpen(false)
                  }}
                >
                  <span>{hit.page.title || 'Sin título'}</span>
                  {hit.snippet && (
                    <span className="truncate text-[11px] text-notion-text/45">{hit.snippet}</span>
                  )}
                  {hit.match !== 'title' && !hit.snippet && (
                    <span className="text-[11px] text-notion-text/45">
                      {hit.match === 'tag' ? 'Etiqueta' : 'Contenido'}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
