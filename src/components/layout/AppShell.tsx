import { CalendarDays, Moon, Search, Sun } from 'lucide-react'
import { usePagesContext } from '../../context/PagesContext'
import { useTheme } from '../../hooks/useTheme'
import { BlockEditor } from '../editor/BlockEditor'
import { KanbanBoard } from '../board/KanbanBoard'
import { DatabaseView } from '../database/DatabaseView'
import { NewPageButton } from '../sidebar/NewPageButton'
import { PageTree } from '../sidebar/PageTree'
import { SidebarBackup } from '../sidebar/SidebarBackup'
import { CommandPalette } from './CommandPalette'
import { ShortcutsHelp } from './ShortcutsHelp'
import { WelcomePanel } from './WelcomePanel'

export function AppShell() {
  const { theme, toggle } = useTheme()
  const { activePage, loading, showWelcome, openOrCreateDailyNote } = usePagesContext()

  return (
    <div className="flex h-full bg-notion-bg text-notion-text">
      <aside className="flex w-60 shrink-0 flex-col border-r border-notion-border bg-notion-sidebar">
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <img src="/logo.png" alt="" className="size-6 shrink-0 rounded object-contain" />
            <span className="truncate text-sm font-semibold tracking-tight">ANOtaciones</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label="Buscar (Ctrl+K)"
              className="rounded-md p-1.5 text-notion-text/70 hover:bg-notion-hover"
              onClick={() => window.dispatchEvent(new Event('anotacion:open-search'))}
            >
              <Search className="size-4" />
            </button>
            <ShortcutsHelp />
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              className="rounded-md p-1.5 text-notion-text/70 hover:bg-notion-hover"
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1 px-2 pb-2">
          <NewPageButton />
          <button
            type="button"
            onClick={() => void openOrCreateDailyNote()}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-notion-text hover:bg-notion-hover"
          >
            <CalendarDays className="size-4 shrink-0 opacity-60" />
            Nota del día
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          {loading ? (
            <p className="px-3 text-xs text-notion-text/50">Cargando…</p>
          ) : (
            <PageTree />
          )}
        </div>

        <SidebarBackup />
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto bg-notion-bg">
        {loading ? null : showWelcome ? (
          <WelcomePanel />
        ) : activePage ? (
          activePage.kind === 'database' ? (
            <DatabaseView page={activePage} />
          ) : activePage.kind === 'board' ? (
            <KanbanBoard page={activePage} />
          ) : (
            <BlockEditor page={activePage} />
          )
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-notion-text/50">
            Selecciona o crea una página
          </div>
        )}
      </main>

      <CommandPalette />
    </div>
  )
}
