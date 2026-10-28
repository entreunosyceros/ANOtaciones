import { Download, FileDown, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { usePagesContext } from '../../context/PagesContext'
import { downloadBackupJson, type ImportMode } from '../../lib/backup'
import { markBackupExported, shouldRemindBackup } from '../../lib/backupReminders'
import { markdownToTipTap, pageToMarkdownFile } from '../../lib/markdown'
import { downloadWikiExport } from '../../lib/wikiExport'
import { Tooltip } from '../ui/Tooltip'

export function SidebarBackup({ collapsed = false }: { collapsed?: boolean }) {
  const { pages, allPages, tags, savedViews, attachments, importBackup, createPage, activePage } =
    usePagesContext()
  const inputRef = useRef<HTMLInputElement>(null)
  const mdRef = useRef<HTMLInputElement>(null)
  const [remind, setRemind] = useState(() => shouldRemindBackup())

  const exportAll = () => {
    downloadBackupJson(allPages, tags, savedViews, attachments)
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

  return (
    <div
      className={`border-t border-notion-border px-2 py-2 ${
        collapsed ? 'flex flex-col items-center gap-1' : 'flex flex-col gap-1'
      }`}
    >
      {remind && !collapsed && (
        <p className="rounded-md bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-800 dark:text-amber-200">
          Haz una copia de seguridad. Llevas tiempo sin exportar.
        </p>
      )}
      <div className={collapsed ? 'flex flex-col items-center gap-1' : 'flex flex-wrap gap-1'}>
        <Tooltip
          content="Exportar JSON"
          side={collapsed ? 'right' : 'top'}
          className={collapsed ? '' : 'flex-1'}
        >
          <button
            type="button"
            className={`flex w-full items-center justify-center gap-1 rounded-md text-xs text-notion-text/70 hover:bg-notion-hover ${
              collapsed ? 'size-9' : 'px-2 py-1.5'
            } ${remind ? 'ring-1 ring-amber-500/50' : ''}`}
            onClick={exportAll}
            aria-label="Exportar JSON"
          >
            <Download className="size-3.5" />
            {!collapsed && 'JSON'}
          </button>
        </Tooltip>
        <Tooltip content="Importar JSON" side={collapsed ? 'right' : 'top'} className={collapsed ? '' : 'flex-1'}>
          <button
            type="button"
            className={`flex w-full items-center justify-center gap-1 rounded-md text-xs text-notion-text/70 hover:bg-notion-hover ${
              collapsed ? 'size-9' : 'px-2 py-1.5'
            }`}
            onClick={() => inputRef.current?.click()}
            aria-label="Importar JSON"
          >
            <Upload className="size-3.5" />
            {!collapsed && 'Importar'}
          </button>
        </Tooltip>
        {!collapsed && (
          <>
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
          </>
        )}
      </div>
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
    </div>
  )
}
