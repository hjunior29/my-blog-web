import { createEffect, createSignal, onCleanup, Show, type JSX } from 'solid-js'
import { animatePresence, type MotionPreset } from './motion'

export function Presence(props: { when: boolean; preset?: MotionPreset; children: JSX.Element }) {
  const [present, setPresent] = createSignal(props.when)
  let element: HTMLDivElement | undefined
  let animation: Animation | null = null
  let revision = 0
  createEffect(() => {
    const visible = props.when
    const current = ++revision
    animation?.cancel()
    if (visible) setPresent(true)
    queueMicrotask(() => {
      if (current !== revision || !element) return
      animation = animatePresence(element, visible, props.preset ?? 'fade')
      const finish = () => {
        if (current !== revision) return
        if (!visible) setPresent(false)
        animation?.cancel()
        animation = null
      }
      if (animation) void animation.finished.then(finish, () => {})
      else finish()
    })
  })
  onCleanup(() => { revision++; animation?.cancel() })
  return <Show when={present()}><div ref={element} inert={!props.when} aria-hidden={!props.when || undefined}>{props.children}</div></Show>
}
