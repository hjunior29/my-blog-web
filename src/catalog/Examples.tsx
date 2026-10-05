import { createSignal, createUniqueId, For, Match, Show, Switch, type JSX } from 'solid-js'
import { Accordion, Alert, Arrow, Badge, Button, EmptyState, Field, Skeleton, Toggle } from '../design-system/primitives'
import { Pagination } from '../design-system/Pagination'
import { Author, NotebookArt, PostCard, ProjectCard, Quote } from '../design-system/editorial'
import { Book } from '../design-system/Book'
import { PostGrid } from '../design-system/PostGrid'
import { Icon } from '../design-system/Icon'
import { PaperZoomScene } from '../design-system/PaperZoomScene'
import { LetterScene } from '../design-system/LetterScene'
import { BookmarkRibbon } from '../design-system/BookmarkRibbon'
import { Colors, Spacing, Typography } from '../showcase/Foundations'
import { Icons } from '../showcase/Icons'
import { catalogCopy, type CatalogId } from './content'
import type { Copy, Locale } from '../showcase/copy'

export type ExampleProps = { id: CatalogId; t: Copy; locale: Locale; compact?: boolean; notify: (message: string) => void; openModal: () => void; openArticle: (trigger?: HTMLElement, index?: number) => void }
function Sample(props: { title: string; children: JSX.Element; wide?: boolean }) {
  return <section class="catalog-sample"><h2>{props.title}</h2><div class={`catalog-preview ${props.wide ? 'wide' : ''}`}>{props.children}</div></section>
}
export function Examples(props: ExampleProps) {
  const c = () => catalogCopy(props.locale)
  const [enabled, setEnabled] = createSignal(true)
  const [page, setPage] = createSignal(1)
  const [rotated, setRotated] = createSignal(false)
  const [textured, setTextured] = createSignal(false)
  const [recovered, setRecovered] = createSignal(false)
  const fieldId = createUniqueId()
  const posts = () => [{ title: props.t.articleTitle, description: props.t.articleBody, category: props.t.subjects[1]! }, ...props.t.articleSamples].map((post, index) => ({ ...post, date: props.t.date, readingTime: props.t.readTime, coverImage: index % 2 === 0 ? '/images/post-observation.svg' : undefined }))
  const act = () => props.notify(props.t.demoAction)
  return <Switch>
    <Match when={props.id === 'colors'}><Colors t={props.t} notify={props.notify} /></Match>
    <Match when={props.id === 'typography'}><Typography t={props.t} /></Match>
    <Match when={props.id === 'spacing'}><Spacing t={props.t} /></Match>
    <Match when={props.id === 'icons'}><Icons t={props.t} /></Match>
    <Match when={props.id === 'motion'}><Sample title={c().interaction}><div class="sample-stack"><p>{props.t.motionDescription}</p><div class="row"><Button variant="secondary" onClick={props.openModal}>{props.t.motionModal}</Button><Button variant="ghost" onClick={act}>{props.t.motionToast}</Button></div></div></Sample></Match>
    <Match when={props.id === 'button'}>
      <Sample title={c().variants}><div class="row"><Button onClick={act}>{props.t.primary}<Arrow /></Button><Button variant="secondary" onClick={act}>{props.t.secondary}</Button><Button variant="ghost" onClick={act}>{props.t.tertiary}</Button></div></Sample>
      <Show when={!props.compact}><Sample title={c().sizes}><div class="row"><For each={['small', undefined, 'large'] as const}>{(size, index) => <Button size={size} variant="secondary" onClick={act}>{[props.t.small, props.t.regular, props.t.large][index()]}</Button>}</For></div></Sample><Sample title={c().states}><div class="row"><Button disabled>{props.t.disabled}</Button><Button busy>{props.t.loading}</Button><Button variant="secondary" aria-pressed={!enabled()} onClick={() => setEnabled(!enabled())}><Icon name={enabled() ? 'bookmark' : 'check'} size={16} />{enabled() ? props.t.save : props.t.saved}</Button></div></Sample></Show>
    </Match>
    <Match when={props.id === 'badge'}><Sample title={c().variants}><div class="row"><Badge>{props.t.subjects[0]}</Badge><Badge accent>{props.t.subjects[1]}</Badge></div></Sample></Match>
    <Match when={props.id === 'field'}><Sample title={c().default}><div class="sample-stack"><Field id={`${fieldId}-email`} label={props.t.email} hint={props.t.emailHelp}><input id={`${fieldId}-email`} type="email" placeholder={props.t.emailPlaceholder} aria-describedby={`${fieldId}-email-hint`} /></Field><Show when={!props.compact}><Field id={`${fieldId}-subject`} label={props.t.subject}><select id={`${fieldId}-subject`}><For each={props.t.subjects}>{subject => <option>{subject}</option>}</For></select></Field><Field id={`${fieldId}-message`} label={props.t.message}><textarea id={`${fieldId}-message`} rows={3} placeholder={props.t.messagePlaceholder} /></Field></Show></div></Sample><Show when={!props.compact}><Sample title={c().states}><Field id={`${fieldId}-error`} label={props.t.email} error={props.t.invalid}><input id={`${fieldId}-error`} type="email" value="email" aria-invalid="true" aria-describedby={`${fieldId}-error-hint`} /></Field></Sample></Show></Match>
    <Match when={props.id === 'toggle'}><Sample title={c().interaction}><div class="sample-stack"><Toggle label={props.t.notifications} checked={enabled()} onChange={setEnabled} /><label class="checkbox-label"><input type="checkbox" />{props.t.reading}</label></div></Sample></Match>
    <Match when={props.id === 'pagination'}><Sample title={c().interaction}><Pagination page={page()} totalPages={4} onChange={setPage} label={props.t.page} previous={props.t.previous} next={props.t.next} /></Sample></Match>
    <Match when={props.id === 'accordion'}><Sample title={c().interaction}><Accordion title={props.t.accordion}>{props.t.accordionBody}</Accordion></Sample></Match>
    <Match when={props.id === 'alert'}><Sample title={c().states}><div class="sample-stack"><Alert title={props.t.success}>{props.t.successBody}</Alert><Show when={!props.compact}><Alert title={recovered() ? props.t.success : props.t.error} error={!recovered()}><p aria-live="polite">{recovered() ? props.t.recovered : props.t.errorBody}</p><Button variant="ghost" onClick={() => setRecovered(!recovered())}>{props.t.retry}<Icon name="retry" /></Button></Alert></Show></div></Sample></Match>
    <Match when={props.id === 'empty'}><Sample title={c().default}><Show when={!recovered()} fallback={<Alert title={props.t.success}>{props.t.recovered}<Button variant="ghost" onClick={() => setRecovered(false)}>{props.t.reset}</Button></Alert>}><EmptyState title={props.t.empty} description={props.t.emptyBody}><Button variant="secondary" onClick={() => setRecovered(true)}>{props.t.reset}</Button></EmptyState></Show></Sample></Match>
    <Match when={props.id === 'skeleton'}><Sample title={c().default}><div class="sample-stack"><Skeleton label={props.t.skeleton} paused={!enabled()} /><Toggle label={c().pauseMotion} checked={!enabled()} onChange={value => setEnabled(!value)} /></div></Sample></Match>
    <Match when={props.id === 'dialog'}><Sample title={c().interaction}><Button variant="secondary" onClick={props.openModal}>{props.t.motionModal}<Icon name="arrowUpRight" size={16} /></Button></Sample></Match>
    <Match when={props.id === 'toast'}><Sample title={c().interaction}><Button variant="secondary" onClick={act}>{props.t.showToast}</Button></Sample></Match>
    <Match when={props.id === 'book'}>
      <div class="catalog-controls"><Toggle label={props.t.bookRotate} checked={rotated()} onChange={setRotated} /><Toggle label={props.t.bookTexture} checked={textured()} onChange={setTextured} /></div>
      <Sample title={c().default}><Book title={props.t.bookPersonalTitle} color="var(--accent)" rotated={rotated()} textured={textured()} icon={<span class="post-book-mark">h.</span>} /></Sample>
      <Show when={!props.compact}><Sample title={c().variants}><div class="catalog-book-variants"><figure><Book title={props.t.articleTitle} color="var(--accent)" coverImage="/images/post-observation.svg" rotated={rotated()} textured={textured()} /><figcaption>{c().image}</figcaption></figure><figure><Book title={props.t.bookPersonalTitle} variant="simple" rotated={rotated()} textured={textured()} /><figcaption>{c().simple}</figcaption></figure></div></Sample></Show>
    </Match>
    <Match when={props.id === 'post'}><Sample title={c().interaction}><PostCard {...posts()[0]!} onOpen={trigger => props.openArticle(trigger, 0)} /></Sample></Match>
    <Match when={props.id === 'post-grid'}><Sample title={c().default} wide><PostGrid posts={props.compact ? posts().slice(0, 3) : posts()} onOpen={props.openArticle} /></Sample></Match>
    <Match when={props.id === 'project'}><Sample title={c().default}><ProjectCard eyebrow={props.t.project} title={props.t.projectTitle} description={props.t.projectBody} action={props.t.projectLink} onOpen={props.openModal} /></Sample></Match>
    <Match when={props.id === 'author'}><Sample title={c().default}><Author name={props.t.author} description={props.t.authorRole} /></Sample></Match>
    <Match when={props.id === 'quote'}><Sample title={c().default}><Quote caption={props.t.quoteCaption}>{props.t.quote}</Quote></Sample></Match>
    <Match when={props.id === 'artwork'}><Sample title={c().notebook}><NotebookArt compact motionLabel={c().pauseMotion} /></Sample><Sample title={c().correspondence}><NotebookArt compact variant="correspondence" motionLabel={c().pauseMotion} /></Sample></Match>
    <Match when={props.id === 'paper-scene'}><Sample title={c().default} wide><PaperZoomScene static label={props.t.notebookLabel} intro={null}><h3 class="reading-preview-title">{props.t.notebookTitle}</h3><p>{props.t.notebookLead}</p></PaperZoomScene></Sample></Match>
    <Match when={props.id === 'letter-scene'}><Sample title={c().default}><LetterScene static label={props.t.letterLabel} recipientLabel={props.t.letterRecipientLabel} recipient={props.t.letterRecipient} sender={props.t.letterSender} postmark={props.t.letterPostmark} foldedLabel={props.t.letterFoldedLabel} opening={<p>{props.t.letterGreeting}</p>} body={<p>{props.t.letterBody[0]}</p>} closing={<p>{props.t.letterClosing} {props.t.letterSignature}</p>} /></Sample></Match>
    <Match when={props.id === 'bookmark'}><Sample title={c().states}><div class="catalog-ribbon-pages"><For each={[0.1, 0.55, 1]}>{progress => <figure><div class="catalog-ribbon-page"><BookmarkRibbon progress={progress} /><i /><i /><i /><i /><i /></div><figcaption>{Math.round(progress * 100)}%</figcaption></figure>}</For></div></Sample></Match>
    <Match when={props.id === 'article'}><Sample title={c().default}><div class="sample-stack"><Badge accent>{props.t.subjects[1]}</Badge><h3 class="reading-preview-title">{props.t.articleTitle}</h3><p>{props.t.articleBody}</p><Author name={props.t.author} description={props.t.date} /><Button variant="secondary" onClick={() => props.openArticle()}>{props.t.primary}<Arrow /></Button></div></Sample></Match>
  </Switch>
}
