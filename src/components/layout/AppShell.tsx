import { CalendarDays, Moon, PanelLeftClose, PanelLeftOpen, Search, Sun } from 'lucide-react'
import { useState } from 'react'
import { usePagesContext } from '../../context/PagesContext'
import { useSidebarCollapsed } from '../../hooks/useSidebarCollapsed'
import { useTheme } from '../../hooks/useTheme'
import { BlockEditor } from '../editor/BlockEditor'
import { KanbanBoard } from '../board/KanbanBoard'
import { DatabaseView } from '../database/DatabaseView'
import { NewPageButton } from '../sidebar/NewPageButton'
import { PageTree } from '../sidebar/PageTree'
import { SidebarBackup } from '../sidebar/SidebarBackup'
import { AboutModal } from './AboutModal'
import { CommandPalette } from './CommandPalette'
import { ShortcutsHelp } from './ShortcutsHelp'
import { WelcomePanel } from './WelcomePanel'

export function AppShell() {
  const { theme, toggle } = useTheme()
  const { activePage, loading, showWelcome, openOrCreateDailyNote } = usePagesContext()
  const { collapsed, toggle: toggleSidebar } = useSidebarCollapsed()
  const [aboutOpen, setAboutOpen] = useState(false)

  return (
    <div className="flex h-full bg-notion-bg text-notion-text">
      <aside
        className={`flex shrink-0 flex-col border-r border-notion-border bg-notion-sidebar transition-[width] duration-200 ${
          collapsed ? 'w-14' : 'w-60'
        }`}
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-1 px-1 py-2">
            <button
              type="button"
              onClick={() => setAboutOpen(true)}
              className="flex size-9 items-center justify-center rounded-md hover:bg-notion-hover"
              title="Acerca de ANOtaciones"
              aria-label="Acerca de ANOtaciones"
            >
              <img src="/logo.png" alt="" className="size-6 rounded object-contain" />
            </button>
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex size-9 items-center justify-center rounded-md text-notion-text/70 hover:bg-notion-hover"
              title="Mostrar barra lateral"
              aria-label="Mostrar barra lateral"
            >
              <PanelLeftOpen className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Buscar (Ctrl+K)"
              title="Buscar (Ctrl+K)"
              className="flex size-9 items-center justify-center rounded-md text-notion-text/70 hover:bg-notion-hover"
              onClick={() => window.dispatchEvent(new Event('anotacion:open-search'))}
            >
              <Search className="size-4" />
            </button>
            <ShortcutsHelp />
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              className="flex size-9 items-center justify-center rounded-md text-notion-text/70 hover:bg-notion-hover"
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 py-3">
            <button
              type="button"
              onClick={() => setAboutOpen(true)}
              className="flex min-w-0 items-center gap-2 rounded-md pr-1 hover:bg-notion-hover"
              title="Acerca de ANOtaciones"
              aria-label="Acerca de ANOtaciones"
            >
              <img src="/logo.png" alt="" className="size-6 shrink-0 rounded object-contain" />
              <span className="truncate text-sm font-semibold tracking-tight">ANOtaciones</span>
            </button>
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
              <button
                type="button"
                onClick={toggleSidebar}
                className="rounded-md p-1.5 text-notion-text/70 hover:bg-notion-hover"
                title="Ocultar barra lateral"
                aria-label="Ocultar barra lateral"
              >
                <PanelLeftClose className="size-4" />
              </button>
            </div>
          </div>
        )}

        <div className={`space-y-1 pb-2 ${collapsed ? 'flex flex-col items-center px-1' : 'px-2'}`}>
          <NewPageButton collapsed={collapsed} />
          <button
            type="button"
            onClick={() => void openOrCreateDailyNote()}
            title="Nota del día"
            aria-label="Nota del día"
            className={`flex items-center gap-2 rounded-md text-sm text-notion-text hover:bg-notion-hover ${
              collapsed ? 'size-9 justify-center' : 'w-full px-2 py-1.5'
            }`}
          >
            <CalendarDays className="size-4 shrink-0 opacity-60" />
            {!collapsed && 'Nota del día'}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          {loading ? (
            !collapsed && <p className="px-3 text-xs text-notion-text/50">Cargando…</p>
          ) : (
            <PageTree collapsed={collapsed} />
          )}
        </div>

        <SidebarBackup collapsed={collapsed} />
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
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  )
}
