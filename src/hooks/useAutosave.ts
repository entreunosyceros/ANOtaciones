import { useEffect, useMemo } from 'react'
import { updatePage } from '../db'
import type { TipTapDoc } from '../db/types'
import { debounce } from '../lib/debounce'

export function useAutosave(pageId: string | null) {
  const save = useMemo(
    () =>
      debounce((id: string, content: TipTapDoc) => {
        void updatePage(id, { content })
      }, 300),
    [],
  )

  useEffect(() => () => save.flush(), [save])

  return {
    schedule: (content: TipTapDoc) => {
      if (!pageId) return
      save(pageId, content)
    },
    flush: () => save.flush(),
  }
}
