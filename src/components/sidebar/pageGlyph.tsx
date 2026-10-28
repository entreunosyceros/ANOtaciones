import { Columns3, Database, FileText } from 'lucide-react'
import type { Page, PageKind } from '../../db/types'

export function KindIcon({
  kind,
  className = 'size-4 shrink-0 opacity-50',
}: {
  kind: PageKind
  className?: string
}) {
  if (kind === 'board') return <Columns3 className={className} />
  if (kind === 'database') return <Database className={className} />
  return <FileText className={className} />
}

export function PageGlyph({ page }: { page: Pick<Page, 'icon' | 'kind'> }) {
  if (page.icon) return <span className="text-base leading-none">{page.icon}</span>
  return <KindIcon kind={page.kind} className="size-4 opacity-60" />
}
