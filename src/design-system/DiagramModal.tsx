import { createSignal, createEffect, onCleanup, Show } from 'solid-js'
import { Icon } from './Icon'
import { Button } from './primitives'
import './diagram-modal.css'

export interface DiagramModalProps {
  readonly open: boolean
  readonly svgHtml: string
  readonly title?: string
  readonly onClose: () => void
  readonly labels?: {
    readonly zoomIn?: string
    readonly zoomOut?: string
    readonly resetZoom?: string
    readonly panHint?: string
    readonly close?: string
  }
}

export function DiagramModal(props: DiagramModalProps) {
  const [scale, setScale] = createSignal(1)
  const [translateX, setTranslateX] = createSignal(0)
  const [translateY, setTranslateY] = createSignal(0)
  const [isDragging, setIsDragging] = createSignal(false)

  let dragStartX = 0
  let dragStartY = 0
  let initialTranslateX = 0
  let initialTranslateY = 0

  const handleReset = () => {
    setScale(1)
    setTranslateX(0)
    setTranslateY(0)
  }

  const handleZoomIn = () => {
    setScale(s => Math.min(4, Math.round(s * 1.25 * 100) / 100))
  }

  const handleZoomOut = () => {
    setScale(s => Math.max(0.25, Math.round(s * 0.8 * 100) / 100))
  }

  createEffect(() => {
    if (props.open) {
      handleReset()
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          props.onClose()
        } else if (e.key === '+' || e.key === '=') {
          e.preventDefault()
          handleZoomIn()
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault()
          handleZoomOut()
        } else if (e.key === '0') {
          e.preventDefault()
          handleReset()
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      onCleanup(() => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleKeyDown)
      })
    }
  })

  const handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    setIsDragging(true)
    dragStartX = e.clientX
    dragStartY = e.clientY
    initialTranslateX = translateX()
    initialTranslateY = translateY()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging()) return
    const dx = e.clientX - dragStartX
    const dy = e.clientY - dragStartY
    setTranslateX(initialTranslateX + dx)
    setTranslateY(initialTranslateY + dy)
  }

  const handlePointerUp = (e: PointerEvent) => {
    if (!isDragging()) return
    setIsDragging(false)
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
    }
  }

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88
    setScale(s => {
      const next = s * zoomFactor
      return Math.min(4, Math.max(0.25, Math.round(next * 100) / 100))
    })
  }

  const zoomPercent = () => `${Math.round(scale() * 100)}%`

  return (
    <Show when={props.open}>
      <div class="diagram-modal-backdrop" role="dialog" aria-modal="true" aria-label={props.title ?? 'Diagram'}>
        <header class="diagram-modal-toolbar">
          <div class="diagram-modal-title">
            <Icon name="code" size={16} />
            <span>{props.title ?? 'Diagram'}</span>
          </div>

          <div class="diagram-modal-controls">
            <span class="diagram-modal-hint">
              {props.labels?.panHint ?? 'Drag to pan · Scroll to zoom'}
            </span>

            <div class="diagram-modal-zoom-group">
              <Button
                variant="ghost"
                size="small"
                onClick={handleZoomOut}
                aria-label={props.labels?.zoomOut ?? 'Zoom out'}
                title={props.labels?.zoomOut ?? 'Zoom out'}
              >
                <Icon name="minus" size={15} />
              </Button>

              <span class="diagram-modal-zoom-value" aria-live="polite">
                {zoomPercent()}
              </span>

              <Button
                variant="ghost"
                size="small"
                onClick={handleZoomIn}
                aria-label={props.labels?.zoomIn ?? 'Zoom in'}
                title={props.labels?.zoomIn ?? 'Zoom in'}
              >
                <Icon name="plus" size={15} />
              </Button>

              <Button
                variant="ghost"
                size="small"
                onClick={handleReset}
                aria-label={props.labels?.resetZoom ?? 'Reset zoom'}
                title={props.labels?.resetZoom ?? 'Reset zoom'}
              >
                <Icon name="reset" size={15} />
              </Button>
            </div>

            <Button
              variant="secondary"
              size="small"
              onClick={props.onClose}
              aria-label={props.labels?.close ?? 'Close'}
              class="diagram-modal-close-btn"
            >
              <Icon name="close" size={16} />
            </Button>
          </div>
        </header>

        <div
          class="diagram-modal-viewport"
          classList={{ 'is-dragging': isDragging() }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          <div
            class="diagram-modal-canvas"
            style={{
              transform: `translate3d(${translateX()}px, ${translateY()}px, 0) scale(${scale()})`,
              'transition': isDragging() ? 'none' : 'transform 0.08s ease-out',
            }}
            innerHTML={props.svgHtml}
          />
        </div>
      </div>
    </Show>
  )
}
