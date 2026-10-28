import { Columns3, Database, FileText } from 'lucide-react'
import { usePagesContext } from '../../context/PagesContext'
import type { Page } from '../../db/types'
import { PageItem } from './PageItem'

function PageGlyph({ page }: { page: Page }) {
  if (page.icon) return <span className="text-base leading-none">{page.icon}</span>
  if (page.kind === 'board') return <Columns3 className="size-4 opacity-60" />
  if (page.kind === 'database') return <Database className="size-4 opacity-60" />
  return <FileText className="size-4 opacity-60" />
}

export function PageTree({ collapsed = false }: { collapsed?: boolean }) {
  const { tree, favorites, recents, pages, setActivePageId, activePageId } = usePagesContext()

  if (collapsed) {
    const rail = [
      ...favorites,
      ...pages.filter((p) => !favorites.some((f) => f.id === p.id)),
    ]
    // Prefer roots first for a cleaner rail, then the rest
    const roots = rail.filter((p) => p.parentId === null)
    const rest = rail.filter((p) => p.parentId !== null)
    const ordered = [...roots, ...rest]

    return (
      <nav className="flex flex-col items-center gap-0.5 px-1" aria-label="Páginas">
        {ordered.map((page) => (
          <button
            key={page.id}
            type="button"
            title={page.title || 'Sin título'}
            aria-label={page.title || 'Sin título'}
            onClick={() => setActivePageId(page.id)}
            className={`flex size-9 items-center justify-center rounded-md ${
              activePageId === page.id ? 'bg-notion-active' : 'hover:bg-notion-hover'
            }`}
          >
            <PageGlyph page={page} />
          </button>
        ))}
      </nav>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {favorites.length > 0 && (
        <div>
          <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-notion-text/40">
            Favoritos
          </p>
          <div className="flex flex-col gap-0.5 px-1">
            {favorites.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => setActivePageId(page.id)}
                className={`truncate rounded-md px-2 py-1 text-left text-sm ${
                  activePageId === page.id ? 'bg-notion-active' : 'hover:bg-notion-hover'
                }`}
              >
                {page.icon ? `${page.icon} ` : ''}
                {page.title || 'Sin título'}
              </button>
            ))}
          </div>
        </div>
      )}

      {recents.length > 0 && (
        <div>
          <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-notion-text/40">
            Recientes
          </p>
          <div className="flex flex-col gap-0.5 px-1">
            {recents.map((page) => (
              <button
                key={`recent-${page.id}`}
                type="button"
                onClick={() => setActivePageId(page.id)}
                className={`truncate rounded-md px-2 py-1 text-left text-sm ${
                  activePageId === page.id ? 'bg-notion-active' : 'hover:bg-notion-hover'
                }`}
              >
                {page.icon ? `${page.icon} ` : ''}
                {page.title || 'Sin título'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-notion-text/40">
          Páginas
        </p>
        <nav className="flex flex-col gap-0.5 px-1" aria-label="Páginas">
          {tree.map((node) => (
            <PageItem key={node.id} node={node} />
          ))}
        </nav>
      </div>
    </div>
  )
}
