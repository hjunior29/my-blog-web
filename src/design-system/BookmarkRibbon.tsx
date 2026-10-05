import { onCleanup, onMount } from 'solid-js'
import { clamp, observeSize, registerScrollScene, requestSceneFrame } from './scrollScene'
import './bookmark-ribbon.css'

export interface BookmarkRibbonProps {
  readonly target?: () => HTMLElement | undefined
  readonly progress?: number
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
  onMount(() => {
    if (props.progress !== undefined) return
    const target = props.target?.()
    if (!target) return
    const unregister = registerScrollScene({
      measure: () => { next = readingProgress(target.getBoundingClientRect(), frame.getBoundingClientRect().top, innerHeight) },
      render: () => {
        if (Math.abs(next - current) < 0.001) return
        current = next
        band.style.setProperty('--ribbon-progress', current.toFixed(4))
      },
    })
    const unobserve = observeSize([target], requestSceneFrame)
    onCleanup(() => { unobserve(); unregister() })
  })
  return (
    <div ref={frame} class="ds-bookmark-ribbon" classList={{ 'ds-bookmark-ribbon-static': props.progress !== undefined }} aria-hidden="true">
      <div ref={band} class="ds-bookmark-ribbon-band" style={props.progress !== undefined ? { '--ribbon-progress': String(clamp(props.progress)) } : undefined} />
    </div>
  )
}
