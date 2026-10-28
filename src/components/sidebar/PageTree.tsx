import { usePagesContext } from '../../context/PagesContext'
import { Tooltip } from '../ui/Tooltip'
import { PageGlyph } from './pageGlyph'
import { PageItem } from './PageItem'

export function PageTree({ collapsed = false }: { collapsed?: boolean }) {
  const { tree, favorites, recents, pages, templates, setActivePageId, activePageId } =
    usePagesContext()

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
        {ordered.map((page) => {
          const label = page.title || 'Sin título'
          return (
            <Tooltip key={page.id} content={`Abrir «${label}»`} side="right">
              <button
                type="button"
                aria-label={`Abrir «${label}»`}
                onClick={() => setActivePageId(page.id)}
                className={`flex size-9 items-center justify-center rounded-md ${
                  activePageId === page.id ? 'bg-notion-active' : 'hover:bg-notion-hover'
                }`}
              >
                <PageGlyph page={page} />
              </button>
            </Tooltip>
          )
        })}
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
            {favorites.map((page) => {
              const label = page.title || 'Sin título'
              return (
                <button
                  key={page.id}
                  type="button"
                  title={`Abrir favorito «${label}»`}
                  aria-label={`Abrir favorito «${label}»`}
                  onClick={() => setActivePageId(page.id)}
                  className={`truncate rounded-md px-2 py-1 text-left text-sm ${
                    activePageId === page.id ? 'bg-notion-active' : 'hover:bg-notion-hover'
                  }`}
                >
                  {page.icon ? `${page.icon} ` : ''}
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {recents.length > 0 && (
        <div>
          <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-notion-text/40">
            Recientes
          </p>
          <div className="flex flex-col gap-0.5 px-1">
            {recents.map((page) => {
              const label = page.title || 'Sin título'
              return (
                <button
                  key={`recent-${page.id}`}
                  type="button"
                  title={`Abrir reciente «${label}»`}
                  aria-label={`Abrir reciente «${label}»`}
                  onClick={() => setActivePageId(page.id)}
                  className={`truncate rounded-md px-2 py-1 text-left text-sm ${
                    activePageId === page.id ? 'bg-notion-active' : 'hover:bg-notion-hover'
                  }`}
                >
                  {page.icon ? `${page.icon} ` : ''}
                  {label}
                </button>
              )
            })}
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

      {templates.length > 0 && (
        <div>
          <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-notion-text/40">
            Plantillas
          </p>
          <div className="flex flex-col gap-0.5 px-1">
            {templates.map((page) => {
              const label = page.title || 'Sin título'
              return (
                <button
                  key={`tpl-${page.id}`}
                  type="button"
                  title={`Editar plantilla «${label}»`}
                  aria-label={`Editar plantilla «${label}»`}
                  onClick={() => setActivePageId(page.id)}
                  className={`truncate rounded-md px-2 py-1 text-left text-sm ${
                    activePageId === page.id ? 'bg-notion-active' : 'hover:bg-notion-hover'
                  }`}
                >
                  {page.icon ? `${page.icon} ` : ''}
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
