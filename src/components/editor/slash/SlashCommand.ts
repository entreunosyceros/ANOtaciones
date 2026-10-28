import { Extension } from '@tiptap/react'
import Suggestion from '@tiptap/suggestion'
import { createSlashSuggestion } from './suggestion'

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...createSlashSuggestion(),
      }),
    ]
  },
})
