import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as db from '../db'
import { useAutosave } from './useAutosave'

vi.mock('../db', async () => {
  const actual = await vi.importActual<typeof import('../db')>('../db')
  return {
    ...actual,
    updatePage: vi.fn(async () => undefined),
  }
})

describe('useAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(db.updatePage).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces content saves by 300ms', async () => {
    const { result } = renderHook(() => useAutosave('page-1'))
    const doc = { type: 'doc', content: [{ type: 'paragraph' }] }

    act(() => {
      result.current.schedule(doc)
      result.current.schedule(doc)
    })

    expect(db.updatePage).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(db.updatePage).toHaveBeenCalledTimes(1)
    expect(db.updatePage).toHaveBeenCalledWith('page-1', { content: doc })
  })
})
