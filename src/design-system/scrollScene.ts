import { createSignal, onCleanup, type Accessor } from 'solid-js'

export const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value))
export const lerp = (from: number, to: number, amount: number): number => from + (to - from) * amount
export const segment = (value: number, start: number, end: number): number => (end <= start ? (value >= end ? 1 : 0) : clamp((value - start) / (end - start)))

export const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3
export const easeInCubic = (t: number): number => t ** 3
export const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
export const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2

export interface ScrollSceneHandlers {
  readonly measure: () => void
  readonly render: () => void
}

const scenes = new Set<ScrollSceneHandlers>()
let frame = 0

const flush = () => {
  frame = 0
  scenes.forEach((scene) => scene.measure())
  scenes.forEach((scene) => scene.render())
}

export const requestSceneFrame = (): void => {
  if (frame || typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') return
  frame = window.requestAnimationFrame(flush)
}

export function registerScrollScene(scene: ScrollSceneHandlers): () => void {
  if (!scenes.size) {
    window.addEventListener('scroll', requestSceneFrame, { passive: true })
    window.addEventListener('resize', requestSceneFrame, { passive: true })
  }
  scenes.add(scene)
  scene.measure()
  scene.render()
  return () => {
    scenes.delete(scene)
    if (scenes.size) return
    window.removeEventListener('scroll', requestSceneFrame)
    window.removeEventListener('resize', requestSceneFrame)
    if (frame) window.cancelAnimationFrame(frame)
    frame = 0
  }
}

export function observeSize(elements: readonly Element[], onResize: () => void): () => void {
  if (typeof ResizeObserver === 'undefined') return () => {}
  const observer = new ResizeObserver(onResize)
  elements.forEach((element) => observer.observe(element))
  return () => observer.disconnect()
}

export const stickyOffset = (element: HTMLElement): number => parseFloat(getComputedStyle(element).top) || 0

export function scrollToPinned(root: HTMLElement, stickyTop: number, pinned: number): void {
  window.scrollTo({ top: window.scrollY + root.getBoundingClientRect().top - stickyTop + pinned })
}

export function setPhase(element: HTMLElement, key: string, value: string): void {
  if (element.dataset[key] !== value) element.dataset[key] = value
}

export function clearInlineStyles(elements: readonly (HTMLElement | undefined)[]): void {
  elements.forEach((element) => element?.removeAttribute('style'))
}

export function createReducedMotion(): Accessor<boolean> {
  const query = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
  const [reduced, setReduced] = createSignal(query?.matches ?? false)
  if (query?.addEventListener) {
    const update = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener('change', update)
    onCleanup(() => query.removeEventListener('change', update))
  }
  return reduced
}
