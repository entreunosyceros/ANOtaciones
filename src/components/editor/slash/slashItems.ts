import type { Editor } from '@tiptap/react'

export interface SlashItem {
  title: string
  description: string
  command: (editor: Editor) => void
}

export const slashItems: SlashItem[] = [
  {
    title: 'Texto',
    description: 'Párrafo normal',
    command: (editor) => editor.chain().focus().clearNodes().setParagraph().run(),
  },
  {
    title: 'Título 1',
    description: 'Encabezado grande',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Título 2',
    description: 'Encabezado mediano',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Título 3',
    description: 'Encabezado pequeño',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Lista',
    description: 'Lista con viñetas',
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Lista numerada',
    description: 'Lista ordenada',
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: 'Tareas',
    description: 'Lista de tareas',
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: 'Código',
    description: 'Bloque de código',
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: 'Cita',
    description: 'Cita en bloque',
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Nota destacada',
    description: 'Bloque de aviso resaltado',
    command: (editor) =>
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'callout',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nota…' }] }],
        })
        .run(),
  },
  {
    title: 'Separador',
    description: 'Línea divisoria',
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: 'Imagen',
    description: 'Insertar por URL',
    command: (editor) => {
      const url = window.prompt('URL de la imagen')
      if (!url?.trim()) return
      editor.chain().focus().setImage({ src: url.trim() }).run()
    },
  },
  {
    title: 'Enlace a página',
    description: 'Insertar enlace interno por título',
    command: (editor) => {
      const title = window.prompt('Título de la página a enlazar')?.trim()
      if (!title) return
      const ext = editor.extensionManager.extensions.find((e) => e.name === 'pageLink')
      const resolve = (
        ext?.options as { resolvePageId?: (t: string) => string | null } | undefined
      )?.resolvePageId
      const pageId = resolve?.(title) ?? null
      if (!pageId) {
        window.alert('No hay ninguna página con ese título exacto.')
        return
      }
      editor.chain().focus().insertPageLink({ pageId, title }).run()
    },
  },
]
