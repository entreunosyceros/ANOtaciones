import CodeBlock from '@tiptap/extension-code-block'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { FileText, Star } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { usePagesContext } from '../../context/PagesContext'
import { DEFAULT_TITLE } from '../../lib/constants'
import type { Page } from '../../db/types'
import { useAutosave } from '../../hooks/useAutosave'
import { Breadcrumbs } from '../layout/Breadcrumbs'
import { PageIconButton } from '../ui/EmojiPicker'
import { EditorBubbleMenu } from './EditorBubbleMenu'
import { ImageLightbox } from './ImageLightbox'
import { Callout } from './extensions/Callout'
import { PageLink } from './extensions/PageLink'
import { SlashCommand } from './slash/SlashCommand'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function BlockEditor({ page }: { page: Page }) {
  const { pages, renamePage, setActivePageId, toggleFavorite, patchPage } = usePagesContext()
  const { schedule, flush } = useAutosave(page.id)
  const titleRef = useRef(page.title)
  const pagesRef = useRef(pages)
  const editorRef = useRef<Editor | null>(null)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  pagesRef.current = pages

  useEffect(() => {
    titleRef.current = page.title
  }, [page.title])

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          codeBlock: false,
          link: false,
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { class: 'editor-link' },
        }),
        Image.configure({
          allowBase64: true,
          HTMLAttributes: { class: 'editor-image' },
        }),
        CodeBlock,
        TaskList,
        TaskItem.configure({ nested: true }),
        Placeholder.configure({ placeholder: 'Escribe algo… Escribe / para bloques' }),
        Callout,
        PageLink.configure({
          resolvePageId: (title) => {
            const match = pagesRef.current.find(
              (p) => p.title.toLowerCase() === title.toLowerCase(),
            )
            return match?.id ?? null
          },
          onNavigate: (pageId) => setActivePageId(pageId),
        }),
        SlashCommand,
      ],
      content: page.content,
      editorProps: {
        attributes: {
          class: 'prose-notion max-w-none min-h-[50vh] outline-none focus:outline-none',
        },
        handlePaste: (_view, event) => {
          const items = event.clipboardData?.items
          if (!items) return false
          for (const item of items) {
            if (item.type.startsWith('image/')) {
              const file = item.getAsFile()
              if (!file) continue
              event.preventDefault()
              void readFileAsDataUrl(file).then((src) => {
                editorRef.current?.chain().focus().setImage({ src }).run()
              })
              return true
            }
          }
          return false
        },
        handleDrop: (_view, event) => {
          const files = event.dataTransfer?.files
          if (!files?.length) return false
          const file = files[0]
          if (!file.type.startsWith('image/')) return false
          event.preventDefault()
          void readFileAsDataUrl(file).then((src) => {
            editorRef.current?.chain().focus().setImage({ src }).run()
          })
          return true
        },
      },
      onUpdate: ({ editor: ed }) => {
        schedule(ed.getJSON())
      },
    },
    [page.id],
  )

  editorRef.current = editor

  useEffect(() => {
    return () => {
      flush()
    }
  }, [page.id, flush])

  return (
    <div className="mx-auto w-full max-w-[720px] px-12 pb-32 pt-10">
      <Breadcrumbs pageId={page.id} />
      <div className="mb-2 flex items-start gap-2">
        <PageIconButton
          icon={page.icon}
          fallback={<FileText className="size-6 opacity-40" />}
          onChange={(emoji) => void patchPage(page.id, { icon: emoji })}
        />
        <input
          key={`title-${page.id}`}
          defaultValue={page.title}
          aria-label="Título de la página"
          placeholder={DEFAULT_TITLE}
          className="min-w-0 flex-1 border-none bg-transparent text-[40px] font-bold leading-tight text-notion-text outline-none placeholder:text-notion-text/25"
          onChange={(e) => {
            titleRef.current = e.target.value
            void renamePage(page.id, e.target.value || DEFAULT_TITLE)
          }}
        />
        <button
          type="button"
          aria-label={page.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          className="mt-3 rounded-md p-1.5 text-notion-text/50 hover:bg-notion-hover hover:text-notion-text"
          onClick={() => void toggleFavorite(page.id)}
        >
          <Star
            className={`size-5 ${page.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`}
          />
        </button>
      </div>
      {editor && <EditorBubbleMenu editor={editor} />}
      <div
        onDoubleClick={(e) => {
          const target = e.target
          if (!(target instanceof HTMLImageElement)) return
          if (!target.closest('.ProseMirror')) return
          e.preventDefault()
          setLightboxSrc(target.currentSrc || target.src)
        }}
      >
        <EditorContent editor={editor} />
      </div>
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  )
}
