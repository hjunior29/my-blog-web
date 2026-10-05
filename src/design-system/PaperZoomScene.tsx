import { createEffect, onCleanup, type JSX } from 'solid-js'
import { Icon } from './Icon'
import {
  clamp, clearInlineStyles, createReducedMotion, easeInOutCubic, easeOutCubic, lerp, observeSize,
  registerScrollScene, requestSceneFrame, scrollToPinned, segment, setPhase, stickyOffset,
} from './scrollScene'
import './paper.css'
import './paper-zoom-scene.css'

export interface PaperZoomSceneProps {
  readonly intro: JSX.Element
  readonly children: JSX.Element
  readonly label: string
  readonly mark?: string
  readonly static?: boolean
  readonly class?: string
}

interface PaperMetrics {
  width: number
  sheetWidth: number
  height: number
  top: number
  entry: number
  readStart: number
  read: number
  exitStart: number
  exit: number
  distance: number
  portraitX: number
  portraitY: number
}

export interface SheetPose {
  readonly x: number
  readonly y: number
  readonly rotate: number
  readonly tiltX: number
  readonly tiltY: number
  readonly scale: number
  readonly shapeX: number
  readonly shapeY: number
}

const START_SCALE = 0.34
const PORTRAIT_RATIO = 0.82

export type PaperSheetFrame = Pick<PaperMetrics, 'width' | 'height' | 'portraitX' | 'portraitY'>
export type PaperSheetSide = -1 | 1

export function paperSheetPose(progress: number, m: PaperSheetFrame, side: PaperSheetSide, morph = true): SheetPose {
  const scale = lerp(START_SCALE, 1, easeInOutCubic(segment(progress, 0.12, 1)))
  const shape = morph ? easeInOutCubic(segment(progress, 0.42, 1)) : 0
  const shapeX = lerp(m.portraitX, 1, shape)
  const shapeY = lerp(m.portraitY, 1, shape)
  const travel = easeOutCubic(segment(progress, 0, 0.62))
  const settle = easeOutCubic(segment(progress, 0, 0.8))
  return {
    x: lerp(side * m.width * 0.74, 0, travel),
    y: lerp(m.height * 0.94, (m.height - m.height * shapeY * scale) / 2, travel),
    rotate: lerp(side * -16, 0, settle),
    tiltX: lerp(26, 0, settle),
    tiltY: lerp(side * -30, 0, settle),
    scale,
    shapeX,
    shapeY,
  }
}

const poseTransform = (pose: SheetPose, extraRotate = 0) =>
  `translate3d(${pose.x}px, ${pose.y}px, 0) rotateX(${pose.tiltX}deg) rotateY(${pose.tiltY}deg) rotate(${pose.rotate + extraRotate}deg) scale(${pose.scale * pose.shapeX}, ${pose.scale * pose.shapeY})`

const offsetWithin = (target: HTMLElement, container: HTMLElement) => {
  let top = 0
  for (let node: HTMLElement | null = target; node && node !== container; node = node.offsetParent as HTMLElement | null) top += node.offsetTop
  return top
}

