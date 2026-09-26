import { Icons } from './Icons'
import { Icon } from '../design-system/Icon'
import { createSignal, For, Show } from 'solid-js'
import { Arrow, Badge, Button, Field, Pagination, Section, Toggle } from '../design-system/primitives'
import type { Copy } from './copy'
export function Components(props: { t: Copy; notify: (message: string) => void; openArticle: () => void; openProject: () => void }) {
  const [saved, setSaved] = createSignal(false)
  const [email, setEmail] = createSignal('')
  const [invalid, setInvalid] = createSignal(false)
  const [subscribed, setSubscribed] = createSignal(false)
  const [reading, setReading] = createSignal(true)
  const [category, setCategory] = createSignal(0)
  const [page, setPage] = createSignal(1)
  function subscribe(event: SubmitEvent) {
    event.preventDefault()
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email())
    setInvalid(!valid)
    setSubscribed(valid)
  }
  return <Section id="components" number="02" title={props.t.components} description={props.t.componentDesc}>
    <div class="component-grid"><div class="component-column"><div class="specimen"><h3>{props.t.buttons}</h3><div class="row"><Button onClick={props.openArticle}>{props.t.primary}<Arrow /></Button><Button variant="secondary" onClick={props.openProject}>{props.t.secondary}<Arrow diagonal /></Button></div><div class="row"><Button variant="ghost" onClick={props.openArticle}>{props.t.tertiary}<Arrow /></Button><Button disabled>{props.t.disabled}</Button></div><div class="row"><Button busy>{props.t.loading}</Button><Button variant="secondary" aria-pressed={saved()} onClick={() => setSaved(!saved())}><Icon name={saved() ? "check" : "bookmark"} size={16} />{saved() ? props.t.saved : props.t.save}</Button></div><div class="row sizes"><Button size="small" variant="secondary" onClick={() => props.notify(props.t.demoAction)}>{props.t.small}</Button><Button variant="secondary" onClick={() => props.notify(props.t.demoAction)}>{props.t.regular}</Button><Button size="large" variant="secondary" onClick={() => props.notify(props.t.demoAction)}>{props.t.large}</Button></div></div>
    <div class="specimen"><h3>{props.t.tags}</h3><div class="row"><For each={props.t.subjects}>{item => <Badge>{item}</Badge>}</For><Badge accent>{props.t.featured}</Badge></div><div class="filter-group" role="group" aria-label={props.t.tags}><For each={[props.t.all, ...props.t.subjects]}>{(item, index) => <button aria-pressed={category() === index()} onClick={() => setCategory(index())}>{item}</button>}</For></div><p class="field-hint" aria-live="polite">{props.t.subject}: {[props.t.all, ...props.t.subjects][category()]}</p></div>
    <div class="specimen"><h3>{props.t.navigation}</h3><nav class="breadcrumbs" aria-label={props.t.navigation}><a href="#overview">{props.t.overview}</a><Icon name="chevronRight" size={16} /><span>{props.t.components}</span></nav><Pagination page={page()} onChange={setPage} label={props.t.page} previous={props.t.previous} next={props.t.next} /><p class="field-hint" aria-live="polite">{props.t.page} {page()} / 4</p></div></div>
    <form class="form-specimen" onSubmit={subscribe} noValidate><h3>{props.t.fields}</h3><Field id="email" label={props.t.email} hint={props.t.emailHelp} error={invalid() ? props.t.invalid : undefined}><input id="email" type="email" autocomplete="email" placeholder={props.t.emailPlaceholder} value={email()} aria-invalid={invalid()} aria-describedby="email-hint" onInput={e => { setEmail(e.currentTarget.value); setInvalid(false); setSubscribed(false) }} /></Field><Field id="subject" label={props.t.subject}><select id="subject"><For each={props.t.subjects}>{subject => <option>{subject}</option>}</For></select></Field><Field id="message" label={props.t.message}><textarea id="message" placeholder={props.t.messagePlaceholder} rows="3" /></Field><label class="checkbox-label"><input type="checkbox" />{props.t.notifications}</label><Toggle checked={reading()} onChange={setReading} label={props.t.reading} /><Button type="submit">{props.t.subscribe}<Arrow /></Button><Show when={subscribed()}><p class="form-success" role="status">{props.t.subscribed}</p></Show></form></div>
    <Icons t={props.t} />
  </Section>
}
