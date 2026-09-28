import { Icon } from './Icon'
import { createEffect, createMemo, createUniqueId, onCleanup, type JSX } from 'solid-js'
import { Badge, Button } from './primitives'
import { Presence } from './Presence'
import { animatePresence } from './motion'

export function Toast(props: { message: string; closeLabel: string; onClose: () => void }) {
  const message = createMemo<string>(previous => props.message || previous, '')
  return <div class="toast-region" role="status" aria-live="polite"><Presence when={!!props.message} preset="slide"><div class="toast"><Icon name="check" />{message()}<button onClick={props.onClose} aria-label={props.closeLabel}><Icon name="close" /></button></div></Presence></div>
}

export function Dialog(props: { open: boolean; title: string; badge: string; closeLabel: string; className?: string; onClose: () => void; children: JSX.Element }) {
  const titleId = createUniqueId()
  let dialog!: HTMLDialogElement
  let animation: Animation | null = null
  let revision = 0
  let closing = false
  function close() {
    if (closing || !dialog.open) return
    closing = true
    const current = ++revision
    animation?.cancel()
    dialog.dataset.closing = ''
    animation = animatePresence(dialog, false)
    const finish = () => {
      if (current !== revision) return
      dialog.close()
      delete dialog.dataset.closing
      animation?.cancel()
      animation = null
      closing = false
      props.onClose()
    }
    if (animation) void animation.finished.then(finish, () => {})
    else finish()
  }
  createEffect(() => {
    if (props.open) {
      revision++
      animation?.cancel()
      closing = false
      delete dialog.dataset.closing
      if (!dialog.open) dialog.showModal()
      animation = animatePresence(dialog, true)
    } else close()
  })
  onCleanup(() => { revision++; animation?.cancel() })
  function dismissBackdrop(event: MouseEvent) {
    if (event.target !== dialog) return
    const bounds = dialog.getBoundingClientRect()
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close()
  }
  return <dialog ref={dialog} class={`preview-dialog ${props.className ?? ''}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); close() }} onClick={dismissBackdrop}>
    <div class="dialog-toolbar"><Badge>{props.badge}</Badge><Button variant="ghost" onClick={close} aria-label={props.closeLabel}><Icon name="close" /></Button></div>
    <h2 id={titleId}>{props.title}</h2>
    {props.children}
    <Button variant="secondary" onClick={close}>{props.closeLabel}</Button>
  </dialog>
}
