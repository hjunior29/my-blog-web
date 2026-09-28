import { createSignal, onMount, onCleanup, Show } from 'solid-js'
import { NotebookArt } from './NotebookArt'
import { Icon } from './Icon'
import './editorial-scene.css'

export interface EditorialSceneProps {
  readonly variant?: 'hero' | 'workshop'
  readonly motionLabel?: string
  readonly workshopTitle?: string
  readonly workshopText?: string
}

export function EditorialScene(props: EditorialSceneProps) {
  let containerRef: HTMLDivElement | undefined
  const [isInView, setIsInView] = createSignal(true)

  onMount(() => {
    if (typeof window === 'undefined') return

    const handleVisibility = () => {
      if (document.hidden) {
        setIsInView(false)
      } else {
        setIsInView(true)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    let observer: IntersectionObserver | undefined
    if (typeof IntersectionObserver !== 'undefined' && containerRef) {
      observer = new IntersectionObserver(([entry]) => {
        setIsInView(entry.isIntersecting)
      }, { threshold: 0.1 })
      observer.observe(containerRef)
    }

    onCleanup(() => {
      document.removeEventListener('visibilitychange', handleVisibility)
      if (observer) {
        observer.disconnect()
      }
    })
  })

  return (
    <div
      ref={containerRef}
      class={`editorial-scene ${props.variant === 'workshop' ? 'scene-workshop' : 'scene-hero'}`}
      data-in-view={isInView()}
    >
      <Show when={props.variant === 'workshop'} fallback={
        <NotebookArt
          compact={false}
          motionLabel={props.motionLabel ?? 'Pause animations'}
        />
      }>
        <div class="workshop-stage" aria-hidden="true">
          <div class="workshop-folio-stack">
            <div class="workshop-sheet sheet-1" />
            <div class="workshop-sheet sheet-2" />
            <div class="workshop-sheet sheet-3">
              <div class="workshop-sheet-header">
                <span>VOL. 01</span>
                <span>2026</span>
              </div>
              <div class="workshop-sheet-lines">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div class="workshop-sheet-footer">
                <span>helder.</span>
                <Icon name="asterisk" size={16} />
              </div>
            </div>
          </div>
        </div>

        <Show when={props.workshopTitle}>
          <div class="workshop-copy">
            <h3 class="serif">{props.workshopTitle}</h3>
            <Show when={props.workshopText}>
              <p>{props.workshopText}</p>
            </Show>
          </div>
        </Show>
      </Show>
    </div>
  )
}
