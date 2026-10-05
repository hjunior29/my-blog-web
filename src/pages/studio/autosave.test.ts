import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRoot } from 'solid-js'
import { useAutosave } from './useAutosave'

describe('useAutosave hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('triggers save every interval when content has changed', async () => {
    let currentContent = 'Initial'
    const handleSave = vi.fn().mockResolvedValue(true)

    let autosave: ReturnType<typeof useAutosave> | undefined
    let disposeFn: (() => void) | undefined

    createRoot(dispose => {
      disposeFn = dispose
      autosave = useAutosave({
        intervalMs: 1000,
        canSave: () => true,
        getSnapshot: () => currentContent,
        onSave: handleSave,
      })
    })

    currentContent = 'Modified text'
    await vi.advanceTimersByTimeAsync(1000)
    expect(handleSave).toHaveBeenCalledTimes(1)
    expect(autosave?.status()).toBe('saved')

    disposeFn?.()
  })

  it('pauses after 5 consecutive unchanged ticks and resumes on notifyChange', async () => {
    const handleSave = vi.fn().mockResolvedValue(true)
    const content = 'Same text'

    createRoot(dispose => {
      const autosave = useAutosave({
        intervalMs: 1000,
        maxUnchangedTicks: 5,
        canSave: () => true,
        getSnapshot: () => content,
        onSave: handleSave,
      })

      for (let i = 0; i < 5; i++) {
        vi.advanceTimersByTime(1000)
      }

      expect(autosave.status()).toBe('paused')
      expect(handleSave).not.toHaveBeenCalled()

      autosave.notifyChange()
      expect(autosave.status()).toBe('idle')

      dispose()
    })
  })

  it('switches to unsaved status when notifyChange is called with changed content', () => {
    let currentContent = 'Initial'
    const handleSave = vi.fn().mockResolvedValue(true)

    let autosave: ReturnType<typeof useAutosave> | undefined
    let disposeFn: (() => void) | undefined

    createRoot(dispose => {
      disposeFn = dispose
      autosave = useAutosave({
        intervalMs: 1000,
        canSave: () => true,
        getSnapshot: () => currentContent,
        onSave: handleSave,
      })
    })

    expect(autosave?.status()).toBe('idle')
    currentContent = 'Modified text'
    autosave?.notifyChange()
    expect(autosave?.status()).toBe('unsaved')

    disposeFn?.()
  })
})
