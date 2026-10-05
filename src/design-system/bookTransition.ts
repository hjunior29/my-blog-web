import { EASE_IN_OUT, buildSpread, cloneBook, createAnimator, createOverlay, createPart, nextPaint, prefersReducedMotion, rememberShelf, showOverlay } from './bookFlight'

const findSourceBook = (element: HTMLElement): HTMLElement => (
  element.classList.contains('ds-book')
    ? element
    : element.closest('.post-book-stage')?.querySelector<HTMLElement>('.ds-book')
      ?? element.querySelector<HTMLElement>('.ds-book')
      ?? element
)

function rememberOrigin(source: HTMLElement, copy: HTMLElement, bounds: DOMRect) {
  const slug = source.closest<HTMLElement>('[data-book-slug]')?.dataset.bookSlug
  if (!slug) return
  rememberShelf({ slug, pathname: location.pathname, search: location.search, scrollY: window.scrollY, width: bounds.width, height: bounds.height, snapshot: copy.cloneNode(true) as HTMLElement })
}

export async function transitionBookToArticle(element: HTMLElement, reveal: () => void | Promise<void>, signal: AbortSignal, label: string) {
  const source = findSourceBook(element)
  if (prefersReducedMotion() || !source || !source.animate || !source.querySelector?.('.ds-book-rotate')) {
    await reveal()
    return
  }
  const bounds = source.getBoundingClientRect()
  if (bounds.width === 0 || bounds.height === 0) {
    await reveal()
    return
  }
  const originalVisibility = source.style.visibility
  const copy = cloneBook(source)
  rememberOrigin(source, copy, bounds)
  const sourceTurn = source.querySelector<HTMLElement>('.ds-book-rotate')
  const spread = sourceTurn ? buildSpread(copy) : undefined
  if (!sourceTurn || !spread) {
    reveal()
    return
  }
  const { turn, hinge, texts } = spread
  const initialTurn = getComputedStyle(sourceTurn).transform
  turn.style.transform = initialTurn
  const overlay = createOverlay(label)
  const flight = createPart('book-transition-flight')
  Object.assign(flight.style, { left: `${bounds.left}px`, top: `${bounds.top}px`, width: `${bounds.width}px`, height: `${bounds.height}px` })
  flight.append(copy)
  overlay.append(flight)
  document.body.append(overlay)
  const { animate, cancel: abort } = createAnimator()
  const cancel = (event: Event) => { event.preventDefault(); overlay.close() }
  overlay.addEventListener('cancel', cancel)
  overlay.addEventListener('close', abort)
  signal.addEventListener('abort', abort, { once: true })
  const centerX = innerWidth / 2 - bounds.left
  const centerY = innerHeight / 2 - bounds.height / 2 - bounds.top
  const zoom = Math.max(innerWidth / bounds.width, innerHeight / bounds.height) * 1.14
  const zoomed = `translate3d(${centerX - bounds.width * zoom / 2}px, ${centerY}px, 0) scale(${zoom})`
  const previousOverflow = document.documentElement.style.overflow
  try {
    showOverlay(overlay)
    document.documentElement.style.overflow = 'hidden'
    source.style.visibility = 'hidden'
    overlay.dataset.phase = 'rotate'
    await animate(turn, [{ transform: initialTurn }, { transform: 'rotateY(-32deg)' }], 170)
    overlay.dataset.phase = 'open'
    await Promise.all([
      animate(hinge, [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-180deg)' }], 380),
      animate(turn, [{ transform: 'rotateY(-32deg)' }, { transform: 'rotateY(0deg)' }], 380),
    ])
    overlay.dataset.phase = 'spread'
    await animate(flight, [{ transform: 'none' }, { transform: 'none' }], 80)
    overlay.dataset.phase = 'zoom'
    await Promise.all([
      animate(flight, [{ transform: 'none' }, { transform: zoomed }], 330, EASE_IN_OUT),
      ...texts.map(text => animate(text, [{ opacity: 1 }, { opacity: 0 }], 240)),
    ])
    if (signal.aborted || !overlay.open) return
    await reveal()
    await nextPaint()
    await animate(overlay, [{ opacity: 1 }, { opacity: 0 }], 130, 'ease-out')
  } catch {
    if (!signal.aborted && overlay.open) await reveal()
  } finally {
    signal.removeEventListener('abort', abort)
    overlay.removeEventListener('close', abort)
    abort()
    overlay.remove()
    source.style.visibility = originalVisibility
    document.documentElement.style.overflow = previousOverflow
  }
}

export function createBookTransition() {
  let controller: AbortController | undefined
  let isNavigating = false

  const startTransition = async (
    trigger: HTMLElement,
    label: string,
    reveal: () => void | Promise<void>
  ) => {
    controller?.abort()
    controller = new AbortController()
    isNavigating = false

    const wrappedReveal = async () => {
      isNavigating = true
      await reveal()
    }

    return transitionBookToArticle(trigger, wrappedReveal, controller.signal, label)
  }

  const abortTransition = () => {
    if (!isNavigating) {
      controller?.abort()
      controller = undefined
    }
  }

  return { startTransition, abortTransition }
}
