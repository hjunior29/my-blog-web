export interface ReadingBookmark {
  readonly slug: string
  readonly progress: number
  readonly timestamp: number
}

const STORAGE_PREFIX = 'blog_bookmark_'
const MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000
const memoryStore = new Map<string, string>()

function getStorageItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return memoryStore.get(key) ?? null
  }
}

function setStorageItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    memoryStore.set(key, value)
  }
}

function removeStorageItem(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    memoryStore.delete(key)
  }
}

export function getReadingBookmark(slug: string): ReadingBookmark | null {
  if (!slug) return null
  const raw = getStorageItem(`${STORAGE_PREFIX}${slug}`)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<ReadingBookmark>
    if (typeof parsed.progress !== 'number' || Number.isNaN(parsed.progress)) return null
    if (typeof parsed.timestamp !== 'number') return null
    if (Date.now() - parsed.timestamp > MAX_AGE_MS) {
      removeStorageItem(`${STORAGE_PREFIX}${slug}`)
      return null
    }
    const clampedProgress = Math.min(1, Math.max(0, parsed.progress))
    return { slug, progress: clampedProgress, timestamp: parsed.timestamp }
  } catch {
    return null
  }
}

export function saveReadingBookmark(slug: string, progress: number): ReadingBookmark {
  const clampedProgress = Math.min(1, Math.max(0, progress))
  const bookmark: ReadingBookmark = {
    slug,
    progress: clampedProgress,
    timestamp: Date.now(),
  }
  setStorageItem(`${STORAGE_PREFIX}${slug}`, JSON.stringify(bookmark))
  return bookmark
}

export function removeReadingBookmark(slug: string): void {
  if (!slug) return
  removeStorageItem(`${STORAGE_PREFIX}${slug}`)
}

export function calculateResumeScrollY(target: HTMLElement, progress: number, headerOffset = 65): number {
  const rect = target.getBoundingClientRect()
  const viewportHeight = window.innerHeight || 800
  const targetTopAbs = window.scrollY + rect.top
  const distance = Math.max(0, rect.height - viewportHeight + headerOffset)
  const targetScrollY = targetTopAbs - headerOffset + distance * Math.min(1, Math.max(0, progress))
  return Math.max(0, Math.round(targetScrollY))
}
