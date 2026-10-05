import { createEffect, onCleanup, Show, type JSX } from 'solid-js'
import { Icon } from './Icon'
import {
  clamp, clearInlineStyles, createReducedMotion, easeInCubic, easeInOutCubic, easeOutCubic, lerp,
  observeSize, registerScrollScene, requestSceneFrame, scrollToPinned, segment, setPhase, stickyOffset,
} from './scrollScene'
import './paper.css'
import './letter-scene.css'

export interface LetterSceneProps {
  readonly heading?: JSX.Element
  readonly opening: JSX.Element
  readonly body: JSX.Element
  readonly closing: JSX.Element
  readonly label: string
  readonly recipientLabel: string
  readonly recipient: string
  readonly sender: string
  readonly postmark: string
  readonly foldedLabel: string
  readonly mark?: string
  readonly static?: boolean
  readonly class?: string
}

interface LetterMetrics {
  height: number
  top: number
  distance: number
  envelopeScale: number
  fitScale: number
  rise: number
  baseY: number
}

export const letterTimeline = {
  flip: [1, 1.26], seal: [1.34, 1.46], flap: [1.42, 1.66], rise: [1.64, 1.94], settle: [1.94, 2.26],
  fade: [2.08, 2.28], heading: [1.55, 1.85], unfoldTop: [2.22, 2.54], unfoldBottom: [2.46, 2.78],
  flatten: [2.48, 2.9], reading: 2.9, end: 3.15,
} as const

type Range = readonly [number, number]
const at = (u: number, range: Range) => segment(u, range[0], range[1])

