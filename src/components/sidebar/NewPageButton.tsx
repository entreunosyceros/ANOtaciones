import { Columns3, Database, FileText, Plus } from 'lucide-react'
import { useState } from 'react'
import { usePagesContext } from '../../context/PagesContext'
import type { PageKind } from '../../db/types'

const OPTIONS: { kind: PageKind; label: string; icon: typeof FileText }[] = [
  { kind: 'doc', label: 'Documento', icon: FileText },
  { kind: 'board', label: 'Tablero Kanban', icon: Columns3 },
  { kind: 'database', label: 'Base de datos', icon: Database },
]

export function NewPageButton({ collapsed = false }: { collapsed?: boolean }) {
  const { createPage } = usePagesContext()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Nueva página"
        aria-label="Nueva página"
        className={`flex items-center gap-2 rounded-md text-sm text-notion-text hover:bg-notion-hover ${
          collapsed ? 'mx-auto size-9 justify-center' : 'w-full px-2 py-1.5'
        }`}
      >
        <Plus className="size-4 shrink-0 opacity-60" />
        {!collapsed && 'Nueva página'}
      </button>
      {open && (
        <div
          className={`absolute z-20 mt-1 rounded-md border border-notion-border bg-notion-bg p-1 shadow-lg ${
            collapsed ? 'left-full top-0 ml-1 w-48' : 'left-0 right-0'
          }`}
        >
          {OPTIONS.map(({ kind, label, icon: Icon }) => (
            <button
              key={kind}
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-notion-hover"
              onClick={() => {
                setOpen(false)
                void createPage({ parentId: null, kind })
              }}
            >
              <Icon className="size-4 opacity-60" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
