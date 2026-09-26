import { Icon } from './Icon'
import { createUniqueId, Show, type JSX } from 'solid-js'
import { Badge, Button } from './primitives'

export function Toast(props: { message: string; closeLabel: string; onClose: () => void }) {
  return <div class="toast-region" role="status" aria-live="polite"><Show when={props.message}><div class="toast"><Icon name="check" />{props.message}<button onClick={props.onClose} aria-label={props.closeLabel}><Icon name="close" /></button></div></Show></div>
}

export function Dialog(props: { ref: (element: HTMLDialogElement) => void; title: string; badge: string; closeLabel: string; className?: string; onClose?: () => void; children: JSX.Element }) {
  const titleId = createUniqueId()
  let dialog!: HTMLDialogElement
  function dismissBackdrop(event: MouseEvent) {
    if (event.target !== dialog) return
    const bounds = dialog.getBoundingClientRect()
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close()
  }
  return <dialog ref={element => { dialog = element; props.ref(element) }} class={`preview-dialog ${props.className ?? ""}`} aria-labelledby={titleId} onClose={props.onClose} onClick={dismissBackdrop}>
    <div class="dialog-toolbar"><Badge>{props.badge}</Badge><Button variant="ghost" onClick={() => dialog.close()} aria-label={props.closeLabel}><Icon name="close" /></Button></div>
    <h2 id={titleId}>{props.title}</h2>
    {props.children}
    <Button variant="secondary" onClick={() => dialog.close()}>{props.closeLabel}</Button>
  </dialog>
}
