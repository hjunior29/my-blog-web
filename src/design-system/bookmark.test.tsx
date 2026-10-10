import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@solidjs/testing-library'
import { BookmarkRibbon, readingProgress } from './BookmarkRibbon'
import { bookReturnHref, transitionArticleToBook } from './bookReturn'
import { rememberShelf } from './bookFlight'
import { PostCard } from './editorial'

const rect = (top: number, height: number) => ({ top, height, bottom: top + height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) }) as DOMRect

const remember = (slug: string, pathname: string, search = '') =>
  rememberShelf({ slug, pathname, search, scrollY: 0, width: 248, height: 304, snapshot: document.createElement('div') })

describe('readingProgress', () => {
  it('starts at zero, ends at one, and treats short articles as read', () => {
    expect(readingProgress(rect(120, 3000), 64, 800)).toBe(0)
    expect(readingProgress(rect(64 - 1132, 3000), 64, 800)).toBeCloseTo(0.5)
    expect(readingProgress(rect(800 - 3000, 3000), 64, 800)).toBe(1)
    expect(readingProgress(rect(-9000, 3000), 64, 800)).toBe(1)
    expect(readingProgress(rect(100, 400), 64, 800)).toBe(1)
  })
})

describe('BookmarkRibbon component', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders a decorative ribbon with a fixed progress', () => {
    const { container } = render(() => <BookmarkRibbon progress={1.4} />)
    const ribbon = container.querySelector('.ds-bookmark-ribbon') as HTMLElement
    expect(ribbon.getAttribute('aria-hidden')).toBe('true')
    expect(ribbon.classList.contains('ds-bookmark-ribbon-static')).toBe(true)
    const band = container.querySelector('.ds-bookmark-ribbon-band') as HTMLElement
    expect(band.style.getPropertyValue('--ribbon-progress')).toBe('1')
  })

  it('renders an interactive ribbon with pin and triggers callback on click', () => {
    const onBookmark = vi.fn()
    const { container } = render(() => (
      <BookmarkRibbon progress={0.5} onBookmark={onBookmark} />
    ))
    const ribbon = container.querySelector('.ds-bookmark-ribbon') as HTMLElement
    expect(ribbon.getAttribute('aria-hidden')).toBeNull()
    const trigger = container.querySelector('.ds-bookmark-ribbon-trigger') as HTMLButtonElement
    trigger.click()
    expect(onBookmark).toHaveBeenCalledWith(0.5)
  })

  it('renders pin when savedProgress is provided and opens menu if progress differs', () => {
    const onBookmark = vi.fn()
    const onJumpToSaved = vi.fn()
    const { container } = render(() => (
      <BookmarkRibbon progress={0.2} savedProgress={0.8} onBookmark={onBookmark} onJumpToSaved={onJumpToSaved} />
    ))
    const pin = container.querySelector('.ds-bookmark-ribbon-pin') as HTMLElement
    expect(pin).not.toBeNull()
    const trigger = container.querySelector('.ds-bookmark-ribbon-trigger') as HTMLButtonElement
    trigger.click()
    const menu = container.querySelector('.ds-bookmark-menu') as HTMLElement
    expect(menu).not.toBeNull()
  })

  it('follows the reading position of its target and stops listening on unmount', () => {
    const target = document.createElement('article')
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(rect(64 - 1132, 3000))
    vi.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockReturnValue(rect(64, 600))
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)
    const removeListener = vi.spyOn(window, 'removeEventListener')
    const { container, unmount } = render(() => <BookmarkRibbon target={() => target} />)
    const band = container.querySelector('.ds-bookmark-ribbon-band') as HTMLElement
    expect(Number(band.style.getPropertyValue('--ribbon-progress'))).toBeCloseTo(0.5)
    unmount()
    expect(removeListener).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
})

describe('book return', () => {
  afterEach(() => vi.restoreAllMocks())

  it('marks shelf books with their slug', () => {
    const { container } = render(() => <PostCard title="Shelf" description="" category="Tech" date="" readingTime="" slug="shelf-book" />)
    expect((container.querySelector('.post-book-stage') as HTMLElement).dataset.bookSlug).toBe('shelf-book')
  })

  it('returns to the remembered shelf page only for the same article', () => {
    remember('first', '/posts', '?page=2')
    expect(bookReturnHref('first', '/posts')).toBe('/posts?page=2')
    expect(bookReturnHref('other', '/posts')).toBe('/posts')
    remember('home', '/')
    expect(bookReturnHref('home', '/posts')).toBe('/posts')
  })

  it('navigates directly when animations are unavailable', async () => {
    const navigate = vi.fn()
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    await transitionArticleToBook({ slug: 'first', href: '/posts?page=2', label: 'Back', navigate })
    expect(navigate).toHaveBeenCalledWith('/posts?page=2')
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
    expect(document.querySelector('.book-transition-overlay')).toBeNull()
  })
})
