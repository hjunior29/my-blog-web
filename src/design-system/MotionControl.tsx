import { createSignal, onMount, onCleanup } from 'solid-js'
import { Icon } from './Icon'

const getInitialMotionPaused = (): boolean => {
  if (typeof window === 'undefined') return false
  const saved = localStorage.getItem('blog_motion_paused')
  if (saved !== null) return saved === 'true'
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
  return false
}

const [motionPaused, setMotionPausedState] = createSignal<boolean>(getInitialMotionPaused())

export const isMotionPaused = (): boolean => motionPaused()

export const setMotionPaused = (paused: boolean): void => {
  setMotionPausedState(paused)
  if (typeof window !== 'undefined') {
    localStorage.setItem('blog_motion_paused', String(paused))
    document.documentElement.setAttribute('data-motion-paused', String(paused))
  }
}

export const toggleMotion = (): void => {
  setMotionPaused(!motionPaused())
}

export interface MotionControlProps {
  readonly pauseLabel?: string
  readonly resumeLabel?: string
  readonly class?: string
}

export function MotionControl(props: MotionControlProps) {
  onMount(() => {
    document.documentElement.setAttribute('data-motion-paused', String(motionPaused()))

    if (typeof window.matchMedia === 'function') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      const handleMediaChange = (e: MediaQueryListEvent) => {
        const saved = localStorage.getItem('blog_motion_paused')
        if (saved === null) {
          setMotionPaused(e.matches)
        }
      }
      mediaQuery.addEventListener('change', handleMediaChange)
      onCleanup(() => {
        mediaQuery.removeEventListener('change', handleMediaChange)
      })
    }
  })

  const label = () => (motionPaused() ? (props.resumeLabel ?? 'Resume animations') : (props.pauseLabel ?? 'Pause animations'))

  return (
    <button
      type="button"
      class={`motion-control-button ${props.class ?? ''}`}
      aria-label={label()}
      aria-pressed={motionPaused()}
      onClick={toggleMotion}
    >
      <Icon name={motionPaused() ? 'play' : 'pause'} size={16} />
      <span class="motion-control-text">{label()}</span>
    </button>
  )
}
