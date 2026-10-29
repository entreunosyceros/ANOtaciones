import {
  Check,
  Copy,
  ExternalLink,
  Folder,
  FolderPlus,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { usePagesContext } from '../../context/PagesContext'
import { isValidBookmarkUrl } from '../../db'
import type { Bookmark } from '../../db/types'
import { Tooltip } from '../ui/Tooltip'

type FolderFilter = 'all' | 'none' | string

export function BookmarksView() {
  const {
    bookmarks,
    bookmarkFolders,
    bookmarkTags,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    createBookmarkFolder,
    updateBookmarkFolder,
    deleteBookmarkFolder,
    createBookmarkTag,
    renameBookmarkTag,
    deleteBookmarkTag,
  } = usePagesContext()

  const [folderFilter, setFolderFilter] = useState<FolderFilter>('all')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Bookmark | null>(null)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [formFolderId, setFormFolderId] = useState<string | null>(null)
  const [formTagIds, setFormTagIds] = useState<string[]>([])
  const [newFolderName, setNewFolderName] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const rootFolders = useMemo(
    () => bookmarkFolders.filter((f) => f.parentId == null),
    [bookmarkFolders],
  )

  const childFolders = (parentId: string) =>
    bookmarkFolders.filter((f) => f.parentId === parentId)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bookmarks.filter((b) => {
      if (folderFilter === 'none' && b.folderId != null) return false
      if (folderFilter !== 'all' && folderFilter !== 'none' && b.folderId !== folderFilter) {
        return false
      }
      if (tagFilter && !(b.tagIds ?? []).includes(tagFilter)) return false
      if (!q) return true
      return (
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        (b.notes ?? '').toLowerCase().includes(q)
      )
    })
  }, [bookmarks, folderFilter, tagFilter, query])

  const openForm = (bm?: Bookmark) => {
    setFormError(null)
    if (bm) {
      setEditing(bm)
      setCreating(false)
      setTitle(bm.title)
      setUrl(bm.url)
      setNotes(bm.notes ?? '')
      setFormFolderId(bm.folderId)
      setFormTagIds([...(bm.tagIds ?? [])])
    } else {
      setEditing(null)
      setCreating(true)
      setTitle('')
      setUrl('')
      setNotes('')
      setFormFolderId(folderFilter !== 'all' && folderFilter !== 'none' ? folderFilter : null)
      setFormTagIds(tagFilter ? [tagFilter] : [])
    }
  }

  const closeForm = () => {
    setEditing(null)
    setCreating(false)
    setFormError(null)
  }

  const saveForm = async () => {
    setFormError(null)
    if (!isValidBookmarkUrl(url)) {
      setFormError('URL inválida: usa http:// o https://')
      return
    }
    try {
      if (editing) {
        await updateBookmark(editing.id, {
          title: title.trim() || url.trim(),
          url: url.trim(),
          notes,
          folderId: formFolderId,
          tagIds: formTagIds,
        })
      } else {
        await createBookmark({
          title: title.trim() || url.trim(),
          url: url.trim(),
          notes,
          folderId: formFolderId,
          tagIds: formTagIds,
        })
      }
      closeForm()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'No se pudo guardar')
    }
  }

  const toggleFormTag = (id: string) => {
    setFormTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  const copyUrl = async (bm: Bookmark) => {
    try {
      await navigator.clipboard.writeText(bm.url)
      setCopiedId(bm.id)
      window.setTimeout(() => setCopiedId((cur) => (cur === bm.id ? null : cur)), 1500)
    } catch {
      window.alert('No se pudo copiar la URL')
    }
  }

  const folderName = (id: string | null) => {
    if (!id) return 'Sin carpeta'
    return bookmarkFolders.find((f) => f.id === id)?.name ?? 'Carpeta'
  }

  const renderFolderBtn = (id: FolderFilter, label: string, depth = 0) => (
    <button
      key={String(id)}
      type="button"
      onClick={() => setFolderFilter(id)}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-notion-hover ${
        folderFilter === id ? 'bg-notion-active' : ''
      }`}
      style={{ paddingLeft: 8 + depth * 12 }}
    >
      <Folder className="size-3.5 shrink-0 opacity-50" />
      <span className="truncate">{label}</span>
    </button>
  )

  const showForm = creating || editing != null

  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-56 shrink-0 flex-col border-r border-notion-border bg-notion-sidebar">
        <div className="border-b border-notion-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-notion-text/50">
            Carpetas
          </h2>
        </div>
        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
          {renderFolderBtn('all', 'Todas')}
          {renderFolderBtn('none', 'Sin carpeta')}
          {rootFolders.map((f) => (
            <div key={f.id}>
              {renderFolderBtn(f.id, f.name, 0)}
              {childFolders(f.id).map((c) => renderFolderBtn(c.id, c.name, 1))}
            </div>
          ))}
        </div>
        <div className="space-y-2 border-t border-notion-border p-2">
          <form
            className="flex gap-1"
            onSubmit={(e) => {
              e.preventDefault()
              if (!newFolderName.trim()) return
              void createBookmarkFolder({
                name: newFolderName.trim(),
                parentId:
                  folderFilter !== 'all' && folderFilter !== 'none' ? folderFilter : null,
              }).then(() => setNewFolderName(''))
            }}
          >
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nueva carpeta…"
              className="min-w-0 flex-1 rounded-md border border-notion-border bg-transparent px-2 py-1 text-xs outline-none"
              aria-label="Nombre de carpeta"
            />
            <Tooltip content="Crear carpeta">
              <button
                type="submit"
                className="rounded-md p-1.5 text-notion-text/70 hover:bg-notion-hover"
                aria-label="Crear carpeta"
              >
                <FolderPlus className="size-4" />
              </button>
            </Tooltip>
          </form>
          {folderFilter !== 'all' && folderFilter !== 'none' && (
            <div className="flex gap-1">
              <Tooltip content="Renombrar carpeta">
                <button
                  type="button"
                  className="rounded-md p-1.5 text-notion-text/70 hover:bg-notion-hover"
                  aria-label="Renombrar carpeta"
                  onClick={() => {
                    const cur = bookmarkFolders.find((f) => f.id === folderFilter)
                    const name = window.prompt('Nombre de la carpeta', cur?.name ?? '')
                    if (name == null || !name.trim()) return
                    void updateBookmarkFolder(folderFilter, { name: name.trim() })
                  }}
                >
                  <Pencil className="size-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Eliminar carpeta (los enlaces quedan sin carpeta)">
                <button
                  type="button"
                  className="rounded-md p-1.5 text-red-600/80 hover:bg-notion-hover"
                  aria-label="Eliminar carpeta"
                  onClick={() => {
                    if (!window.confirm('¿Eliminar esta carpeta? Los enlaces pasarán a «Sin carpeta».')) {
                      return
                    }
                    void deleteBookmarkFolder(folderFilter).then(() => setFolderFilter('all'))
                  }}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-6 py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Favoritos web</h1>
              <p className="mt-1 text-sm text-notion-text/55">
                URLs catalogadas por carpetas y etiquetas
              </p>
            </div>
            <Tooltip content="Añadir URL favorita">
              <button
                type="button"
                onClick={() => openForm()}
                className="inline-flex items-center gap-1.5 rounded-md border border-notion-border px-3 py-2 text-sm hover:bg-notion-hover"
              >
                <Plus className="size-4" />
                Nueva URL
              </button>
            </Tooltip>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar título o URL…"
              className="min-w-[12rem] flex-1 rounded-md border border-notion-border bg-transparent px-3 py-2 text-sm outline-none"
              aria-label="Buscar favoritos"
            />
            <select
              value={tagFilter ?? ''}
              onChange={(e) => setTagFilter(e.target.value || null)}
              className="rounded-md border border-notion-border bg-transparent px-2 py-2 text-sm outline-none"
              aria-label="Filtrar por etiqueta"
            >
              <option value="">Todas las etiquetas</option>
              {bookmarkTags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6 rounded-lg border border-notion-border p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-notion-text/50">
              <Tag className="size-3.5" />
              Etiquetas
            </div>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {bookmarkTags.length === 0 && (
                <span className="text-xs text-notion-text/45">Sin etiquetas aún</span>
              )}
              {bookmarkTags.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 rounded-md bg-notion-sidebar px-2 py-0.5 text-xs"
                >
                  <button
                    type="button"
                    className="hover:underline"
                    onClick={() => setTagFilter(t.id)}
                  >
                    {t.name}
                  </button>
                  <button
                    type="button"
                    className="opacity-50 hover:opacity-100"
                    title="Renombrar"
                    aria-label={`Renombrar ${t.name}`}
                    onClick={() => {
                      const name = window.prompt('Nombre de la etiqueta', t.name)
                      if (name == null || !name.trim()) return
                      void renameBookmarkTag(t.id, name.trim())
                    }}
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    type="button"
                    className="opacity-50 hover:opacity-100"
                    title="Eliminar etiqueta"
                    aria-label={`Eliminar ${t.name}`}
                    onClick={() => {
                      if (!window.confirm(`¿Eliminar la etiqueta «${t.name}»?`)) return
                      void deleteBookmarkTag(t.id).then(() => {
                        if (tagFilter === t.id) setTagFilter(null)
                      })
                    }}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (!newTagName.trim()) return
                void createBookmarkTag(newTagName.trim()).then(() => setNewTagName(''))
              }}
            >
              <input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Nueva etiqueta…"
                className="min-w-0 flex-1 rounded-md border border-notion-border bg-transparent px-2 py-1 text-xs outline-none"
                aria-label="Nueva etiqueta de favoritos"
              />
              <button
                type="submit"
                className="rounded-md border border-notion-border px-2 py-1 text-xs hover:bg-notion-hover"
              >
                Añadir
              </button>
            </form>
          </div>

          {showForm && (
            <div className="mb-6 rounded-lg border border-notion-border bg-notion-sidebar p-4">
              <h3 className="mb-3 text-sm font-semibold">
                {editing ? 'Editar favorito' : 'Nuevo favorito'}
              </h3>
              <div className="space-y-2">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título"
                  className="w-full rounded-md border border-notion-border bg-transparent px-3 py-2 text-sm outline-none"
                  aria-label="Título del favorito"
                />
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full rounded-md border border-notion-border bg-transparent px-3 py-2 text-sm outline-none"
                  aria-label="URL del favorito"
                />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas (opcional)"
                  rows={2}
                  className="w-full resize-y rounded-md border border-notion-border bg-transparent px-3 py-2 text-sm outline-none"
                  aria-label="Notas del favorito"
                />
                <select
                  value={formFolderId ?? ''}
                  onChange={(e) => setFormFolderId(e.target.value || null)}
                  className="w-full rounded-md border border-notion-border bg-transparent px-3 py-2 text-sm outline-none"
                  aria-label="Carpeta"
                >
                  <option value="">Sin carpeta</option>
                  {bookmarkFolders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                {bookmarkTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {bookmarkTags.map((t) => {
                      const on = formTagIds.includes(t.id)
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleFormTag(t.id)}
                          className={`rounded-md px-2 py-0.5 text-xs ${
                            on
                              ? 'bg-notion-active'
                              : 'border border-notion-border hover:bg-notion-hover'
                          }`}
                        >
                          {t.name}
                        </button>
                      )
                    })}
                  </div>
                )}
                {formError && <p className="text-xs text-red-600 dark:text-red-400">{formError}</p>}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void saveForm()}
                    className="rounded-md border border-notion-border bg-notion-bg px-3 py-1.5 text-sm hover:bg-notion-hover"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-md px-3 py-1.5 text-sm text-notion-text/60 hover:bg-notion-hover"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          <ul className="space-y-2">
            {filtered.length === 0 && (
              <li className="py-8 text-center text-sm text-notion-text/45">
                No hay favoritos en esta vista. Añade una URL para empezar.
              </li>
            )}
            {filtered.map((bm) => (
              <li
                key={bm.id}
                className="rounded-lg border border-notion-border px-3 py-2.5 hover:bg-notion-hover/40"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <a
                      href={bm.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-sm hover:underline"
                    >
                      {bm.title}
                    </a>
                    <p className="truncate text-xs text-notion-text/45">{bm.url}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-notion-text/50">
                      <span>{folderName(bm.folderId)}</span>
                      {(bm.tagIds ?? []).map((tid) => {
                        const t = bookmarkTags.find((x) => x.id === tid)
                        return t ? (
                          <span
                            key={tid}
                            className="rounded bg-notion-sidebar px-1.5 py-0.5 text-notion-text/70"
                          >
                            {t.name}
                          </span>
                        ) : null
                      })}
                    </div>
                    {bm.notes ? (
                      <p className="mt-1 text-xs text-notion-text/55">{bm.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Tooltip content="Abrir en nueva pestaña">
                      <a
                        href={bm.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md p-1.5 text-notion-text/60 hover:bg-notion-hover"
                        aria-label="Abrir en nueva pestaña"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    </Tooltip>
                    <Tooltip content={copiedId === bm.id ? 'Copiado' : 'Copiar URL'}>
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-notion-text/60 hover:bg-notion-hover"
                        aria-label="Copiar URL"
                        onClick={() => void copyUrl(bm)}
                      >
                        {copiedId === bm.id ? (
                          <Check className="size-3.5" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    </Tooltip>
                    <Tooltip content="Editar">
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-notion-text/60 hover:bg-notion-hover"
                        aria-label="Editar favorito"
                        onClick={() => openForm(bm)}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Eliminar">
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-red-600/70 hover:bg-notion-hover"
                        aria-label="Eliminar favorito"
                        onClick={() => {
                          if (!window.confirm(`¿Eliminar «${bm.title}»?`)) return
                          void deleteBookmark(bm.id)
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
