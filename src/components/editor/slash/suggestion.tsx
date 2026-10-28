import { ReactRenderer } from '@tiptap/react'
import type { SuggestionOptions } from '@tiptap/suggestion'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import { slashItems, type SlashItem } from './slashItems'
import { SlashList, type SlashListRef } from './SlashList'

export function createSlashSuggestion(): Omit<SuggestionOptions<SlashItem>, 'editor'> {
  return {
    char: '/',
    allowSpaces: false,
    startOfLine: false,
    items: ({ query }) => {
      const q = query.toLowerCase()
      return slashItems.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q),
      )
    },
    command: ({ editor, range, props }) => {
      editor.chain().focus().deleteRange(range).run()
      props.command(editor)
    },
    render: () => {
      let component: ReactRenderer<SlashListRef> | null = null
      let popup: TippyInstance[] | null = null

      return {
        onStart: (props) => {
          component = new ReactRenderer(SlashList, {
            props: {
              items: props.items,
              command: (item: SlashItem) => props.command(item),
            },
            editor: props.editor,
          })

          if (!props.clientRect) return

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          })
        },
        onUpdate: (props) => {
          component?.updateProps({
            items: props.items,
            command: (item: SlashItem) => props.command(item),
          })
          popup?.[0]?.setProps({
            getReferenceClientRect: props.clientRect as () => DOMRect,
          })
        },
        onKeyDown: (props) => {
          if (props.event.key === 'Escape') {
            popup?.[0]?.hide()
            return true
          }
          return component?.ref?.onKeyDown(props) ?? false
        },
        onExit: () => {
          popup?.[0]?.destroy()
          component?.destroy()
        },
      }
    },
  }
}
