import { Download, Upload } from 'lucide-react'
import { useRef } from 'react'
import { usePagesContext } from '../../context/PagesContext'
import { downloadBackupJson, parseBackup } from '../../lib/backup'

export function SidebarBackup({ collapsed = false }: { collapsed?: boolean }) {
  const { pages, importBackup } = usePagesContext()
  const inputRef = useRef<HTMLInputElement>(null)

  const importFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result))
        const pagesIn = parseBackup(json)
        void importBackup(pagesIn)
      } catch {
        window.alert('No se pudo importar el archivo de respaldo.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div
      className={`border-t border-notion-border px-2 py-2 ${
        collapsed ? 'flex flex-col items-center gap-1' : 'flex gap-1'
      }`}
    >
      <button
        type="button"
        className={`flex items-center justify-center gap-1 rounded-md text-xs text-notion-text/70 hover:bg-notion-hover ${
          collapsed ? 'size-9' : 'flex-1 px-2 py-1.5'
        }`}
        onClick={() => downloadBackupJson(pages)}
        title="Exportar JSON"
        aria-label="Exportar JSON"
      >
        <Download className="size-3.5" />
        {!collapsed && 'Exportar'}
      </button>
      <button
        type="button"
        className={`flex items-center justify-center gap-1 rounded-md text-xs text-notion-text/70 hover:bg-notion-hover ${
          collapsed ? 'size-9' : 'flex-1 px-2 py-1.5'
        }`}
        onClick={() => inputRef.current?.click()}
        title="Importar JSON"
        aria-label="Importar JSON"
      >
        <Upload className="size-3.5" />
        {!collapsed && 'Importar'}
      </button>
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
    </div>
  )
}
