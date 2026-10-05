import { createSignal, Show, type JSX } from 'solid-js'
import './resizable-split.css'

export interface ResizableSplitProps {
  readonly left: JSX.Element
  readonly right: JSX.Element
  readonly ratio?: number
  readonly onRatioChange?: (ratio: number) => void
  readonly snapThreshold?: number
  readonly leftLabel?: string
  readonly rightLabel?: string
  readonly gutterLabel?: string
  readonly collapsedLeftTitle?: string
  readonly collapsedRightTitle?: string
  readonly defaultTitle?: string
  readonly class?: string
}

export function ResizableSplit(props: ResizableSplitProps) {
  let containerRef: HTMLDivElement | undefined
  const [internalRatio, setInternalRatio] = createSignal(props.ratio ?? 50)
  const [isDragging, setIsDragging] = createSignal(false)

  const currentRatio = () => props.ratio !== undefined ? props.ratio : internalRatio()
  const snapThreshold = () => props.snapThreshold ?? 12

  const isCollapsedLeft = () => currentRatio() <= snapThreshold()
  const isCollapsedRight = () => currentRatio() >= 100 - snapThreshold()

  const setRatio = (newRatio: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newRatio)))
    let finalRatio = clamped
    if (clamped <= snapThreshold()) finalRatio = 0
    else if (clamped >= 100 - snapThreshold()) finalRatio = 100

    setInternalRatio(finalRatio)
    props.onRatioChange?.(finalRatio)
  }

  const handlePointerDown = (e: PointerEvent) => {
    e.preventDefault()
    setIsDragging(true)
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!containerRef) return
      const rect = containerRef.getBoundingClientRect()
      if (rect.width <= 0) return
      const rawRatio = ((moveEvent.clientX - rect.left) / rect.width) * 100
      setRatio(rawRatio)
    }

    const onPointerUp = (upEvent: PointerEvent) => {
      setIsDragging(false)
      try {
        target.releasePointerCapture(upEvent.pointerId)
      } catch {
        // Pointer capture release safety
      }
      target.removeEventListener('pointermove', onPointerMove)
      target.removeEventListener('pointerup', onPointerUp)
      target.removeEventListener('pointercancel', onPointerUp)
    }

    target.addEventListener('pointermove', onPointerMove)
    target.addEventListener('pointerup', onPointerUp)
    target.addEventListener('pointercancel', onPointerUp)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setRatio(Math.max(0, currentRatio() - 5))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setRatio(Math.min(100, currentRatio() + 5))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setRatio(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setRatio(100)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setRatio(50)
    }
  }

  const handleDoubleClick = () => {
    setRatio(50)
  }

  return (
    <div
      ref={containerRef}
      class={`resizable-split-container ${isDragging() ? 'dragging-active' : ''} ${props.class ?? ''}`}
    >
      <div
        class={`resizable-pane-left ${isCollapsedLeft() ? 'resizable-pane-collapsed' : ''}`}
        style={{
          width: isCollapsedRight() ? 'calc(100% - 24px)' : isCollapsedLeft() ? '0%' : `calc(${currentRatio()}% - 10px)`,
        }}
        aria-hidden={isCollapsedLeft()}
      >
        {props.left}
      </div>

      <div
        role="separator"
        tabindex={0}
        aria-orientation="vertical"
        aria-valuenow={Math.round(currentRatio())}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={props.gutterLabel ?? 'Adjust split proportion between editor and preview'}
        class={`resizable-gutter ${isDragging() ? 'dragging' : ''} ${isCollapsedLeft() || isCollapsedRight() ? 'at-edge' : ''}`}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        onDblClick={handleDoubleClick}
        title={
          isCollapsedLeft()
            ? (props.collapsedLeftTitle ?? 'Editor collapsed. Drag right or double click for 50/50')
            : isCollapsedRight()
              ? (props.collapsedRightTitle ?? 'Preview collapsed. Drag left or double click for 50/50')
              : (props.defaultTitle ?? 'Drag to resize. Double click for 50/50')
        }
      >
        <div class="resizable-gutter-line" />
        <div class="resizable-gutter-handle">
          <Show when={isCollapsedLeft()} fallback={<Show when={isCollapsedRight()} fallback="⋮">←</Show>}>
            →
          </Show>
        </div>
      </div>

      <div
        class={`resizable-pane-right ${isCollapsedRight() ? 'resizable-pane-collapsed' : ''}`}
        style={{
          width: isCollapsedLeft() ? 'calc(100% - 24px)' : isCollapsedRight() ? '0%' : `calc(${100 - currentRatio()}% - 10px)`,
        }}
        aria-hidden={isCollapsedRight()}
      >
        {props.right}
      </div>
    </div>
  )
}
