import type { JSONContent } from '@tiptap/react'
import type { TipTapDoc } from '../db/types'

/** Collect unique pageLink target ids from TipTap JSON. */
export function collectPageLinkIds(content: TipTapDoc | JSONContent | null | undefined): string[] {
  const ids = new Set<string>()
  walk(content, (node) => {
    if (node.type === 'pageLink' && typeof node.attrs?.pageId === 'string' && node.attrs.pageId) {
      ids.add(node.attrs.pageId)
    }
  })
  return [...ids]
}

/** Broken links: pageLink targets not present in knownIds. */
export function findBrokenPageLinks(
  content: TipTapDoc | JSONContent | null | undefined,
  knownIds: Set<string>,
): string[] {
  return collectPageLinkIds(content).filter((id) => !knownIds.has(id))
}

/** Rewrite stored title attrs for links pointing at targetPageId. Returns new doc if changed. */
export function rewritePageLinkTitles(
  content: TipTapDoc,
  targetPageId: string,
  newTitle: string,
): TipTapDoc {
  let changed = false
  const next = mapNodes(content, (node) => {
    if (
      node.type === 'pageLink' &&
      node.attrs?.pageId === targetPageId &&
      node.attrs.title !== newTitle
    ) {
      changed = true
      return {
        ...node,
        attrs: { ...node.attrs, title: newTitle },
      }
    }
    return node
  })
  return changed ? next : content
}

/** Flatten TipTap doc to searchable plain text. */
export function plainTextFromContent(content: TipTapDoc | JSONContent | null | undefined): string {
  const parts: string[] = []
  walk(content, (node) => {
    if (typeof node.text === 'string') parts.push(node.text)
    if (node.type === 'pageLink' && typeof node.attrs?.title === 'string') {
      parts.push(node.attrs.title)
    }
  })
  return parts.join(' ')
}

function walk(
  node: JSONContent | null | undefined,
  visit: (n: JSONContent) => void,
): void {
  if (!node || typeof node !== 'object') return
  visit(node)
  if (Array.isArray(node.content)) {
    for (const child of node.content) walk(child, visit)
  }
}

function mapNodes(node: JSONContent, map: (n: JSONContent) => JSONContent): JSONContent {
  const mapped = map(node)
  if (!Array.isArray(mapped.content)) return mapped
  return {
    ...mapped,
    content: mapped.content.map((child) => mapNodes(child, map)),
  }
}
