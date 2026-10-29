import { Download, FileDown, HardDriveDownload, Upload } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePagesContext } from '../../context/PagesContext'
import { downloadBackupJson, type ImportMode } from '../../lib/backup'
import { markBackupExported, shouldRemindBackup } from '../../lib/backupReminders'
import { markdownToTipTap, pageToMarkdownFile } from '../../lib/markdown'
import { downloadWikiExport } from '../../lib/wikiExport'
import { Tooltip } from '../ui/Tooltip'

export function SidebarBackup({ collapsed = false }: { collapsed?: boolean }) {
  const {
    pages,
    allPages,
    tags,
    savedViews,
    attachments,
    bookmarkFolders,
    bookmarkTags,
    bookmarks,
    importBackup,
    createPage,
    activePage,
  } = usePagesContext()
  const inputRef = useRef<HTMLInputElement>(null)
  const mdRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const flyoutRef = useRef<HTMLDivElement>(null)
  const [remind, setRemind] = useState(() => shouldRemindBackup())
  const [open, setOpen] = useState(false)
  const [flyPos, setFlyPos] = useState<{ bottom: number; left: number } | null>(null)

  useEffect(() => {
    if (!collapsed) setOpen(false)
  }, [collapsed])

  useLayoutEffect(() => {
    if (!open || !collapsed || !btnRef.current) {
      setFlyPos(null)
      return
    }
    const place = () => {
      const r = btnRef.current!.getBoundingClientRect()
      setFlyPos({
        bottom: Math.max(8, window.innerHeight - r.bottom),
        left: r.right + 4,
      })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open, collapsed])

  useEffect(() => {
    if (!open || !collapsed) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t) || flyoutRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, collapsed])

  const exportAll = () => {
    downloadBackupJson(
      allPages,
      tags,
      savedViews,
      attachments,
      bookmarkFolders,
      bookmarkTags,
      bookmarks,
    )
    markBackupExported()
    setRemind(false)
  }

  const importFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result))
        const replace = window.confirm(
          '¿Reemplazar todas las páginas actuales por el respaldo?\n\nAceptar = reemplazar\nCancelar = fusionar (actualizar por id)',
        )
        const mode: ImportMode = replace ? 'replace' : 'merge'
        if (mode === 'replace') {
          const ok = window.confirm(
            'Esto borrará las páginas actuales y las sustituirá por el archivo. ¿Continuar?',
          )
          if (!ok) return
        }
        void importBackup(json, mode).then((report) => {
          const parts = [
            `Importadas: ${report.accepted.length}`,
            report.rejected.length ? `Rechazadas: ${report.rejected.length}` : null,
            report.orphanParentIds.length
              ? `Padres huérfanos: ${report.orphanParentIds.length}`
              : null,
            report.brokenPageLinks.length
              ? `Enlaces rotos: ${report.brokenPageLinks.length}`
              : null,
          ].filter(Boolean)
          window.alert(parts.join('\n'))
          markBackupExported()
          setRemind(false)
        })
      } catch {
        window.alert('No se pudo importar el archivo de respaldo.')
      }
    }
    reader.readAsText(file)
  }

  const importMarkdown = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result)
      const title = file.name.replace(/\.md$/i, '') || 'Importada'
      const content = markdownToTipTap(text.replace(/^---[\s\S]*?---\n*/, ''))
      void createPage({ parentId: null, title, content, kind: 'doc' })
    }
    reader.readAsText(file)
  }

  const exportActiveMd = () => {
    if (!activePage) {
      window.alert('Abre una página para exportar a Markdown.')
      return
    }
    const md = pageToMarkdownFile(activePage.title, activePage.content, activePage.id)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activePage.title || 'pagina'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const fileInputs = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) importFile(file)
        }}
      />
      <input
        ref={mdRef}
        type="file"
        accept=".md,text/markdown"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) importMarkdown(file)
        }}
      />
    </>
  )

  if (collapsed) {
    const actions: { label: string; icon: typeof Download; run: () => void }[] = [
      {
        label: 'Exportar JSON',
        icon: Download,
        run: () => {
          exportAll()
          setOpen(false)
        },
      },
      {
        label: 'Importar JSON',
        icon: Upload,
        run: () => {
          setOpen(false)
          inputRef.current?.click()
        },
      },
      {
        label: 'Exportar Markdown',
        icon: FileDown,
        run: () => {
          exportActiveMd()
          setOpen(false)
        },
      },
      {
        label: 'Importar Markdown',
        icon: Upload,
        run: () => {
          setOpen(false)
          mdRef.current?.click()
        },
      },
      {
        label: 'Exportar wiki',
        icon: FileDown,
        run: () => {
          downloadWikiExport(pages)
          setOpen(false)
        },
      },
    ]

    return (
      <div ref={rootRef} className="relative flex flex-col items-center border-t border-notion-border py-2">
        <Tooltip content="Copia de seguridad" side="right">
          <button
            ref={btnRef}
            type="button"
            aria-label="Copia de seguridad"
            aria-expanded={open}
            className={`relative flex size-9 items-center justify-center rounded-md text-notion-text/70 hover:bg-notion-hover ${
              remind ? 'ring-1 ring-amber-500/50' : ''
            }`}
            onClick={() => setOpen((v) => !v)}
          >
            <HardDriveDownload className="size-4" />
            {remind && (
              <span
                className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-amber-500"
                aria-hidden
              />
            )}
          </button>
        </Tooltip>
        {open &&
          flyPos &&
          createPortal(
            <div
              ref={flyoutRef}
              style={{
                position: 'fixed',
                bottom: flyPos.bottom,
                left: flyPos.left,
                zIndex: 80,
              }}
              className="w-52 rounded-md border border-notion-border bg-notion-bg p-1 shadow-lg"
            >
              {remind && (
                <p className="mb-1 rounded-md bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-800 dark:text-amber-200">
                  Haz una copia de seguridad. Llevas tiempo sin exportar.
                </p>
              )}
              {actions.map(({ label, icon: Icon, run }) => (
                <button
                  key={label}
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-notion-text hover:bg-notion-hover"
                  onClick={run}
                >
                  <Icon className="size-3.5 shrink-0 opacity-60" />
                  {label}
                </button>
              ))}
            </div>,
            document.body,
          )}
        {fileInputs}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 border-t border-notion-border px-2 py-2">
      {remind && (
        <p className="rounded-md bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-800 dark:text-amber-200">
          Haz una copia de seguridad. Llevas tiempo sin exportar.
        </p>
      )}
      <div className="flex flex-wrap gap-1">
        <Tooltip content="Exportar JSON" side="top" className="flex-1">
          <button
            type="button"
            className={`flex w-full items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs text-notion-text/70 hover:bg-notion-hover ${
              remind ? 'ring-1 ring-amber-500/50' : ''
            }`}
            onClick={exportAll}
            aria-label="Exportar JSON"
          >
            <Download className="size-3.5" />
            JSON
          </button>
        </Tooltip>
        <Tooltip content="Importar JSON" side="top" className="flex-1">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs text-notion-text/70 hover:bg-notion-hover"
            onClick={() => inputRef.current?.click()}
            aria-label="Importar JSON"
          >
            <Upload className="size-3.5" />
            Importar
          </button>
        </Tooltip>
        <button
          type="button"
          title="Exportar página activa a Markdown"
          className="rounded-md px-2 py-1.5 text-xs text-notion-text/70 hover:bg-notion-hover"
          onClick={exportActiveMd}
        >
          MD
        </button>
        <button
          type="button"
          title="Importar Markdown"
          className="rounded-md px-2 py-1.5 text-xs text-notion-text/70 hover:bg-notion-hover"
          onClick={() => mdRef.current?.click()}
        >
          +MD
        </button>
        <button
          type="button"
          title="Exportar wiki completa"
          className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-notion-text/70 hover:bg-notion-hover"
          onClick={() => downloadWikiExport(pages)}
        >
          <FileDown className="size-3.5" />
          Wiki
        </button>
      </div>
      {fileInputs}
    </div>
  )
}
