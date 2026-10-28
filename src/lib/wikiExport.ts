import type { Page } from '../db/types'
import { isLivePage } from '../db/types'
import { pageToMarkdownFile } from './markdown'

/** Build a simple multi-file wiki export as a single downloadable text bundle (manifest + md). */
export function buildWikiExportBundle(pages: Page[]): string {
  const live = pages.filter((p) => isLivePage(p) && !p.isTemplate)
  const manifest = {
    version: 1,
    exportedAt: Date.now(),
    pages: live.map((p) => ({
      id: p.id,
      title: p.title,
      parentId: p.parentId,
      kind: p.kind,
      path: `${slug(p.title)}-${p.id.slice(0, 8)}.md`,
    })),
  }
  const parts = [`# ANOtaciones wiki export\n\n## manifest.json\n\n\`\`\`json\n${JSON.stringify(manifest, null, 2)}\n\`\`\`\n`]
  for (const p of live) {
    const file = pageToMarkdownFile(p.title, p.content, p.id)
    parts.push(`\n---\n\n## ${manifest.pages.find((x) => x.id === p.id)?.path}\n\n${file}`)
  }
  return parts.join('')
}

export function downloadWikiExport(pages: Page[], filename = 'anotaciones-wiki.md') {
  const blob = new Blob([buildWikiExportBundle(pages)], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\wáéíóúñ]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'page'
}
