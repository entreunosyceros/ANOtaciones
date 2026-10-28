import { Tag as TagIcon, X } from 'lucide-react'
import { useState } from 'react'
import { usePagesContext } from '../../context/PagesContext'
import type { Page } from '../../db/types'

export function PageTags({ page }: { page: Page }) {
  const { tags, createTag, setPageTags } = usePagesContext()
  const [draft, setDraft] = useState('')
  const selected = new Set(page.tagIds ?? [])
  const pageTags = tags.filter((t) => selected.has(t.id))

  const addByName = async () => {
    const name = draft.trim()
    if (!name) return
    const tag = await createTag(name)
    await setPageTags(page.id, [...new Set([...(page.tagIds ?? []), tag.id])])
    setDraft('')
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5">
      <TagIcon className="size-3.5 opacity-40" aria-hidden />
      {pageTags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          title={`Quitar etiqueta «${tag.name}»`}
          className="inline-flex items-center gap-1 rounded-md bg-notion-sidebar px-2 py-0.5 text-xs hover:bg-notion-hover"
          onClick={() =>
            void setPageTags(
              page.id,
              (page.tagIds ?? []).filter((id) => id !== tag.id),
            )
          }
        >
          {tag.name}
          <X className="size-3 opacity-50" />
        </button>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            void addByName()
          }
        }}
        placeholder="Añadir etiqueta…"
        className="min-w-[8rem] bg-transparent text-xs outline-none placeholder:text-notion-text/35"
        aria-label="Añadir etiqueta"
      />
      {tags
        .filter((t) => !selected.has(t.id))
        .slice(0, 6)
        .map((tag) => (
          <button
            key={`suggest-${tag.id}`}
            type="button"
            title={`Añadir «${tag.name}»`}
            className="rounded-md px-1.5 py-0.5 text-[11px] text-notion-text/50 hover:bg-notion-hover hover:text-notion-text"
            onClick={() => void setPageTags(page.id, [...(page.tagIds ?? []), tag.id])}
          >
            + {tag.name}
          </button>
        ))}
    </div>
  )
}
