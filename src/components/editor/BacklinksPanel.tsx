import { Link2 } from 'lucide-react'
import { useMemo } from 'react'
import { usePagesContext } from '../../context/PagesContext'
import { findBacklinks } from '../../lib/backlinks'

export function BacklinksPanel({ pageId }: { pageId: string }) {
  const { allPages, setActivePageId } = usePagesContext()
  const links = useMemo(() => findBacklinks(allPages, pageId), [allPages, pageId])

  if (links.length === 0) return null

  return (
    <section className="mt-10 border-t border-notion-border pt-6">
      <h2 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-notion-text/45">
        <Link2 className="size-3.5" />
        Menciones ({links.length})
      </h2>
      <ul className="space-y-1">
        {links.map((page) => (
          <li key={page.id}>
            <button
              type="button"
              title={`Abrir «${page.title || 'Sin título'}»`}
              className="rounded-md px-2 py-1 text-left text-sm text-notion-text/80 hover:bg-notion-hover hover:text-notion-text"
              onClick={() => setActivePageId(page.id)}
            >
              {page.icon ? `${page.icon} ` : ''}
              {page.title || 'Sin título'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
