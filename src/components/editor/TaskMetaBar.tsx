import { usePagesContext } from '../../context/PagesContext'
import type { Page, TaskPriority } from '../../db/types'
import {
  BOARD_STATUSES,
} from '../../db/types'
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  getDue,
  getPriority,
  getStatus,
  isInbox,
} from '../../lib/taskProps'

export function TaskMetaBar({ page }: { page: Page }) {
  const { patchPage } = usePagesContext()
  if (page.kind !== 'doc') return null

  const setProp = (key: string, value: string | boolean | null) => {
    void patchPage(page.id, {
      properties: {
        ...page.properties,
        [key]: value,
      },
    })
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-notion-text/70">
      <label className="flex items-center gap-1">
        Vence
        <input
          type="date"
          value={getDue(page) ?? ''}
          onChange={(e) => setProp('due', e.target.value || null)}
          className="rounded border border-notion-border bg-transparent px-1 py-0.5"
        />
      </label>
      <label className="flex items-center gap-1">
        Prioridad
        <select
          value={getPriority(page) ?? ''}
          onChange={(e) => setProp('priority', (e.target.value || null) as TaskPriority | null)}
          className="rounded border border-notion-border bg-transparent px-1 py-0.5"
        >
          <option value="">—</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {TASK_PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1">
        Estado
        <select
          value={getStatus(page) ?? ''}
          onChange={(e) => setProp('status', e.target.value || null)}
          className="rounded border border-notion-border bg-transparent px-1 py-0.5"
        >
          <option value="">—</option>
          {BOARD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={isInbox(page)}
          onChange={(e) => setProp('inbox', e.target.checked)}
        />
        Bandeja
      </label>
    </div>
  )
}
