import { createSignal, createUniqueId, type JSX } from 'solid-js'
import { Icon } from './Icon'

export function Accordion(props: { title: string; children: JSX.Element }) {
  const [expanded, setExpanded] = createSignal(false)
  const id = createUniqueId()
  return <div class="accordion" data-expanded={expanded()}>
    <button class="accordion-trigger" aria-expanded={expanded()} aria-controls={id} onClick={() => setExpanded(!expanded())}>{props.title}<Icon name="plus" /></button>
    <div class="accordion-panel" id={id} inert={!expanded()} aria-hidden={!expanded()}><div><p>{props.children}</p></div></div>
  </div>
}
