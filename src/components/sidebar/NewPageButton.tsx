import { Columns3, Database, FileText, LayoutTemplate, Plus } from 'lucide-react'
import { useState } from 'react'
import { usePagesContext } from '../../context/PagesContext'
import type { PageKind } from '../../db/types'
import { Tooltip } from '../ui/Tooltip'

const OPTIONS: { kind: PageKind; label: string; hint: string; icon: typeof FileText }[] = [
  { kind: 'doc', label: 'Documento', hint: 'Página de texto con editor', icon: FileText },
  { kind: 'board', label: 'Tablero Kanban', hint: 'Columnas Pendiente / En curso / Hecho', icon: Columns3 },
  { kind: 'database', label: 'Base de datos', hint: 'Tabla, galería o tablero', icon: Database },
]

export function NewPageButton({ collapsed = false }: { collapsed?: boolean }) {
  const { createPage, templates, createFromTemplate } = usePagesContext()
  const [open, setOpen] = useState(false)

  return (
    <div className={`relative ${collapsed ? '' : 'w-full'}`}>
      <Tooltip
        content="Crear documento, tablero o base de datos"
        side={collapsed ? 'right' : 'bottom'}
        className={collapsed ? '' : 'w-full'}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Crear documento, tablero o base de datos"
          className={`flex items-center gap-2 rounded-md text-sm text-notion-text hover:bg-notion-hover ${
            collapsed ? 'size-9 justify-center' : 'w-full px-2 py-1.5'
          }`}
        >
          <Plus className="size-4 shrink-0 opacity-60" />
          {!collapsed && 'Nueva página'}
        </button>
      </Tooltip>
      {open && (
        <div
          className={`absolute z-20 mt-1 rounded-md border border-notion-border bg-notion-bg p-1 shadow-lg ${
            collapsed ? 'left-full top-0 ml-1 w-56' : 'left-0 right-0'
          }`}
        >
          {OPTIONS.map(({ kind, label, hint, icon: Icon }) => (
            <button
              key={kind}
              type="button"
              title={hint}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-notion-hover"
              onClick={() => {
                setOpen(false)
                void createPage({ parentId: null, kind })
              }}
            >
              <Icon className="size-4 shrink-0 opacity-60" />
              <span className="flex min-w-0 flex-col">
                <span>{label}</span>
                <span className="truncate text-[11px] text-notion-text/45">{hint}</span>
              </span>
            </button>
          ))}
          <button
            type="button"
            title="Crear una plantilla reutilizable"
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-notion-hover"
            onClick={() => {
              setOpen(false)
              void createPage({
                parentId: null,
                kind: 'doc',
                title: 'Nueva plantilla',
                isTemplate: true,
                open: true,
              })
            }}
          >
            <LayoutTemplate className="size-4 shrink-0 opacity-60" />
            <span className="flex min-w-0 flex-col">
              <span>Plantilla</span>
              <span className="truncate text-[11px] text-notion-text/45">
                Guardar un modelo reutilizable
              </span>
            </span>
          </button>
          {templates.length > 0 && (
            <>
              <div className="my-1 border-t border-notion-border" />
              <p className="px-2 py-1 text-[10px] uppercase tracking-wide text-notion-text/40">
                Desde plantilla
              </p>
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  title={`Crear página desde «${t.title}»`}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-notion-hover"
                  onClick={() => {
                    setOpen(false)
                    void createFromTemplate(t.id)
                  }}
                >
                  <LayoutTemplate className="size-4 shrink-0 opacity-60" />
                  <span className="truncate">{t.title || 'Sin título'}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
