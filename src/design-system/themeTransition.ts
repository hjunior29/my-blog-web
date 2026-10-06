import { easeInOutCubic } from './scrollScene'
import './theme-transition.css'

const DURATION_MS = 720
const STEPS = 30
const TILT = 0.35
const NORM = Math.hypot(1, TILT)
const DX = -1 / NORM
const DY = TILT / NORM

export type FoldPoint = readonly [number, number]

export const foldReach = (width: number, height: number): number => (width + TILT * height) / NORM

export function foldPolygon(fold: number, width: number, height: number): FoldPoint[] {
  const toBottomRight = height * DY
  const toTopLeft = -width * DX
  const end: FoldPoint = fold <= toBottomRight ? [width, fold / DY] : [Math.max(0, width + (fold - toBottomRight) / DX), height]
  const start: FoldPoint = fold <= toTopLeft ? [width + fold / DX, 0] : [0, Math.min(height, (fold - toTopLeft) / DY)]
  return [start, fold >= toTopLeft ? [0, 0] : start, [width, 0], fold >= toBottomRight ? [width, height] : end, end]
}

let activeFlap: HTMLElement | undefined

const prefersReducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

export function turnThemePage(trigger: HTMLElement | undefined, apply: () => void): void {
  if (typeof document.startViewTransition !== 'function' || prefersReducedMotion()) {
    apply()
    return
  }
  const root = document.documentElement
  const width = innerWidth
  const height = innerHeight
  const rect = trigger?.getBoundingClientRect()
  const flipX = !!rect && rect.left + rect.width / 2 < width / 2
  const flipY = !!rect && rect.top + rect.height / 2 > height / 2
  const dx = flipX ? -DX : DX
  const dy = flipY ? -DY : DY
  const cornerProjection = (flipX ? 0 : width) * dx + (flipY ? height : 0) * dy
  const reach = foldReach(width, height)
  const place = ([x, y]: FoldPoint) => `${(flipX ? width - x : x).toFixed(1)}px ${(flipY ? height - y : y).toFixed(1)}px`
  const styles = getComputedStyle(root)
  const flap = document.createElement('div')
  flap.className = 'theme-turn-flap'
  flap.setAttribute('aria-hidden', 'true')
  flap.style.background = `linear-gradient(${Math.atan2(dx, -dy) * 180 / Math.PI}deg, ${styles.getPropertyValue('--sheet-back')} 0px, ${styles.getPropertyValue('--sheet-fold')} ${reach}px)`
  activeFlap?.remove()
  activeFlap = flap
  root.classList.add('theme-turning')
  root.style.setProperty('--theme-turn-shadow', styles.getPropertyValue('--sheet-shadow'))
  const transition = document.startViewTransition(() => {
    apply()
    document.body.append(flap)
  })
  let animations: Animation[] = []
  transition.ready.then(() => {
    const pageFrames: Keyframe[] = []
    const flapFrames: Keyframe[] = []
    for (let step = 0; step <= STEPS; step++) {
      const offset = step / STEPS
      const fold = reach * easeInOutCubic(offset)
      const clipPath = `polygon(${foldPolygon(fold, width, height).map(place).join(', ')})`
      const shift = 2 * (fold + cornerProjection)
      pageFrames.push({ offset, clipPath })
      flapFrames.push({ offset, clipPath, transform: `matrix(${1 - 2 * dx * dx}, ${-2 * dx * dy}, ${-2 * dx * dy}, ${1 - 2 * dy * dy}, ${shift * dx}, ${shift * dy})` })
    }
    const timing: KeyframeAnimationOptions = { duration: DURATION_MS, easing: 'linear', fill: 'both' }
    animations = [
      root.animate(pageFrames, { ...timing, pseudoElement: '::view-transition-new(root)' }),
      root.animate(flapFrames, { ...timing, pseudoElement: '::view-transition-new(theme-flap)' }),
    ]
  }).catch(() => {})
  transition.finished.finally(() => {
    animations.forEach(animation => animation.cancel())
    flap.remove()
    if (activeFlap !== flap) return
    activeFlap = undefined
    root.classList.remove('theme-turning')
    root.style.removeProperty('--theme-turn-shadow')
  })
}
