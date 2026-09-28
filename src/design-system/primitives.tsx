import { Icon } from './Icon'
import { Show, splitProps, type JSX } from 'solid-js'

export function Button(props: JSX.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost'; size?: 'small' | 'large'; busy?: boolean }) {
  const [local, rest] = splitProps(props, ['variant', 'size', 'busy', 'children', 'class', 'disabled'])
  return <button {...rest} type={props.type ?? 'button'} class={`button ${local.variant ?? 'primary'} ${local.size ?? ''} ${local.class ?? ''}`} disabled={local.disabled || local.busy} aria-busy={local.busy || undefined}><Show when={local.busy}><Icon name="loader" size={16} class="spinner" /></Show>{local.children}</button>
}
export function Arrow(props: { diagonal?: boolean }) {
  return <Icon name={props.diagonal ? "arrowUpRight" : "arrowRight"} size={16} />
}
export function Badge(props: { children: JSX.Element; accent?: boolean }) {
  return <span class={`badge ${props.accent ? 'accent' : ''}`}>{props.children}</span>
}
export function Section(props: { id: string; number: string; title: string; description: string; children: JSX.Element }) {
  return <section id={props.id} class="section"><div class="section-heading"><span class="section-number">{props.number}</span><div><h2>{props.title}</h2><p>{props.description}</p></div></div>{props.children}</section>
}
export function Field(props: { id: string; label: string; hint?: string; error?: string; children: JSX.Element }) {
  return <div class="field"><label for={props.id}>{props.label}</label>{props.children}<Show when={props.error || props.hint}><p id={`${props.id}-hint`} class={props.error ? 'field-error' : 'field-hint'}>{props.error || props.hint}</p></Show></div>
}
export function Toggle(props: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label class="toggle-label"><input type="checkbox" role="switch" checked={props.checked} onChange={e => props.onChange(e.currentTarget.checked)} /><span class="toggle-track" aria-hidden="true" /><span>{props.label}</span></label>
}
export function Alert(props: { title: string; children: JSX.Element; error?: boolean }) {
  return <div class={`alert ${props.error ? 'error' : ''}`}><Icon name={props.error ? "circleAlert" : "check"} class="alert-icon" /><div><strong>{props.title}</strong><div>{props.children}</div></div></div>
}
export function EmptyState(props: { title: string; description: string; children: JSX.Element }) {
  return <div class="empty-state"><Icon name="inbox" size={48} class="empty-symbol" /><h3>{props.title}</h3><p>{props.description}</p>{props.children}</div>
}
export function Skeleton(props: { label: string; paused?: boolean }) {
  return <div class="skeleton" data-paused={props.paused} role="status" aria-label={props.label}><div class="skeleton-image" /><div class="skeleton-line short" /><div class="skeleton-line" /><div class="skeleton-line medium" /><span class="sr-only">{props.label}</span></div>
}
export { Accordion } from './Accordion'
