import { describe, expect, it } from 'vitest'
import { isEmptyDoc } from './emptyDoc'

describe('isEmptyDoc', () => {
  it('detects empty paragraph doc', () => {
    expect(isEmptyDoc({ type: 'doc', content: [{ type: 'paragraph' }] })).toBe(true)
  })

  it('detects non-empty doc', () => {
    expect(
      isEmptyDoc({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hola' }] }],
      }),
    ).toBe(false)
  })
})
