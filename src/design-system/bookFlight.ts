import './book-transition.css'

export const EASE_OUT = 'cubic-bezier(.22,.75,.25,1)'
export const EASE_IN_OUT = 'cubic-bezier(.65,0,.35,1)'

export interface BookSpread {
  readonly turn: HTMLElement
  readonly hinge: HTMLElement
  readonly texts: readonly HTMLElement[]
}

export interface ShelfMemory {
  readonly slug: string
  readonly pathname: string
  readonly search: string
  readonly scrollY: number
  readonly width: number
  readonly height: number
  readonly snapshot: HTMLElement
}

let shelf: ShelfMemory | undefined

export const rememberShelf = (memory: ShelfMemory): void => { shelf = memory }
export const recallShelf = (slug: string): ShelfMemory | undefined => (shelf?.slug === slug ? shelf : undefined)

export const prefersReducedMotion = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

export const place = (x: number, y: number, scale: number): string => `translate3d(${x}px, ${y}px, 0) scale(${scale})`

export const nextPaint = (): Promise<void> => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

export function createPart(className: string, tag = 'div'): HTMLElement {
  const element = document.createElement(tag)
  element.className = className
  return element
}

export function cloneBook(source: HTMLElement): HTMLElement {
  const copy = source.cloneNode(true) as HTMLElement
  copy.classList.add('book-transition-copy')
  copy.setAttribute('aria-hidden', 'true')
  copy.style.removeProperty('visibility')
  copy.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'))
  const computed = getComputedStyle(source)
  for (const token of ['--book-color', '--book-cover', '--book-text', '--book-back']) copy.style.setProperty(token, computed.getPropertyValue(token))
  const originalTitle = source.querySelector('.ds-book-title')
  const title = copy.querySelector<HTMLElement>('.ds-book-title')
  if (title && originalTitle) title.style.fontFamily = getComputedStyle(originalTitle).fontFamily
  return copy
}

export function buildSpread(copy: HTMLElement): BookSpread | undefined {
  const turn = copy.querySelector<HTMLElement>('.ds-book-rotate')
  const cover = copy.querySelector<HTMLElement>('.ds-book-cover')
  if (!turn || !cover) return undefined
  const hinge = createPart('book-transition-hinge')
  const inside = createPart('book-transition-inside')
  const page = createPart('book-transition-page')
  for (const sheet of [inside, page]) {
    const text = createPart('book-transition-text')
    for (let index = 0; index < 18; index++) text.append(document.createElement('span'))
    sheet.append(text)
  }
  page.append(createPart('book-transition-seam'))
  turn.prepend(page)
  cover.before(hinge)
  hinge.append(cover, inside)
  return { turn, hinge, texts: Array.from(copy.querySelectorAll<HTMLElement>('.book-transition-text')) }
}

export function createOverlay(label: string): HTMLDialogElement {
  const overlay = createPart('book-transition-overlay', 'dialog') as HTMLDialogElement
  overlay.setAttribute('aria-label', label)
  overlay.setAttribute('aria-busy', 'true')
  return overlay
}

export function showOverlay(overlay: HTMLDialogElement): void {
  if (typeof overlay.showModal === 'function') overlay.showModal()
  else overlay.setAttribute('open', '')
}

export function createAnimator() {
  const animations: Animation[] = []
  const animate = (element: Element, frames: Keyframe[], duration: number, easing = EASE_OUT, delay = 0) => {
    const animation = element.animate(frames, { duration, easing, delay, fill: 'both' })
    animations.push(animation)
    return animation.finished
  }
  const cancel = () => animations.forEach(animation => animation.cancel())
  return { animate, cancel }
}
