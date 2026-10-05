import { EASE_IN_OUT, buildSpread, cloneBook, createAnimator, createOverlay, createPart, place, prefersReducedMotion, recallShelf, showOverlay, type ShelfMemory } from './bookFlight'

const BOOK_RATIO = 60 / 49
const DEFAULT_BOOK_WIDTH = 248
const SHELF_TIMEOUT_MS = 1800
const SHELF_GRACE_MS = 1200
const EASE_CLOSE = 'cubic-bezier(.45,0,.2,1)'

export interface BookReturnOptions {
  readonly slug: string
  readonly href: string
  readonly label: string
  readonly navigate: (href: string) => void
  readonly restoreFocus?: boolean
}

export function bookReturnHref(slug: string, shelfPath: string): string {
  const memory = recallShelf(slug)
  return memory?.pathname === shelfPath ? `${shelfPath}${memory.search}` : shelfPath
}

const findShelfBook = (slug: string): HTMLElement | undefined =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-book-slug]'))
    .find(stage => stage.dataset.bookSlug === slug)
    ?.querySelector<HTMLElement>('.ds-book') ?? undefined

function waitForShelfBook(slug: string, active: () => boolean, deadline: () => number): Promise<HTMLElement | undefined> {
  return new Promise(resolve => {
    const poll = () => {
      const book = active() ? findShelfBook(slug) : undefined
      if (book || !active() || performance.now() > deadline()) resolve(book)
      else requestAnimationFrame(poll)
    }
    poll()
  })
}

function bringIntoView(book: HTMLElement, memory: ShelfMemory | undefined, href: string) {
  if (memory && `${memory.pathname}${memory.search}` === href) window.scrollTo({ top: memory.scrollY, behavior: 'instant' })
  const rect = book.getBoundingClientRect()
  const covered = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
  if (rect.top < covered || rect.bottom > innerHeight) window.scrollTo({ top: window.scrollY + rect.top + (rect.height - innerHeight - covered) / 2, behavior: 'instant' })
}

export async function transitionArticleToBook(options: BookReturnOptions) {
  const { slug, href, label, navigate } = options
  const leave = () => {
    navigate(href)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  if (prefersReducedMotion() || typeof document.body.animate !== 'function') {
    leave()
    return
  }
  const memory = recallShelf(slug)
  const overlay = createOverlay(label)
  overlay.classList.add('book-transition-return')
  const shade = createPart('book-transition-shade')
  const sheet = createPart('book-transition-sheet')
  overlay.append(shade, sheet)
  document.body.append(overlay)
  const { animate, cancel } = createAnimator()
  const onCancel = (event: Event) => { event.preventDefault(); overlay.close() }
  overlay.addEventListener('cancel', onCancel)
  overlay.addEventListener('close', cancel)
  let done = false
  const active = () => !done && overlay.open
  const root = document.documentElement
  const previous = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter }
  let left = false
  let book: HTMLElement | undefined
  let bookVisibility = ''
  let landed = false
  try {
    showOverlay(overlay)
    root.style.scrollbarGutter = 'stable'
    root.style.overflow = 'hidden'
    overlay.dataset.phase = 'cover'
    await animate(overlay, [{ opacity: 0 }, { opacity: 1 }], 120, 'ease-in')
    left = true
    leave()
    let deadline = memory ? Infinity : performance.now() + SHELF_TIMEOUT_MS
    const shelfBook = waitForShelfBook(slug, active, () => deadline).then(found => {
      if (!found || !active()) return undefined
      book = found
      bookVisibility = found.style.visibility
      found.style.visibility = 'hidden'
      bringIntoView(found, memory, href)
      return found
    })
    let copy = memory?.snapshot.cloneNode(true) as HTMLElement | undefined
    let width = memory?.width ?? DEFAULT_BOOK_WIDTH
    if (!copy) {
      const found = await shelfBook
      if (found) {
        width = found.getBoundingClientRect().width || width
        copy = cloneBook(found)
      }
    }
    const spread = copy && buildSpread(copy)
    if (!active()) return
    if (!copy || !spread) {
      await animate(overlay, [{ opacity: 1 }, { opacity: 0 }], 200, 'ease-out')
      return
    }
    const height = memory?.height ?? width * BOOK_RATIO
    const fit = Math.min(1, (innerWidth - 32) / (width * 2), (innerHeight - 32) / height)
    const top = (innerHeight - height * fit) / 2
    const opened = place(innerWidth / 2, top, fit)
    const closed = place((innerWidth - width * fit) / 2, top, fit)
    const zoom = Math.max(innerWidth / width, innerHeight / height) * 1.14
    const zoomed = place((innerWidth - width * zoom) / 2, (innerHeight - height * zoom) / 2, zoom)
    const { turn, hinge, texts } = spread
    turn.style.transform = 'rotateY(0deg)'
    hinge.style.transform = 'rotateY(-180deg)'
    texts.forEach(text => { text.style.opacity = '0' })
    const flight = createPart('book-transition-flight')
    Object.assign(flight.style, { width: `${width}px`, height: `${height}px`, transform: zoomed })
    flight.append(copy)
    overlay.append(flight)
    sheet.remove()
    overlay.dataset.phase = 'shrink'
    await Promise.all([
      animate(flight, [{ transform: zoomed }, { transform: opened }], 340, EASE_IN_OUT),
      ...texts.map(text => animate(text, [{ opacity: 0 }, { opacity: 1 }], 220, 'ease-out', 120)),
    ])
    overlay.dataset.phase = 'spread'
    await animate(flight, [{ transform: opened }, { transform: opened }], 60)
    overlay.dataset.phase = 'close'
    await Promise.all([
      animate(hinge, [{ transform: 'rotateY(-180deg)' }, { transform: 'rotateY(0deg)' }], 380, EASE_CLOSE),
      animate(turn, [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-32deg)' }], 380, EASE_CLOSE),
      animate(flight, [{ transform: opened }, { transform: closed }], 380, EASE_CLOSE),
    ])
    deadline = performance.now() + SHELF_GRACE_MS
    const target = await shelfBook
    if (!active()) return
    const bounds = target?.getBoundingClientRect()
    overlay.dataset.phase = 'shelve'
    if (!bounds || !bounds.width) {
      await Promise.all([
        animate(flight, [{ opacity: 1 }, { opacity: 0 }], 220, 'ease-out'),
        animate(shade, [{ opacity: 1 }, { opacity: 0 }], 220, 'ease-out'),
      ])
      return
    }
    const shelved = place(bounds.left, bounds.top, bounds.width / width)
    await Promise.all([
      animate(flight, [{ transform: closed }, { transform: shelved }], 440, EASE_IN_OUT),
      animate(turn, [{ transform: 'rotateY(-32deg)' }, { transform: 'rotateY(0deg)' }], 440, EASE_IN_OUT),
      animate(shade, [{ opacity: 1 }, { opacity: 0 }], 440, 'ease-out'),
    ])
    landed = true
  } catch {
    if (!left) leave()
  } finally {
    done = true
    overlay.removeEventListener('close', cancel)
    cancel()
    if (book) book.style.visibility = bookVisibility
    overlay.remove()
    root.style.overflow = previous.overflow
    root.style.scrollbarGutter = previous.gutter
    if (landed && options.restoreFocus) book?.closest('[data-book-slug]')?.querySelector<HTMLElement>('.post-book-action')?.focus({ preventScroll: true })
  }
}
