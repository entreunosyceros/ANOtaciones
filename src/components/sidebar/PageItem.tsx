import { ChevronRight, Copy, Plus, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { usePagesContext } from '../../context/PagesContext'
import type { PageNode } from '../../db/types'
import { Tooltip } from '../ui/Tooltip'
import { KindIcon } from './pageGlyph'

export function PageItem({ node, depth = 0 }: { node: PageNode; depth?: number }) {
  const { activePageId, setActivePageId, createPage, deletePage, toggleFavorite, duplicatePage } =
    usePagesContext()
  const [expanded, setExpanded] = useState(true)
  const isActive = activePageId === node.id
  const hasChildren = node.children.length > 0
  const label = node.title || 'Sin título'

  return (
    <div>
      <div
        className={`group flex items-center gap-0.5 rounded-md text-sm ${
          isActive ? 'bg-notion-active' : 'hover:bg-notion-hover'
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        <Tooltip content={expanded ? 'Ocultar subpáginas' : 'Mostrar subpáginas'}>
          <button
            type="button"
            aria-label={expanded ? 'Ocultar subpáginas' : 'Mostrar subpáginas'}
            className={`flex size-5 shrink-0 items-center justify-center rounded text-notion-text/50 ${
              hasChildren ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              setExpanded((v) => !v)
            }}
          >
            <ChevronRight
              className={`size-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
          </button>
        </Tooltip>

        <Tooltip content={`Abrir «${label}»`} className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setActivePageId(node.id)}
            aria-label={`Abrir «${label}»`}
            className="flex min-w-0 w-full items-center gap-1.5 py-1 pr-1 text-left text-notion-text"
          >
            {node.icon ? (
              <span className="w-4 shrink-0 text-center text-sm leading-none">{node.icon}</span>
            ) : (
              <KindIcon kind={node.kind} />
            )}
            <span className="truncate">{label}</span>
            {node.isFavorite && <Star className="size-3 fill-amber-400 text-amber-400" />}
          </button>
        </Tooltip>

        <div className="mr-1 flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <Tooltip content="Duplicar página">
            <button
              type="button"
              aria-label="Duplicar página"
              className="rounded p-0.5 text-notion-text/60 hover:bg-notion-hover hover:text-notion-text"
              onClick={(e) => {
                e.stopPropagation()
                void duplicatePage(node.id)
              }}
            >
              <Copy className="size-3.5" />
            </button>
          </Tooltip>
          <Tooltip content={node.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}>
            <button
              type="button"
              aria-label={node.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              className="rounded p-0.5 text-notion-text/60 hover:bg-notion-hover hover:text-notion-text"
              onClick={(e) => {
                e.stopPropagation()
                void toggleFavorite(node.id)
              }}
            >
              <Star
                className={`size-3.5 ${node.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`}
              />
            </button>
          </Tooltip>
          <Tooltip content="Crear subpágina">
            <button
              type="button"
              aria-label="Crear subpágina"
              className="rounded p-0.5 text-notion-text/60 hover:bg-notion-hover hover:text-notion-text"
              onClick={(e) => {
                e.stopPropagation()
                void createPage({ parentId: node.id, kind: 'doc' })
                setExpanded(true)
              }}
            >
              <Plus className="size-3.5" />
            </button>
          </Tooltip>
          <Tooltip content="Mover a la papelera (con subpáginas)">
            <button
              type="button"
              aria-label="Mover a la papelera (con subpáginas)"
              className="rounded p-0.5 text-notion-text/60 hover:bg-notion-hover hover:text-notion-text"
              onClick={(e) => {
                e.stopPropagation()
                void deletePage(node.id)
              }}
            >
              <Trash2 className="size-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {expanded &&
        hasChildren &&
        node.children.map((child) => <PageItem key={child.id} node={child} depth={depth + 1} />)}
    </div>
  )
}
