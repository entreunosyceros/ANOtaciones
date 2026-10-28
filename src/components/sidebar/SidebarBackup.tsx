import { Download, Upload } from 'lucide-react'
import { useRef } from 'react'
import { usePagesContext } from '../../context/PagesContext'
import { downloadBackupJson, parseBackup } from '../../lib/backup'

export function SidebarBackup() {
  const { pages, importBackup } = usePagesContext()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex gap-1 border-t border-notion-border px-2 py-2">
      <button
        type="button"
        className="flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs text-notion-text/70 hover:bg-notion-hover"
        onClick={() => downloadBackupJson(pages)}
        title="Exportar JSON"
      >
        <Download className="size-3.5" />
        Exportar
      </button>
      <button
        type="button"
        className="flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs text-notion-text/70 hover:bg-notion-hover"
        onClick={() => inputRef.current?.click()}
        title="Importar JSON"
      >
        <Upload className="size-3.5" />
        Importar
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
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
        }}
      />
    </div>
  )
}
