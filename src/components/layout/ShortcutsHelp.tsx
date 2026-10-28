import { Keyboard } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Tooltip } from '../ui/Tooltip'

const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

function mod(key: string) {
  return `${isMac ? '⌘' : 'Ctrl'}+${key}`
}

const SECTIONS: { title: string; shortcuts: { keys: string; desc: string }[] }[] = [
  {
    title: 'General',
    shortcuts: [
      { keys: mod('K'), desc: 'Buscar y abrir páginas' },
      { keys: '?', desc: 'Mostrar este menú de atajos' },
      { keys: 'Esc', desc: 'Cerrar menús o paneles' },
    ],
  },
  {
    title: 'Editor — formato',
    shortcuts: [
      { keys: mod('B'), desc: 'Negrita' },
      { keys: mod('I'), desc: 'Cursiva' },
      { keys: mod('U'), desc: 'Subrayado' },
      { keys: mod('Shift+S'), desc: 'Tachado' },
      { keys: mod('E'), desc: 'Código en línea' },
      { keys: 'Seleccionar texto', desc: 'Barra flotante de formato' },
    ],
  },
  {
    title: 'Editor — bloques',
    shortcuts: [
      { keys: '/', desc: 'Menú de bloques (títulos, listas, callout…)' },
      { keys: '# + espacio', desc: 'Título 1' },
      { keys: '## + espacio', desc: 'Título 2' },
      { keys: '### + espacio', desc: 'Título 3' },
      { keys: '- + espacio', desc: 'Lista con viñetas' },
      { keys: '1. + espacio', desc: 'Lista numerada' },
      { keys: '[] + espacio', desc: 'Lista de tareas' },
      { keys: '> + espacio', desc: 'Cita' },
      { keys: '```', desc: 'Bloque de código' },
      { keys: '--- / Separador', desc: 'Línea divisoria (menú /)' },
      { keys: '/ Imagen', desc: 'Insertar imagen por URL' },
      { keys: 'Pegar / soltar', desc: 'Insertar imagen desde el portapapeles' },
      { keys: 'Doble clic', desc: 'Imagen a pantalla completa' },
      { keys: '[[Título]]', desc: 'Enlace a otra página (título exacto)' },
    ],
  },
]

export function ShortcutsHelp({ tipSide = 'bottom' }: { tipSide?: 'top' | 'bottom' | 'left' | 'right' }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const openHelp = () => setOpen(true)
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)

      if (e.key === 'Escape') {
        setOpen(false)
        return
      }

      // ? without modifiers, and not while typing in fields
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey && !typing) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('anotacion:open-shortcuts', openHelp)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('anotacion:open-shortcuts', openHelp)
    }
  }, [])

  return (
    <>
      <Tooltip content="Ver atajos de teclado (?)" side={tipSide}>
        <button
          type="button"
          aria-label="Ver atajos de teclado (?)"
          className="flex size-9 items-center justify-center rounded-md p-1.5 text-notion-text/70 hover:bg-notion-hover"
          onClick={() => setOpen(true)}
        >
          <Keyboard className="size-4" />
        </button>
      </Tooltip>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-[10vh]"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border border-notion-border bg-notion-bg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-notion-border bg-notion-bg px-4 py-3">
              <h2 id="shortcuts-title" className="text-sm font-semibold">
                Atajos de teclado
              </h2>
              <button
                type="button"
                className="rounded px-2 py-1 text-xs text-notion-text/60 hover:bg-notion-hover"
                onClick={() => setOpen(false)}
              >
                Esc
              </button>
            </div>

            <div className="space-y-5 px-4 py-4">
              {SECTIONS.map((section) => (
                <section key={section.title}>
                  <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-notion-text/40">
                    {section.title}
                  </h3>
                  <ul className="space-y-1.5">
                    {section.shortcuts.map((row) => (
                      <li
                        key={row.keys + row.desc}
                        className="flex items-center justify-between gap-4 text-sm"
                      >
                        <span className="text-notion-text/80">{row.desc}</span>
                        <kbd className="shrink-0 rounded border border-notion-border bg-notion-sidebar px-1.5 py-0.5 font-mono text-[11px] text-notion-text/70">
                          {row.keys}
                        </kbd>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
