import { InputRule, mergeAttributes, Node } from '@tiptap/react'

export interface PageLinkOptions {
  resolvePageId: (title: string) => string | null
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
      dom.className = 'page-link'
      dom.dataset.type = 'page-link'
      dom.textContent = node.attrs.title || 'página'
      dom.contentEditable = 'false'
      dom.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (node.attrs.pageId) {
          this.options.onNavigate(node.attrs.pageId)
          editor.commands.blur()
        }
      })
      return {
        dom,
        update: (updated) => {
          if (updated.type !== node.type) return false
          dom.textContent = updated.attrs.title || 'página'
          return true
        },
      }
    }
  },
})
