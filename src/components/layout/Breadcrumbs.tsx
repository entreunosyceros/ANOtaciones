import { ChevronRight } from 'lucide-react'
import { usePagesContext } from '../../context/PagesContext'
import { buildBreadcrumbs } from '../../lib/breadcrumbs'

export function Breadcrumbs({ pageId }: { pageId: string }) {
  const { pages, setActivePageId } = usePagesContext()
  const trail = buildBreadcrumbs(pages, pageId)

  if (trail.length <= 1) return null

  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-notion-text/50" aria-label="Migas">
      {trail.map((page, i) => {
        const last = i === trail.length - 1
        return (
          <span key={page.id} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 opacity-50" />}
            {last ? (
              <span className="text-notion-text/70">{page.title || 'Sin título'}</span>
            ) : (
              <button
                type="button"
                title={`Ir a «${page.title || 'Sin título'}»`}
                aria-label={`Ir a «${page.title || 'Sin título'}»`}
                className="hover:text-notion-text"
                onClick={() => setActivePageId(page.id)}
              >
                {page.title || 'Sin título'}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}
