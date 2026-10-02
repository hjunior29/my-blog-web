import './book-transition.css'

export async function transitionBookToArticle(element: HTMLElement, reveal: () => void | Promise<void>, signal: AbortSignal, label: string) {
  const source = (
    element.classList.contains('ds-book')
      ? element
      : element.closest('.post-book-stage')?.querySelector<HTMLElement>('.ds-book')
        ?? element.querySelector<HTMLElement>('.ds-book')
        ?? element
  ) as HTMLElement

  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    await reveal()
    return
  }
  if (!source || !source.animate || !source.querySelector?.('.ds-book-rotate')) {
    await reveal()
    return
  }
  const bounds = source.getBoundingClientRect()
  if (bounds.width === 0 || bounds.height === 0) {
    await reveal()
    return
  }
  const originalVisibility = source.style.visibility
  const overlay = document.createElement('dialog')
  overlay.className = 'book-transition-overlay'
  overlay.setAttribute('aria-label', label)
  overlay.setAttribute('aria-busy', 'true')
  const flight = document.createElement('div')
  flight.className = 'book-transition-flight'
  Object.assign(flight.style, { left: `${bounds.left}px`, top: `${bounds.top}px`, width: `${bounds.width}px`, height: `${bounds.height}px` })
  const copy = source.cloneNode(true) as HTMLElement
  copy.classList.add('book-transition-copy')
  copy.setAttribute('aria-hidden', 'true')
  copy.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'))
  const computed = getComputedStyle(source)
  for (const token of ['--book-color', '--book-cover', '--book-text', '--book-back']) copy.style.setProperty(token, computed.getPropertyValue(token))
  const originalTitle = source.querySelector('.ds-book-title')
  const title = copy.querySelector<HTMLElement>('.ds-book-title')
  if (title && originalTitle) title.style.fontFamily = getComputedStyle(originalTitle).fontFamily
  const turn = copy.querySelector<HTMLElement>('.ds-book-rotate')
  const sourceTurn = source.querySelector<HTMLElement>('.ds-book-rotate')
  const cover = copy.querySelector<HTMLElement>('.ds-book-cover')
  if (!turn || !sourceTurn || !cover) {
    reveal()
    return
  }
  const initialTurn = getComputedStyle(sourceTurn).transform
  turn.style.transform = initialTurn
  const hinge = document.createElement('div')
  hinge.className = 'book-transition-hinge'
  const inside = document.createElement('div')
  inside.className = 'book-transition-inside'
  const page = document.createElement('div')
  page.className = 'book-transition-page'
  const seam = document.createElement('div')
  seam.className = 'book-transition-seam'
  for (const sheet of [inside, page]) {
    const text = document.createElement('div')
    text.className = 'book-transition-text'
    for (let index = 0; index < 18; index++) {
      const line = document.createElement('span')
      text.append(line)
    }
    sheet.append(text)
  }
  page.append(seam)
  turn.prepend(page)
  cover.before(hinge)
  hinge.append(cover, inside)
  flight.append(copy)
  overlay.append(flight)
  document.body.append(overlay)
  const animations: Animation[] = []
  const animate = (element: Element, frames: Keyframe[], duration: number, easing = 'cubic-bezier(.22,.75,.25,1)') => {
    const animation = element.animate(frames, { duration, easing, fill: 'forwards' })
    animations.push(animation)
    return animation.finished
  }
  const abort = () => animations.forEach(animation => animation.cancel())
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
    if (typeof overlay.showModal === 'function') overlay.showModal()
    else overlay.setAttribute('open', '')
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
      animate(flight, [{ transform: 'none' }, { transform: zoomed }], 330, 'cubic-bezier(.65,0,.35,1)'),
      ...Array.from(copy.querySelectorAll('.book-transition-text'), text => animate(text, [{ opacity: 1 }, { opacity: 0 }], 240)),
    ])
    if (signal.aborted || !overlay.open) return
    await reveal()
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    await animate(overlay, [{ opacity: 1 }, { opacity: 0 }], 130, 'ease-out')
  } catch {
    if (!signal.aborted && overlay.open) await reveal()
  } finally {
    signal.removeEventListener('abort', abort)
    overlay.removeEventListener('close', abort)
    animations.forEach(animation => animation.cancel())
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
