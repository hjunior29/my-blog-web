import { createSignal, onCleanup } from 'solid-js'

export type AutosaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'paused'

export interface UseAutosaveOptions {
  readonly onSave: (isAutosave: boolean) => Promise<boolean | undefined>
  readonly getSnapshot: () => string
  readonly canSave: () => boolean
  readonly intervalMs?: number
  readonly maxUnchangedTicks?: number
}

export function useAutosave(options: UseAutosaveOptions) {
  const intervalMs = options.intervalMs ?? 60_000
  const maxTicks = options.maxUnchangedTicks ?? 5

  const [status, setStatus] = createSignal<AutosaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = createSignal<Date | null>(null)

  let unchangedTickCount = 0
  let lastSavedSnapshot = options.getSnapshot()

  const notifyChange = () => {
    unchangedTickCount = 0
    if (status() === 'saving') return
    const current = options.getSnapshot()
    if (current !== lastSavedSnapshot) {
      setStatus('unsaved')
    } else if (status() === 'paused') {
      setStatus('idle')
    }
  }

  const timer = setInterval(async () => {
    if (status() === 'paused') return
    if (!options.canSave()) return

    const currentSnapshot = options.getSnapshot()
    if (!currentSnapshot.trim()) return

    if (currentSnapshot === lastSavedSnapshot) {
      unchangedTickCount++
      if (unchangedTickCount >= maxTicks) {
        setStatus('paused')
      }
      return
    }

    unchangedTickCount = 0
    setStatus('saving')
    try {
      const ok = await options.onSave(true)
      if (ok) {
        lastSavedSnapshot = currentSnapshot
        setLastSavedAt(new Date())
        setStatus('saved')
      } else {
        setStatus('idle')
      }
    } catch {
      setStatus('idle')
    }
  }, intervalMs)

  onCleanup(() => {
    clearInterval(timer)
  })

  return {
    status,
    lastSavedAt,
    notifyChange,
    markSaved: (snapshot: string) => {
      lastSavedSnapshot = snapshot
      unchangedTickCount = 0
      setLastSavedAt(new Date())
      setStatus('saved')
    },
  }
}
