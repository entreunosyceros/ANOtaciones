import type { TipTapDoc } from '../db/types'

export function isEmptyDoc(content: TipTapDoc | undefined | null): boolean {
  if (!content || !Array.isArray(content.content) || content.content.length === 0) return true
  if (content.content.length > 1) return false
  const first = content.content[0] as TipTapDoc
  if (first.type !== 'paragraph') return false
  const inner = first.content
  if (!inner || inner.length === 0) return true
  return inner.every((node) => {
    if (node.type === 'text') return !String(node.text ?? '').trim()
    return false
  })
}
