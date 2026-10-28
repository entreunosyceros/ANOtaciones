import { InputRule, mergeAttributes, Node } from '@tiptap/react'

export interface PageLinkOptions {
  resolvePageId: (title: string) => string | null
  /** Live title + existence for render / broken state */
  getPageMeta: (pageId: string) => { title: string; exists: boolean } | null
  onNavigate: (pageId: string) => void
}

declare module '@tiptap/react' {
  interface Commands<ReturnType> {
    pageLink: {
      insertPageLink: (attrs: { pageId: string; title: string }) => ReturnType
    }
  }
}

export const PageLink = Node.create<PageLinkOptions>({
  name: 'pageLink',
  group: 'inline',
  inline: true,
  atom: true,

  addOptions() {
    return {
      resolvePageId: () => null,
      getPageMeta: () => null,
      onNavigate: () => undefined,
    }
  },

  addAttributes() {
    return {
      pageId: { default: null },
      title: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="page-link"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'page-link',
        class: 'page-link',
        contenteditable: 'false',
      }),
      HTMLAttributes.title || 'página',
    ]
  },

  addCommands() {
    return {
      insertPageLink:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs,
          }),
    }
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\[\[([^\]]+)\]\]$/,
        handler: ({ range, match, chain }) => {
          const title = match[1]?.trim()
          if (!title) return
          const pageId = this.options.resolvePageId(title)
          if (!pageId) return
          chain().deleteRange(range).insertContent({
            type: this.name,
            attrs: { pageId, title },
          }).run()
        },
      }),
    ]
  },

  addNodeView() {
    return ({ node, editor }) => {
      const dom = document.createElement('span')
      dom.dataset.type = 'page-link'
      dom.contentEditable = 'false'

      const paint = (pageId: string | null, fallbackTitle: string) => {
        const meta = pageId ? this.options.getPageMeta(pageId) : null
        const exists = meta?.exists ?? false
        const label = meta?.title || fallbackTitle || 'página'
        dom.className = exists ? 'page-link' : 'page-link page-link--broken'
        dom.textContent = exists ? label : `${label} (roto)`
        dom.title = exists ? `Ir a «${label}»` : 'Enlace a página inexistente'
      }

      paint(node.attrs.pageId, node.attrs.title || '')

      dom.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const pageId = node.attrs.pageId as string | null
        if (!pageId) return
        const meta = this.options.getPageMeta(pageId)
        if (!meta?.exists) return
        this.options.onNavigate(pageId)
        editor.commands.blur()
      })

      return {
        dom,
        update: (updated) => {
          if (updated.type !== node.type) return false
          paint(updated.attrs.pageId, updated.attrs.title || '')
          return true
        },
      }
    }
  },
})
