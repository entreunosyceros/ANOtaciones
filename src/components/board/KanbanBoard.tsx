import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Columns3, Plus, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { usePagesContext } from '../../context/PagesContext'
import { BOARD_STATUSES, type BoardStatus, type Page } from '../../db/types'
import { Breadcrumbs } from '../layout/Breadcrumbs'
import { PageIconButton } from '../ui/EmojiPicker'

function cardStatus(page: Page): BoardStatus {
  const s = page.properties.status
  if (typeof s === 'string' && (BOARD_STATUSES as readonly string[]).includes(s)) {
    return s as BoardStatus
  }
  return 'Backlog'
}

function SortableCard({
  page,
  onOpen,
}: {
  page: Page
  onOpen: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      title={`Abrir «${page.title || 'Sin título'}» (arrastra para mover)`}
      aria-label={`Abrir «${page.title || 'Sin título'}»`}
      className="w-full rounded-md border border-notion-border bg-notion-bg px-3 py-2 text-left text-sm shadow-sm hover:bg-notion-hover"
      onClick={onOpen}
      {...attributes}
      {...listeners}
    >
      {page.title || 'Sin título'}
    </button>
  )
}

function Column({
  status,
  cards,
  onOpen,
}: {
  status: BoardStatus
  cards: Page[]
  onOpen: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[320px] w-64 shrink-0 flex-col rounded-lg bg-notion-sidebar p-2 ${
        isOver ? 'ring-2 ring-notion-border' : ''
      }`}
    >
      <div className="mb-2 flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wide text-notion-text/50">
        <span>{status}</span>
        <span>{cards.length}</span>
      </div>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2">
          {cards.map((card) => (
            <SortableCard key={card.id} page={card} onOpen={() => onOpen(card.id)} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export function KanbanBoard({ page, embedded = false }: { page: Page; embedded?: boolean }) {
  const { pages, createPage, patchPage, renamePage, setActivePageId, toggleFavorite } =
    usePagesContext()
  const [activeId, setActiveId] = useState<string | null>(null)

  const cards = useMemo(
    () =>
      pages
        .filter((p) => p.parentId === page.id)
        .sort((a, b) => a.order - b.order),
    [pages, page.id],
  )

  const byStatus = useMemo(() => {
    const map: Record<BoardStatus, Page[]> = {
      Backlog: [],
      Doing: [],
      Done: [],
    }
    for (const card of cards) {
      map[cardStatus(card)].push(card)
    }
    return map
  }, [cards])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const cardId = String(active.id)
    const overId = String(over.id)

    let nextStatus: BoardStatus | null = null
    if ((BOARD_STATUSES as readonly string[]).includes(overId)) {
      nextStatus = overId as BoardStatus
    } else {
      const overCard = cards.find((c) => c.id === overId)
      if (overCard) nextStatus = cardStatus(overCard)
    }
    if (!nextStatus) return

    const card = cards.find((c) => c.id === cardId)
    if (!card) return
    if (cardStatus(card) === nextStatus) return

    await patchPage(cardId, {
      properties: { ...card.properties, status: nextStatus },
    })
  }

  const activeCard = cards.find((c) => c.id === activeId)

  const addCard = () =>
    void createPage({
      parentId: page.id,
      title: 'Nueva tarjeta',
      kind: 'doc',
      properties: { status: 'Backlog' },
      open: false,
    })

  return (
    <div className={`flex h-full flex-col ${embedded ? 'px-0 pt-0' : 'px-8 pb-8 pt-10'}`}>
      {!embedded && (
        <>
          <Breadcrumbs pageId={page.id} />
          <div className="mb-6 flex items-center gap-2">
            <PageIconButton
              icon={page.icon}
              fallback={<Columns3 className="size-6 opacity-40" />}
              onChange={(emoji) => void patchPage(page.id, { icon: emoji })}
            />
            <input
              key={`board-title-${page.id}`}
              defaultValue={page.title}
              className="min-w-0 flex-1 bg-transparent text-3xl font-bold outline-none"
              onChange={(e) => void renamePage(page.id, e.target.value || 'Nuevo tablero')}
            />
            <button
              type="button"
              title={page.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              aria-label={page.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              className="rounded-md p-1.5 hover:bg-notion-hover"
              onClick={() => void toggleFavorite(page.id)}
            >
              <Star
                className={`size-5 ${page.isFavorite ? 'fill-amber-400 text-amber-400' : 'opacity-50'}`}
              />
            </button>
            <button
              type="button"
              title="Añadir una tarjeta al Backlog"
              aria-label="Añadir una tarjeta al Backlog"
              className="flex items-center gap-1 rounded-md border border-notion-border px-3 py-1.5 text-sm hover:bg-notion-hover"
              onClick={addCard}
            >
              <Plus className="size-4" />
              Tarjeta
            </button>
          </div>
        </>
      )}

      {embedded && (
        <div className="mb-3">
          <button
            type="button"
            title="Añadir una tarjeta al Backlog"
            aria-label="Añadir una tarjeta al Backlog"
            className="flex items-center gap-1 rounded-md border border-notion-border px-3 py-1.5 text-sm hover:bg-notion-hover"
            onClick={addCard}
          >
            <Plus className="size-4" />
            Tarjeta
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={(e) => void onDragEnd(e)}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {BOARD_STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              cards={byStatus[status]}
              onOpen={(id) => setActivePageId(id)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCard ? (
            <div className="w-64 rounded-md border border-notion-border bg-notion-bg px-3 py-2 text-sm shadow-lg">
              {activeCard.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