export function PaperZoomScene(props: PaperZoomSceneProps) {
  let root!: HTMLDivElement
  let stage!: HTMLDivElement
  let intro!: HTMLDivElement
  let backSheet!: HTMLDivElement
  let sheet!: HTMLDivElement
  let frame!: HTMLDivElement
  let content!: HTMLElement
  const reduced = createReducedMotion()
  const animated = () => !props.static && !reduced()

  createEffect(() => {
    if (!animated()) return
    const m = {} as PaperMetrics
    let rectTop = 0
    let lastPinned = -1
    let offset = 0

    const measureLayout = () => {
      const width = stage.clientWidth
      const sheetWidth = sheet.offsetWidth
      const height = stage.clientHeight
      const entry = height * 1.1
      const readStart = entry + height * 0.15
      const read = Math.max(0, content.offsetHeight - height)
      const exitStart = readStart + read + height * 0.1
      const wide = sheetWidth / height > PORTRAIT_RATIO
      Object.assign(m, {
        width, sheetWidth, height, top: stickyOffset(stage), entry, readStart, read, exitStart, exit: height,
        distance: exitStart + height,
        portraitX: wide ? (height * PORTRAIT_RATIO) / sheetWidth : 1,
        portraitY: wide ? 1 : sheetWidth / PORTRAIT_RATIO / height,
      })
      root.style.height = `${height + m.distance}px`
      root.style.setProperty('--paper-scene-overlap', `${m.exit}px`)
      lastPinned = -1
    }

    const renderIntro = (entry: number) => {
      const fade = segment(entry, 0.18, 0.7)
      const recede = easeOutCubic(segment(entry, 0, 0.9))
      intro.style.opacity = fade ? String(1 - fade) : ''
      intro.style.transform = recede ? `translate3d(0, ${-m.height * 0.04 * recede}px, 0) scale(${1 - 0.06 * recede})` : ''
    }

    const renderSheet = (progress: number, side: PaperSheetSide) => {
      if (progress >= 1) {
        sheet.style.transform = 'none'
        frame.style.transform = ''
        backSheet.style.visibility = 'hidden'
        return
      }
      const pose = paperSheetPose(progress, m, side)
      sheet.style.transform = poseTransform(pose)
      frame.style.transform = `scale(${1 / pose.shapeX}, ${1 / pose.shapeY})`
      const trail = paperSheetPose(0.88 * segment(progress, 0.04, 1), m, side, false)
      backSheet.style.visibility = 'visible'
      backSheet.style.transform = poseTransform({ ...trail, x: trail.x + side * m.width * 0.035 * trail.scale }, side * lerp(24, 7, progress))
    }

    const render = () => {
      const pinned = clamp(m.top - rectTop, 0, m.distance)
      if (!m.height || pinned === lastPinned) return
      lastPinned = pinned
      const entry = segment(pinned, 0, m.entry)
      const exit = segment(pinned, m.exitStart, m.exitStart + m.exit)
      const progress = exit > 0 ? 1 - exit : entry
      offset = m.read * segment(pinned, m.readStart, m.readStart + m.read)
      setPhase(root, 'phase', progress >= 1 ? 'reading' : exit >= 1 ? 'done' : exit > 0 ? 'outro' : 'intro')
      renderIntro(entry)
      renderSheet(progress, exit > 0 ? 1 : -1)
      content.style.transform = offset ? `translate3d(0, ${-offset}px, 0)` : ''
    }

    const revealIntro = () => {
      if (lastPinned > 0) scrollToPinned(root, m.top, 0)
    }

    const revealFocus = (event: FocusEvent) => {
      const top = offsetWithin(event.target as HTMLElement, content)
      const visible = root.dataset.phase === 'reading' && top - offset > 0 && top - offset < m.height * 0.8
      if (!visible) scrollToPinned(root, m.top, m.readStart + clamp(top - m.height * 0.4, 0, m.read))
    }

    measureLayout()
    const stopScene = registerScrollScene({ measure: () => { rectTop = root.getBoundingClientRect().top }, render })
    const stopResize = observeSize([stage, content], () => { measureLayout(); requestSceneFrame() })
    sheet.addEventListener('focusin', revealFocus)
    intro.addEventListener('focusin', revealIntro)

    onCleanup(() => {
      stopScene()
      stopResize()
      sheet.removeEventListener('focusin', revealFocus)
      intro.removeEventListener('focusin', revealIntro)
      clearInlineStyles([root, intro, backSheet, sheet, frame, content])
      delete root.dataset.phase
    })
  })

  return (
    <div ref={root} class={`paper-scene ${props.class ?? ''}`} data-mode={animated() ? 'animated' : 'static'}>
      <div ref={stage} class="paper-scene-stage">
        <div ref={intro} class="paper-scene-intro">{props.intro}</div>
        <div ref={backSheet} class="paper-scene-backsheet" aria-hidden="true" />
        <div ref={sheet} class="paper-scene-sheet">
          <div ref={frame} class="paper-scene-frame">
            <section ref={content} class="paper-scene-content ds-paper" aria-label={props.label}>
              <div class="paper-scene-column">
                <header class="paper-scene-masthead" aria-hidden="true">
                  <div class="paper-scene-brand">
                    <span class="paper-scene-mark">{props.mark ?? 'h.'}</span>
                    <Icon name="asterisk" size={48} class="paper-scene-asterisk" />
                  </div>
                </header>
                {props.children}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
