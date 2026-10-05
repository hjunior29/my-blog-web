import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@solidjs/testing-library'
import { clamp, easeInOutCubic, easeOutCubic, lerp, segment } from './scrollScene'
import { PaperZoomScene, paperSheetPose } from './PaperZoomScene'
import { LetterScene, letterTimeline } from './LetterScene'

const mockReducedMotion = (reduced: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: reduced && query.includes('reduce'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
}

const renderPaper = (staticMode = false) => render(() => (
  <PaperZoomScene label="Notes & Ideas" static={staticMode} intro={<h1>Hero title</h1>}>
    <h2>Notebook heading</h2>
  </PaperZoomScene>
))

const renderLetter = (staticMode = false) => render(() => (
  <LetterScene
    label="Letter to the reader"
    recipientLabel="To"
    recipient="You, who read this far"
    sender="helder."
    postmark="São Paulo · 2026"
    foldedLabel="Letter no. 01"
    static={staticMode}
    heading={<h2>Letter heading</h2>}
    opening={<p>Opening line</p>}
    body={<p>Body paragraph</p>}
    closing={<a href="/about">Learn more</a>}
  />
))

describe('scroll scene math', () => {
  it('clamps, interpolates and maps ranges', () => {
    expect(clamp(1.4)).toBe(1)
    expect(clamp(-2)).toBe(0)
    expect(lerp(10, 20, 0.5)).toBe(15)
    expect(segment(5, 0, 10)).toBe(0.5)
    expect(segment(12, 0, 10)).toBe(1)
    expect(segment(3, 4, 4)).toBe(0)
    expect(segment(4, 4, 4)).toBe(1)
  })

  it('keeps easing endpoints stable', () => {
    for (const ease of [easeOutCubic, easeInOutCubic]) {
      expect(ease(0)).toBe(0)
      expect(ease(1)).toBe(1)
    }
  })

  it('lands the paper sheet exactly in place from either side', () => {
    const frame = { width: 1440, height: 820, portraitX: 0.47, portraitY: 1 }
    for (const side of [-1, 1] as const) {
      expect(paperSheetPose(1, frame, side)).toMatchObject({ x: 0, y: 0, rotate: 0, tiltX: 0, tiltY: 0, scale: 1, shapeX: 1, shapeY: 1 })
    }
  })

  it('enters off screen from the lower left and leaves toward the lower right', () => {
    const frame = { width: 1440, height: 820, portraitX: 0.47, portraitY: 1 }
    const entry = paperSheetPose(0, frame, -1)
    const exit = paperSheetPose(0, frame, 1)
    expect(entry.x).toBeLessThan(-frame.width / 2)
    expect(exit.x).toBeGreaterThan(frame.width / 2)
    expect(entry.y).toBeGreaterThan(frame.height / 2)
    expect(entry.rotate).toBe(-exit.rotate)
    expect(entry.scale).toBeLessThan(0.5)
    expect(entry.shapeX).toBe(frame.portraitX)
  })

  it('orders the letter timeline from envelope to unfolded letter', () => {
    const t = letterTimeline
    expect(t.flip[1]).toBeLessThanOrEqual(t.seal[0])
    expect(t.flap[1]).toBeLessThanOrEqual(t.rise[1])
    expect(t.rise[1]).toBeLessThanOrEqual(t.settle[0])
    expect(t.unfoldTop[0]).toBeLessThan(t.unfoldBottom[0])
    expect(t.unfoldBottom[1]).toBeLessThanOrEqual(t.reading)
    expect(t.reading).toBeLessThan(t.end)
  })
})

describe('PaperZoomScene component', () => {
  beforeEach(() => mockReducedMotion(false))
  afterEach(() => vi.restoreAllMocks())

  it('renders the intro and a labelled paper section with decorative chrome hidden', () => {
    const { container, getByRole } = renderPaper()
    expect(getByRole('heading', { level: 1, name: 'Hero title' })).not.toBeNull()
    expect(getByRole('region', { name: 'Notes & Ideas' }).querySelector('h2')?.textContent).toBe('Notebook heading')
    expect(container.querySelector('.paper-scene-masthead')?.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelector('.paper-scene-backsheet')?.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelector('.paper-scene')?.getAttribute('data-mode')).toBe('animated')
  })

  it('falls back to a static layout when motion is reduced', () => {
    mockReducedMotion(true)
    const { container } = renderPaper()
    const scene = container.querySelector('.paper-scene') as HTMLElement
    expect(scene.dataset.mode).toBe('static')
    expect(scene.style.height).toBe('')
  })

  it('stops listening to scroll when unmounted', () => {
    const removeListener = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderPaper()
    unmount()
    expect(removeListener).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
})

describe('LetterScene component', () => {
  beforeEach(() => mockReducedMotion(false))
  afterEach(() => vi.restoreAllMocks())

  it('exposes the letter content and hides the envelope artwork', () => {
    const { container, getByRole, getByText } = renderLetter()
    const letter = getByRole('article', { name: 'Letter to the reader' })
    expect(letter.textContent).toContain('Opening line')
    expect(letter.textContent).toContain('Body paragraph')
    expect(getByText('Learn more').getAttribute('href')).toBe('/about')
    const decorative = container.querySelectorAll('.letter-envelope-part, .letter-face-back')
    expect(decorative.length).toBe(7)
    decorative.forEach((part) => expect(part.getAttribute('aria-hidden')).toBe('true'))
  })

  it('renders flat and unfolded in static mode', () => {
    const { container, getByRole } = renderLetter(true)
    const scene = container.querySelector('.letter-scene') as HTMLElement
    expect(scene.dataset.mode).toBe('static')
    expect(scene.style.height).toBe('')
    expect(getByRole('heading', { level: 2, name: 'Letter heading' })).not.toBeNull()
  })
})
