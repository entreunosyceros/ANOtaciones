import {
  CalendarDays,
  CalendarRange,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Stethoscope,
  Sun,
} from 'lucide-react'
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
import { TrashPanel } from '../sidebar/TrashPanel'
import { ProductivityViews, type ProductivityMode } from '../tasks/ProductivityViews'
import { Tooltip } from '../ui/Tooltip'
import { AboutModal } from './AboutModal'
import { CommandPalette } from './CommandPalette'
import { DiagnosticsPanel } from './DiagnosticsPanel'
import { ShortcutsHelp } from './ShortcutsHelp'
import { WelcomePanel } from './WelcomePanel'

type MainMode = 'page' | ProductivityMode | 'diagnostics'

export function AppShell() {
  const { theme, toggle } = useTheme()
  const { activePage, loading, showWelcome, openOrCreateDailyNote, setActivePageId } =
    usePagesContext()
  const { collapsed, toggle: toggleSidebar } = useSidebarCollapsed()
  const [aboutOpen, setAboutOpen] = useState(false)
  const [mainMode, setMainMode] = useState<MainMode>('page')
  const tipSide = collapsed ? 'right' : 'bottom'

  const goProductivity = (mode: ProductivityMode) => {
    setMainMode(mode)
  }

  const openPage = (id: string) => {
    setMainMode('page')
    setActivePageId(id)
  }

  const navBtn = (
    label: string,
    icon: typeof Inbox,
    onClick: () => void,
    active = false,
  ) => {
    const Icon = icon
    return (
      <Tooltip content={label} side={tipSide} className={collapsed ? '' : 'w-full'}>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className={`flex items-center gap-2 rounded-md text-sm hover:bg-notion-hover ${
            collapsed ? 'size-9 justify-center' : 'w-full px-2 py-1.5'
          } ${active ? 'bg-notion-active' : 'text-notion-text'}`}
        >
          <Icon className="size-4 shrink-0 opacity-60" />
          {!collapsed && label}
        </button>
      </Tooltip>
    )
  }

  return (
    <div className="flex h-full bg-notion-bg text-notion-text">
      <aside
        className={`flex shrink-0 flex-col border-r border-notion-border bg-notion-sidebar transition-[width] duration-200 ${
          collapsed ? 'w-14' : 'w-60'
        }`}
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-1 px-1 py-2">
            <Tooltip content="Acerca de ANOtaciones" side={tipSide}>
              <button
                type="button"
                onClick={() => setAboutOpen(true)}
                className="flex size-9 items-center justify-center rounded-md hover:bg-notion-hover"
                aria-label="Acerca de ANOtaciones"
              >
                <img src="/logo.png" alt="" className="size-6 rounded object-contain" />
              </button>
            </Tooltip>
            <Tooltip content="Expandir barra lateral" side={tipSide}>
              <button
                type="button"
                onClick={toggleSidebar}
                className="flex size-9 items-center justify-center rounded-md text-notion-text/70 hover:bg-notion-hover"
                aria-label="Expandir barra lateral"
              >
                <PanelLeftOpen className="size-4" />
              </button>
            </Tooltip>
            <Tooltip content="Buscar páginas (Ctrl+K)" side={tipSide}>
              <button
                type="button"
                aria-label="Buscar páginas (Ctrl+K)"
                className="flex size-9 items-center justify-center rounded-md text-notion-text/70 hover:bg-notion-hover"
                onClick={() => window.dispatchEvent(new Event('anotacion:open-search'))}
              >
                <Search className="size-4" />
              </button>
            </Tooltip>
            <ShortcutsHelp tipSide={tipSide} />
            <Tooltip
              content={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              side={tipSide}
            >
              <button
                type="button"
                onClick={toggle}
                aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                className="flex size-9 items-center justify-center rounded-md text-notion-text/70 hover:bg-notion-hover"
              >
                {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 py-3">
            <Tooltip content="Acerca de ANOtaciones" side="bottom">
              <button
                type="button"
                onClick={() => setAboutOpen(true)}
                className="flex min-w-0 items-center gap-2 rounded-md pr-1 hover:bg-notion-hover"
                aria-label="Acerca de ANOtaciones"
              >
                <img src="/logo.png" alt="" className="size-6 shrink-0 rounded object-contain" />
                <span className="truncate text-sm font-semibold tracking-tight">ANOtaciones</span>
              </button>
            </Tooltip>
            <div className="flex items-center gap-0.5">
              <Tooltip content="Buscar páginas (Ctrl+K)">
                <button
                  type="button"
                  aria-label="Buscar páginas (Ctrl+K)"
                  className="rounded-md p-1.5 text-notion-text/70 hover:bg-notion-hover"
                  onClick={() => window.dispatchEvent(new Event('anotacion:open-search'))}
                >
                  <Search className="size-4" />
                </button>
              </Tooltip>
              <ShortcutsHelp />
              <Tooltip content={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                  className="rounded-md p-1.5 text-notion-text/70 hover:bg-notion-hover"
                >
                  {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </button>
              </Tooltip>
              <Tooltip content="Contraer barra lateral">
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="rounded-md p-1.5 text-notion-text/70 hover:bg-notion-hover"
                  aria-label="Contraer barra lateral"
                >
                  <PanelLeftClose className="size-4" />
                </button>
              </Tooltip>
            </div>
          </div>
        )}

        <div className={`space-y-1 pb-2 ${collapsed ? 'flex flex-col items-center px-1' : 'px-2'}`}>
          <NewPageButton collapsed={collapsed} />
          {navBtn('Nota del día', CalendarDays, () => {
            setMainMode('page')
            void openOrCreateDailyNote()
          })}
          {navBtn('Bandeja', Inbox, () => goProductivity('inbox'), mainMode === 'inbox')}
          {navBtn('Tareas', ListTodo, () => goProductivity('tasks'), mainMode === 'tasks')}
          {navBtn('Calendario', CalendarRange, () => goProductivity('calendar'), mainMode === 'calendar')}
          {navBtn(
            'Panel',
            LayoutDashboard,
            () => goProductivity('dashboard'),
            mainMode === 'dashboard',
          )}
          {navBtn(
            'Diagnóstico',
            Stethoscope,
            () => setMainMode('diagnostics'),
            mainMode === 'diagnostics',
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          {loading ? (
            !collapsed && <p className="px-3 text-xs text-notion-text/50">Cargando…</p>
          ) : (
            <div
              onClickCapture={() => {
                if (mainMode !== 'page') setMainMode('page')
              }}
            >
              <PageTree collapsed={collapsed} />
            </div>
          )}
        </div>

        <TrashPanel collapsed={collapsed} />
        <SidebarBackup collapsed={collapsed} />
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto bg-notion-bg">
        {loading ? null : mainMode === 'diagnostics' ? (
          <DiagnosticsPanel />
        ) : mainMode !== 'page' ? (
          <ProductivityViews mode={mainMode} onOpenPage={openPage} />
        ) : showWelcome ? (
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
