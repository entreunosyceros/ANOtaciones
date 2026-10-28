import { useMemo } from 'react'
import { usePagesContext } from '../../context/PagesContext'
import { runDiagnostics } from '../../lib/diagnostics'

export function DiagnosticsPanel() {
  const { allPages, tags, attachments, repairOrphans } = usePagesContext()
  const report = useMemo(() => runDiagnostics(allPages, tags), [allPages, tags])

  return (
    <div className="mx-auto w-full max-w-2xl px-8 py-10">
      <h1 className="mb-4 text-2xl font-bold">Diagnóstico</h1>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Item label="Páginas vivas" value={report.livePages} />
        <Item label="Papelera" value={report.trashPages} />
        <Item label="Plantillas" value={report.templates} />
        <Item label="Etiquetas" value={report.tags} />
        <Item label="Adjuntos" value={attachments.length} />
        <Item label="Tamaño JSON ~" value={`${Math.round(report.estimatedJsonBytes / 1024)} KB`} />
        <Item label="Padres huérfanos" value={report.orphanParentIds.length} />
        <Item label="Enlaces rotos" value={report.brokenLinks.length} />
      </dl>
      {report.orphanParentIds.length > 0 && (
        <button
          type="button"
          className="mt-4 rounded-md border border-notion-border px-3 py-1.5 text-sm hover:bg-notion-hover"
          onClick={() =>
            void repairOrphans().then((n) => window.alert(`Reparados: ${n}`))
          }
        >
          Reparar padres huérfanos
        </button>
      )}
      {report.brokenLinks.length > 0 && (
        <ul className="mt-4 max-h-40 overflow-y-auto text-xs text-notion-text/60">
          {report.brokenLinks.slice(0, 50).map((l) => (
            <li key={`${l.fromPageId}-${l.targetId}`}>
              {l.fromPageId.slice(0, 8)}… → {l.targetId.slice(0, 8)}…
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Item({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-notion-border px-3 py-2">
      <dt className="text-[11px] text-notion-text/45">{label}</dt>
      <dd className="text-base font-semibold">{value}</dd>
    </div>
  )
}
