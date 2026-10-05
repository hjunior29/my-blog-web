import { describe, it, expect, vi, afterEach } from 'vitest'
import { foldPolygon, foldReach, turnThemePage } from './themeTransition'

const mockReducedMotion = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn().mockReturnValue({ matches }) })
}

const projection = ([x, y]: readonly [number, number], width: number) => {
  const norm = Math.hypot(1, 0.35)
  return (x - width) * (-1 / norm) + y * (0.35 / norm)
}

describe('foldPolygon', () => {
  it('starts collapsed at the corner and ends covering the page', () => {
    expect(foldPolygon(0, 1280, 800).every(([x, y]) => x === 1280 && y === 0)).toBe(true)
    expect(foldPolygon(foldReach(1280, 800), 1280, 800).map(([x, y]) => [Math.round(x), Math.round(y)])).toEqual([[0, 800], [0, 0], [1280, 0], [1280, 800], [0, 800]])
  })

  it('keeps five vertices with both fold ends on the fold line', () => {
    for (const fold of [40, 300, 900, 1400]) {
      const polygon = foldPolygon(fold, 1280, 800)
      expect(polygon).toHaveLength(5)
      expect(projection(polygon[0]!, 1280)).toBeCloseTo(fold)
      expect(projection(polygon[4]!, 1280)).toBeCloseTo(fold)
      polygon.forEach(([x, y]) => {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(800)
      })
    }
  })
})

describe('turnThemePage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    Reflect.deleteProperty(document, 'startViewTransition')
    document.documentElement.className = ''
  })

  it('applies instantly without View Transitions support', () => {
    mockReducedMotion(false)
    const apply = vi.fn()
    turnThemePage(undefined, apply)
    expect(apply).toHaveBeenCalledOnce()
  })

  it('applies instantly when motion is reduced', () => {
    mockReducedMotion(true)
    const start = vi.fn()
    Object.defineProperty(document, 'startViewTransition', { configurable: true, value: start })
    const apply = vi.fn()
    turnThemePage(undefined, apply)
    expect(apply).toHaveBeenCalledOnce()
    expect(start).not.toHaveBeenCalled()
  })

  it('turns the page with a temporary flap and cleans up after the transition', async () => {
    mockReducedMotion(false)
    let finish!: () => void
    const finished = new Promise<void>(resolve => { finish = resolve })
    const animation = { cancel: vi.fn() }
    const animate = vi.fn().mockReturnValue(animation)
    Object.defineProperty(document.documentElement, 'animate', { configurable: true, value: animate })
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: (update: () => void) => { update(); return { ready: Promise.resolve(), finished } },
    })
    const apply = vi.fn()
    turnThemePage(document.body, apply)
    expect(apply).toHaveBeenCalledOnce()
    expect(document.documentElement.classList.contains('theme-turning')).toBe(true)
    expect(document.querySelector('.theme-turn-flap')?.getAttribute('aria-hidden')).toBe('true')
    await Promise.resolve()
    expect(animate.mock.calls.map(([, options]) => options.pseudoElement)).toEqual(['::view-transition-new(root)', '::view-transition-new(theme-flap)'])
    finish()
    await finished
    await Promise.resolve()
    expect(animation.cancel).toHaveBeenCalledTimes(2)
    expect(document.querySelector('.theme-turn-flap')).toBeNull()
    expect(document.documentElement.classList.contains('theme-turning')).toBe(false)
    Reflect.deleteProperty(document.documentElement, 'animate')
  })
})
