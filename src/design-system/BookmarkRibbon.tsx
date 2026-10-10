import { Show, createSignal, onCleanup, onMount } from 'solid-js'
import { clamp, observeSize, registerScrollScene, requestSceneFrame } from './scrollScene'
import { Icon } from './Icon'
import './bookmark-ribbon.css'

export interface BookmarkRibbonProps {
  readonly target?: () => HTMLElement | undefined
  readonly progress?: number
  readonly interactive?: boolean
  readonly savedProgress?: number
  readonly onBookmark?: (progress: number) => void
  readonly onJumpToSaved?: () => void
  readonly onClearBookmark?: () => void
  readonly ariaLabel?: (percent: number) => string
  readonly jumpActionLabel?: (percent: number) => string
  readonly updateActionLabel?: (percent: number) => string
  readonly clearActionLabel?: string
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
  const [isTugging, setIsTugging] = createSignal(false)
  const [isMenuOpen, setIsMenuOpen] = createSignal(false)
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

    const handleWindowClick = (event: MouseEvent) => {
      if (isMenuOpen() && !frame.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen()) {
        setIsMenuOpen(false)
      }
    }
    window.addEventListener('click', handleWindowClick)
    window.addEventListener('keydown', handleKeyDown)

    onCleanup(() => {
      unobserve()
      unregister()
      window.removeEventListener('click', handleWindowClick)
      window.removeEventListener('keydown', handleKeyDown)
    })
  })

  const triggerTug = () => {
    setIsTugging(true)
    setTimeout(() => setIsTugging(false), 450)
  }

  const handleClick = (e: MouseEvent) => {
    if (!props.interactive && !props.onBookmark) return
    e.stopPropagation()

    if (props.savedProgress !== undefined && Math.abs(currentProgress() - props.savedProgress) > 0.04) {
      setIsMenuOpen(!isMenuOpen())
      return
    }

    triggerTug()
    setIsMenuOpen(false)
    props.onBookmark?.(currentProgress())
  }

  const handleSaveHere = (e: MouseEvent) => {
    e.stopPropagation()
    triggerTug()
    setIsMenuOpen(false)
    props.onBookmark?.(currentProgress())
  }

  const handleJump = (e: MouseEvent) => {
    e.stopPropagation()
    triggerTug()
    setIsMenuOpen(false)
    props.onJumpToSaved?.()
  }

  const handleClear = (e: MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen(false)
    props.onClearBookmark?.()
  }

  const isInteractive = () => Boolean(props.interactive || props.onBookmark)
  const percentCurrent = () => Math.round(currentProgress() * 100)
  const percentSaved = () => Math.round((props.savedProgress ?? 0) * 100)

  return (
    <div
      ref={frame}
      class="ds-bookmark-ribbon"
      classList={{
        'ds-bookmark-ribbon-static': props.progress !== undefined,
        'ds-bookmark-ribbon-interactive': isInteractive(),
      }}
      aria-hidden={isInteractive() ? undefined : 'true'}
    >
      <button
        type="button"
        class="ds-bookmark-ribbon-trigger"
        disabled={!isInteractive()}
        onClick={handleClick}
        aria-label={props.ariaLabel ? props.ariaLabel(percentCurrent()) : `Reading bookmark: ${percentCurrent()}%`}
      >
        <div
          ref={band}
          class="ds-bookmark-ribbon-band"
          classList={{ 'ds-bookmark-ribbon-tug': isTugging() }}
          style={props.progress !== undefined ? { '--ribbon-progress': String(clamp(props.progress)) } : undefined}
        >
          <Show when={props.savedProgress !== undefined}>
            <span
              class="ds-bookmark-ribbon-pin"
              style={{ '--saved-progress': String(clamp(props.savedProgress!)) }}
              aria-hidden="true"
            />
          </Show>
        </div>
      </button>

      <Show when={isMenuOpen()}>
        <div class="ds-bookmark-menu" role="menu">
          <button type="button" class="ds-bookmark-menu-item" onClick={handleSaveHere}>
            <Icon name="bookmark" size={14} />
            <span>{props.updateActionLabel ? props.updateActionLabel(percentCurrent()) : `Save here (${percentCurrent()}%)`}</span>
          </button>
          <Show when={props.savedProgress !== undefined && props.onJumpToSaved}>
            <button type="button" class="ds-bookmark-menu-item" onClick={handleJump}>
              <Icon name="arrowLeft" size={14} />
              <span>{props.jumpActionLabel ? props.jumpActionLabel(percentSaved()) : `Jump to saved (${percentSaved()}%)`}</span>
            </button>
          </Show>
          <Show when={props.savedProgress !== undefined && props.onClearBookmark}>
            <button type="button" class="ds-bookmark-menu-item danger" onClick={handleClear}>
              <Icon name="close" size={14} />
              <span>{props.clearActionLabel ?? 'Remove bookmark'}</span>
            </button>
          </Show>
        </div>
      </Show>
    </div>
  )
}