export function LetterScene(props: LetterSceneProps) {
  let root!: HTMLDivElement
  let stage!: HTMLDivElement
  let heading: HTMLDivElement | undefined
  let rig!: HTMLDivElement
  let front!: HTMLDivElement
  let back!: HTMLDivElement
  let flap!: HTMLDivElement
  let pocket!: HTMLDivElement
  let seal!: HTMLDivElement
  let sealLeft!: HTMLSpanElement
  let sealRight!: HTMLSpanElement
  let letter!: HTMLElement
  let topPanel!: HTMLDivElement
  let bottomPanel!: HTMLDivElement
  const reduced = createReducedMotion()
  const animated = () => !props.static && !reduced()
  const mark = () => props.mark ?? 'h.'

  createEffect(() => {
    if (!animated()) return
    const m = {} as LetterMetrics
    const envelopeParts = [front, back, flap, pocket]
    let rectTop = 0
    let lastTravel = -1

    const measureLayout = () => {
      const width = stage.clientWidth
      const height = stage.clientHeight
      const letterWidth = letter.offsetWidth
      const letterHeight = letter.offsetHeight
      const panelHeight = letterHeight / 3
      const envelopeWidth = letterWidth * 1.08
      const envelopeHeight = panelHeight + letterWidth * 0.08
      rig.style.setProperty('--envelope-width', `${envelopeWidth}px`)
      rig.style.setProperty('--envelope-height', `${envelopeHeight}px`)
      Object.assign(m, {
        height,
        top: stickyOffset(stage),
        distance: height * (letterTimeline.end - 1),
        envelopeScale: Math.min(1, (width - 40) / envelopeWidth, (height * 0.5) / envelopeHeight),
        fitScale: Math.min(1, (height - 48) / letterHeight, (width - 24) / letterWidth),
        rise: (panelHeight + envelopeHeight) / 2 + 12,
        baseY: height * 0.08,
      })
      root.style.height = `${height + m.distance}px`
      lastTravel = -1
    }

    const renderEnvelope = (u: number) => {
      const approach = easeOutCubic(segment(u, 0, 1))
      const turn = 180 * easeInOutCubic(at(u, letterTimeline.flip))
      const fall = easeInCubic(at(u, letterTimeline.settle))
      const opening = easeInOutCubic(at(u, letterTimeline.flap))
      const broken = easeOutCubic(at(u, letterTimeline.seal))
      const y = m.baseY + lerp(m.height * 0.16, 0, approach) + fall * m.height * 0.85
      const rotate = lerp(-9, -2, approach) + 3 * (turn / 180) + 9 * fall
      const base = `translate3d(0, ${y}px, 0) rotate(${rotate}deg) scale(${m.envelopeScale * lerp(0.92, 1, approach)})`
      const backSide = `${base} rotateY(${turn - 180}deg)`
      const fade = at(u, letterTimeline.fade)
      setPhase(root, 'side', turn < 90 ? 'front' : 'back')
      setPhase(root, 'flap', opening > 0.5 ? 'open' : 'closed')
      front.style.transform = `${base} rotateY(${turn}deg)`
      back.style.transform = backSide
      pocket.style.transform = backSide
      seal.style.transform = backSide
      flap.style.transform = `${backSide} translateY(-50%) rotateX(${opening * 180}deg) translateY(50%)`
      envelopeParts.forEach((part) => { part.style.opacity = fade ? String(1 - fade) : '' })
      sealLeft.style.transform = `translate3d(${-broken * 26}px, ${broken * 56}px, 0) rotate(${-broken * 32}deg)`
      sealRight.style.transform = `translate3d(${broken * 26}px, ${broken * 56}px, 0) rotate(${broken * 32}deg)`
      seal.style.opacity = String(1 - broken)
    }

    const renderLetter = (u: number) => {
      const rise = easeInOutCubic(at(u, letterTimeline.rise))
      const settle = easeInOutCubic(at(u, letterTimeline.settle))
      const tilt = 14 * settle * (1 - easeInOutCubic(at(u, letterTimeline.flatten)))
      const foldTop = 1 - easeInOutCubic(at(u, letterTimeline.unfoldTop))
      const foldBottom = 1 - easeInOutCubic(at(u, letterTimeline.unfoldBottom))
      setPhase(root, 'letter', u < letterTimeline.flip[1] ? 'hidden' : rise < 1 ? 'inside' : 'out')
      setPhase(root, 'phase', foldBottom > 0 ? 'folded' : 'open')
      const scale = lerp(m.envelopeScale, m.fitScale, settle)
      letter.style.transform = settle >= 1 && tilt === 0
        ? (scale < 1 ? `scale(${scale})` : 'none')
        : `translate3d(0, ${lerp(m.baseY, 0, settle)}px, 0) rotate(${lerp(1, 0, settle)}deg) scale(${scale}) translate3d(0, ${-lerp(rise * m.rise, 0, settle)}px, 0) rotateX(${tilt}deg)`
      topPanel.style.transform = foldTop ? `translateZ(${3 * foldTop}px) rotateX(${-180 * foldTop}deg)` : ''
      bottomPanel.style.transform = foldBottom ? `translateZ(${1.5 * foldBottom}px) rotateX(${180 * foldBottom}deg)` : ''
      topPanel.style.setProperty('--letter-shade', String(0.2 * Math.sin(Math.PI * foldTop)))
      bottomPanel.style.setProperty('--letter-shade', String(0.2 * Math.sin(Math.PI * foldBottom)))
    }

    const render = () => {
      const travel = clamp(m.top + m.height - rectTop, 0, m.height + m.distance)
      if (!m.height || travel === lastTravel) return
      lastTravel = travel
      const u = travel / m.height
      const fade = at(u, letterTimeline.heading)
      if (heading) {
        heading.style.opacity = fade ? String(1 - fade) : ''
        heading.style.transform = fade ? `translate3d(0, ${-fade * 24}px, 0)` : ''
      }
      renderEnvelope(u)
      renderLetter(u)
    }

    const revealLetter = () => {
      if (root.dataset.phase !== 'open') scrollToPinned(root, m.top, m.height * (letterTimeline.reading - 1))
    }

    measureLayout()
    const stopScene = registerScrollScene({ measure: () => { rectTop = root.getBoundingClientRect().top }, render })
    const stopResize = observeSize([stage, letter], () => { measureLayout(); requestSceneFrame() })
    letter.addEventListener('focusin', revealLetter)

    onCleanup(() => {
      stopScene()
      stopResize()
      letter.removeEventListener('focusin', revealLetter)
      clearInlineStyles([root, heading, rig, letter, topPanel, bottomPanel, seal, sealLeft, sealRight, ...envelopeParts])
      ;['side', 'flap', 'letter', 'phase'].forEach((key) => { delete root.dataset[key] })
    })
  })

  return (
    <div ref={root} class={`letter-scene ${props.class ?? ''}`} data-mode={animated() ? 'animated' : 'static'}>
      <div ref={stage} class="letter-scene-stage">
        <Show when={props.heading}>
          <div ref={heading} class="letter-scene-heading">{props.heading}</div>
        </Show>
        <div ref={rig} class="letter-scene-rig">
          <div ref={back} class="letter-envelope-part letter-envelope-back" aria-hidden="true" />
          <div ref={flap} class="letter-envelope-part letter-envelope-flap" aria-hidden="true" />
          <article ref={letter} class="letter-sheet" aria-label={props.label}>
            <div ref={topPanel} class="letter-panel letter-panel-top">
              <div class="letter-face ds-paper">{props.opening}</div>
              <div class="letter-face letter-face-back ds-paper" aria-hidden="true">
                <span class="letter-back-mark">{mark()}</span>
                <span class="letter-back-label">{props.foldedLabel}</span>
              </div>
            </div>
            <div class="letter-panel letter-panel-middle">
              <div class="letter-face ds-paper">{props.body}</div>
            </div>
            <div ref={bottomPanel} class="letter-panel letter-panel-bottom">
              <div class="letter-face ds-paper">{props.closing}</div>
              <div class="letter-face letter-face-back ds-paper" aria-hidden="true" />
            </div>
          </article>
          <div ref={pocket} class="letter-envelope-part letter-envelope-pocket" aria-hidden="true" />
          <div ref={seal} class="letter-envelope-part letter-envelope-seal" aria-hidden="true">
            <span class="letter-seal">
              <span ref={sealLeft} class="letter-seal-half letter-seal-left">{mark()}</span>
              <span ref={sealRight} class="letter-seal-half letter-seal-right">{mark()}</span>
            </span>
          </div>
          <div ref={front} class="letter-envelope-part letter-envelope-front" aria-hidden="true">
            <span class="letter-envelope-sender"><b>{mark()}</b>{props.sender}</span>
            <span class="letter-envelope-stamp"><Icon name="asterisk" size={24} /><b>{mark()}</b></span>
            <span class="letter-envelope-postmark">{props.postmark}</span>
            <span class="letter-envelope-address">
              <small>{props.recipientLabel}</small>
              <strong>{props.recipient}</strong>
              <i /><i />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
