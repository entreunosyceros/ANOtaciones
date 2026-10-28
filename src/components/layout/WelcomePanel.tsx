import { CalendarDays, Columns3, Database, FileText } from 'lucide-react'
import { usePagesContext } from '../../context/PagesContext'

export function WelcomePanel() {
  const { createPage, openOrCreateDailyNote, patchPage, pages } = usePagesContext()
  const bootstrap = pages[0]

  const startOnBootstrap = async () => {
    if (bootstrap) {
      await patchPage(bootstrap.id, {
        title: 'Mi primera nota',
        icon: '📝',
      })
    } else {
      await createPage({ parentId: null, kind: 'doc', title: 'Mi primera nota', icon: '📝' })
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-8 py-20 text-center">
      <img src="/logo.png" alt="ANOtaciones" className="mb-6 size-16 rounded-lg object-contain" />
      <h1 className="mb-2 text-3xl font-bold tracking-tight">ANOtaciones</h1>
      <p className="mb-8 text-sm text-notion-text/60">
        Tu espacio local para notas, tableros y bases de datos. Todo se guarda en este navegador.
      </p>
      <div className="grid w-full gap-2 sm:grid-cols-2">
        <button
          type="button"
          title="Empezar con una nota de texto"
          onClick={() => void startOnBootstrap()}
          className="flex items-center gap-2 rounded-lg border border-notion-border px-4 py-3 text-left text-sm hover:bg-notion-hover"
        >
          <FileText className="size-4 opacity-60" />
          Nueva nota
        </button>
        <button
          type="button"
          title="Abrir o crear la nota con la fecha de hoy"
          onClick={() => void openOrCreateDailyNote()}
          className="flex items-center gap-2 rounded-lg border border-notion-border px-4 py-3 text-left text-sm hover:bg-notion-hover"
        >
          <CalendarDays className="size-4 opacity-60" />
          Nota del día
        </button>
        <button
          type="button"
          title="Crear un tablero Kanban para tareas"
          onClick={() => void createPage({ parentId: null, kind: 'board' })}
          className="flex items-center gap-2 rounded-lg border border-notion-border px-4 py-3 text-left text-sm hover:bg-notion-hover"
        >
          <Columns3 className="size-4 opacity-60" />
          Nuevo tablero
        </button>
        <button
          type="button"
          title="Crear una base de datos con vistas"
          onClick={() => void createPage({ parentId: null, kind: 'database' })}
          className="flex items-center gap-2 rounded-lg border border-notion-border px-4 py-3 text-left text-sm hover:bg-notion-hover"
        >
          <Database className="size-4 opacity-60" />
          Nueva base de datos
        </button>
      </div>
    </div>
  )
}
