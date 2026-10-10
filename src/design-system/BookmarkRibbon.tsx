import { Show, createSignal, onCleanup, onMount } from 'solid-js'
import { clamp, observeSize, registerScrollScene, requestSceneFrame } from './scrollScene'
import './bookmark-ribbon.css'

export interface BookmarkRibbonProps {
  readonly target?: () => HTMLElement | undefined
  readonly progress?: number
  readonly threshold?: number
  readonly tooltipLabel?: (percent: number) => string
  readonly ariaLabel?: (percent: number) => string
  readonly onPullToTop?: () => void
}

export function readingProgress(target: DOMRect, top: number, viewportHeight: number): number {
  const distance = target.height - viewportHeight + top
  return distance > 0 ? clamp((top - target.top) / distance) : 1
}

export function BookmarkRibbon(props: BookmarkRibbonProps) {
  let frame!: HTMLDivElement
  let band!: HTMLDivElement
  let current = -1
  let next = 0
  const [isPulling, setIsPulling] = createSignal(false)
  const [currentProgress, setCurrentProgress] = createSignal(props.progress ?? 0)

  onMount(() => {
    if (props.progress !== undefined) return
    const target = props.target?.()
    if (!target) return
    const unregister = registerScrollScene({
      measure: () => {
        next = readingProgress(target.getBoundingClientRect(), frame.getBoundingClientRect().top, innerHeight)
      },
      render: () => {
        if (Math.abs(next - current) < 0.001) return
        current = next
        setCurrentProgress(current)
        band.style.setProperty('--ribbon-progress', current.toFixed(4))
      },
    })
    const unobserve = observeSize([target], requestSceneFrame)
    onCleanup(() => {
      unobserve()
      unregister()
    })
  })

  const hasScrolled = () => currentProgress() >= (props.threshold ?? 0.05)

  let pullTimer: ReturnType<typeof setTimeout> | undefined

  onCleanup(() => {
    if (pullTimer) clearTimeout(pullTimer)
  })

  const handlePull = (e: MouseEvent) => {
    e.stopPropagation()
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!prefersReducedMotion) {
      if (pullTimer) clearTimeout(pullTimer)
      setIsPulling(false)
      requestAnimationFrame(() => setIsPulling(true))
      pullTimer = setTimeout(() => setIsPulling(false), 450)
    }

    if (hasScrolled()) {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
      props.onPullToTop?.()
    }
  }

  const isInteractive = () => props.progress === undefined
  const percentCurrent = () => Math.round(currentProgress() * 100)

  const resolveAriaLabel = () => {
    if (!hasScrolled()) return 'Top of article'
    return props.ariaLabel ? props.ariaLabel(percentCurrent()) : `Back to top · ${percentCurrent()}% read`
  }

  return (
    <div
      ref={frame}
      class="ds-bookmark-ribbon"
      classList={{
        'ds-bookmark-ribbon-static': props.progress !== undefined,
        'ds-bookmark-ribbon-interactive': isInteractive(),
        'ds-bookmark-ribbon-scrolled': hasScrolled(),
      }}
      aria-hidden={isInteractive() ? undefined : 'true'}
    >
      <button
        type="button"
        class="ds-bookmark-ribbon-trigger"
        classList={{ 'ds-bookmark-ribbon-pull': isPulling() }}
        disabled={!isInteractive()}
        onClick={handlePull}
        aria-label={resolveAriaLabel()}
      >
        <div
          ref={band}
          class="ds-bookmark-ribbon-band"
          style={props.progress !== undefined ? { '--ribbon-progress': String(clamp(props.progress)) } : undefined}
        />
        <Show when={hasScrolled()}>
          <span class="ds-bookmark-ribbon-tooltip" role="tooltip" aria-hidden="true">
            {props.tooltipLabel ? props.tooltipLabel(percentCurrent()) : `Back to top · ${percentCurrent()}%`}
          </span>
        </Show>
      </button>
    </div>
  )
}
