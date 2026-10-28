import type { JSONContent } from '@tiptap/react'
import type { TipTapDoc } from '../db/types'

/** TipTap JSON → Markdown (subset used by ANOtaciones). */
export function tipTapToMarkdown(doc: TipTapDoc): string {
  const lines: string[] = []
  for (const node of doc.content ?? []) {
    lines.push(...nodeToMd(node, 0))
  }
  return lines.join('\n').trim() + '\n'
}

function nodeToMd(node: JSONContent, depth: number): string[] {
  switch (node.type) {
    case 'heading': {
      const level = Math.min(3, Number(node.attrs?.level ?? 1))
      return [`${'#'.repeat(level)} ${inlineToMd(node.content)}`]
    }
    case 'paragraph':
      return [inlineToMd(node.content)]
    case 'bulletList':
      return (node.content ?? []).flatMap((li) => listItemMd(li, '-', depth))
    case 'orderedList':
      return (node.content ?? []).flatMap((li, i) => listItemMd(li, `${i + 1}.`, depth))
    case 'taskList':
      return (node.content ?? []).flatMap((li) => {
        const checked = li.attrs?.checked ? 'x' : ' '
        const text = inlineToMd(li.content?.[0]?.content)
        return [`${'  '.repeat(depth)}- [${checked}] ${text}`]
      })
    case 'blockquote':
      return (node.content ?? []).flatMap((c) => nodeToMd(c, depth).map((l) => `> ${l}`))
    case 'codeBlock':
      return ['```', inlineToMd(node.content), '```']
    case 'horizontalRule':
      return ['---']
    case 'image':
      return [`![${node.attrs?.alt ?? ''}](${node.attrs?.src ?? ''})`]
    case 'callout':
      return [`> **Nota:** ${inlineToMd(node.content?.[0]?.content)}`]
    default:
      return node.content ? node.content.flatMap((c) => nodeToMd(c, depth)) : []
  }
}

function listItemMd(li: JSONContent, bullet: string, depth: number): string[] {
  const first = li.content?.[0]
  const text = first ? inlineToMd(first.content) : ''
  const rest = (li.content ?? []).slice(1).flatMap((c) => nodeToMd(c, depth + 1))
  return [`${'  '.repeat(depth)}${bullet} ${text}`, ...rest]
}

function inlineToMd(content?: JSONContent[] | null): string {
  if (!content) return ''
  return content
    .map((n) => {
      if (n.type === 'text') {
        let t = n.text ?? ''
        const marks = n.marks ?? []
        for (const m of marks) {
          if (m.type === 'bold') t = `**${t}**`
          if (m.type === 'italic') t = `*${t}*`
          if (m.type === 'code') t = `\`${t}\``
          if (m.type === 'strike') t = `~~${t}~~`
          if (m.type === 'link') t = `[${t}](${m.attrs?.href ?? ''})`
        }
        return t
      }
      if (n.type === 'pageLink') {
        return `[[${n.attrs?.title || n.attrs?.pageId || 'página'}]]`
      }
      if (n.type === 'hardBreak') return '\n'
      return inlineToMd(n.content)
    })
    .join('')
}

/** Markdown → TipTap JSON (best-effort subset). */
export function markdownToTipTap(md: string): TipTapDoc {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const content: JSONContent[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]!
    if (!line.trim()) {
      i++
      continue
    }
    if (line.startsWith('```')) {
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i]!.startsWith('```')) {
        code.push(lines[i]!)
        i++
      }
      i++
      content.push({ type: 'codeBlock', content: [{ type: 'text', text: code.join('\n') }] })
      continue
    }
    if (/^---+$/.test(line.trim())) {
      content.push({ type: 'horizontalRule' })
      i++
      continue
    }
    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    if (heading) {
      content.push({
        type: 'heading',
        attrs: { level: heading[1]!.length },
        content: parseInline(heading[2]!),
      })
      i++
      continue
    }
    const task = line.match(/^-\s+\[([ xX])\]\s+(.*)$/)
    if (task) {
      content.push({
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: task[1]!.toLowerCase() === 'x' },
            content: [{ type: 'paragraph', content: parseInline(task[2]!) }],
          },
        ],
      })
      i++
      continue
    }
    if (line.startsWith('> ')) {
      content.push({
        type: 'blockquote',
        content: [{ type: 'paragraph', content: parseInline(line.slice(2)) }],
      })
      i++
      continue
    }
    const img = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/)
    if (img) {
      content.push({ type: 'image', attrs: { src: img[2], alt: img[1] } })
      i++
      continue
    }
    content.push({ type: 'paragraph', content: parseInline(line) })
    i++
  }
  if (!content.length) content.push({ type: 'paragraph' })
  return { type: 'doc', content }
}

function parseInline(text: string): JSONContent[] {
  const nodes: JSONContent[] = []
  const re = /\[\[([^\]]+)\]\]|\*\*([^*]+)\*\*|\*([^*]+)\*|\`([^`]+)\`|\[([^\]]+)\]\(([^)]+)\)|([^[*`\[]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m[1]) nodes.push({ type: 'pageLink', attrs: { pageId: null, title: m[1] } })
    else if (m[2]) nodes.push({ type: 'text', text: m[2], marks: [{ type: 'bold' }] })
    else if (m[3]) nodes.push({ type: 'text', text: m[3], marks: [{ type: 'italic' }] })
    else if (m[4]) nodes.push({ type: 'text', text: m[4], marks: [{ type: 'code' }] })
    else if (m[5] && m[6])
      nodes.push({ type: 'text', text: m[5], marks: [{ type: 'link', attrs: { href: m[6] } }] })
    else if (m[7]) nodes.push({ type: 'text', text: m[7] })
  }
  return nodes.length ? nodes : [{ type: 'text', text }]
}

export function pageToMarkdownFile(title: string, content: TipTapDoc, id: string): string {
  const front = `---\nid: ${id}\ntitle: ${JSON.stringify(title)}\n---\n\n`
  return front + tipTapToMarkdown(content)
}
