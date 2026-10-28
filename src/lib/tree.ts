import type { Page, PageNode } from '../db/types'

export function buildTree(pages: Page[]): PageNode[] {
  const map = new Map<string, PageNode>()
  for (const p of pages) map.set(p.id, { ...p, children: [] })

  const roots: PageNode[] = []
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortRecursive = (nodes: PageNode[]) => {
    nodes.sort((a, b) => a.order - b.order)
    nodes.forEach((n) => sortRecursive(n.children))
  }
  sortRecursive(roots)
  return roots
}

export function collectDescendantIds(pages: Page[], rootId: string): string[] {
  const out: string[] = []
  const walk = (id: string) => {
    out.push(id)
    pages.filter((p) => p.parentId === id).forEach((c) => walk(c.id))
  }
  walk(rootId)
  return out
}
