import { usePagesContext } from '../../context/PagesContext'
import { PageItem } from './PageItem'

export function PageTree() {
  const { tree, favorites, recents, setActivePageId, activePageId } = usePagesContext()

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
