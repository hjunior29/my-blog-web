import { beforeEach, describe, expect, it } from 'vitest'
import {
  calculateResumeScrollY,
  getReadingBookmark,
  removeReadingBookmark,
  saveReadingBookmark,
} from './readingBookmark'

describe('readingBookmark storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('saves and retrieves reading bookmark for a slug', () => {
    const saved = saveReadingBookmark('sample-post', 0.42)
    expect(saved.slug).toBe('sample-post')
    expect(saved.progress).toBeCloseTo(0.42)

    const retrieved = getReadingBookmark('sample-post')
    expect(retrieved).not.toBeNull()
    expect(retrieved?.progress).toBeCloseTo(0.42)
    expect(retrieved?.slug).toBe('sample-post')
  })

  it('clamps progress between 0 and 1', () => {
    saveReadingBookmark('low', -0.5)
    expect(getReadingBookmark('low')?.progress).toBe(0)

    saveReadingBookmark('high', 1.8)
    expect(getReadingBookmark('high')?.progress).toBe(1)
  })

  it('removes bookmark correctly', () => {
    saveReadingBookmark('to-remove', 0.7)
    expect(getReadingBookmark('to-remove')).not.toBeNull()

    removeReadingBookmark('to-remove')
    expect(getReadingBookmark('to-remove')).toBeNull()
  })

  it('calculates resume scroll y properly', () => {
    const element = document.createElement('div')
    Object.defineProperty(element, 'getBoundingClientRect', {
      value: () => ({ top: 100, height: 2000, bottom: 2100, left: 0, right: 800, width: 800 }),
    })
    window.scrollY = 0
    window.innerHeight = 800

    const scrollY = calculateResumeScrollY(element, 0.5, 65)
    expect(scrollY).toBeGreaterThan(0)
  })
})
