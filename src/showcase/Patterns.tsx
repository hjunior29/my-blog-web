import { Icon } from '../design-system/Icon'
import { createSignal, For } from 'solid-js'
import { Accordion, Alert, Button, EmptyState, Section, Skeleton, Toggle } from '../design-system/primitives'
import { Author, ProjectCard, Quote } from '../design-system/editorial'
import { PostGrid } from '../design-system/PostGrid'
import type { Copy } from './copy'
export function Editorial(props: { t: Copy; openArticle: (trigger?: HTMLElement, index?: number) => void; openProject: () => void }) {
  const [showCover, setShowCover] = createSignal(true)
  const posts = () => [
    { title: props.t.articleTitle, description: props.t.articleBody, category: props.t.subjects[1]! },
    ...props.t.articleSamples,
  ].map((post, index) => ({ ...post, date: props.t.date, readingTime: props.t.readTime, coverImage: showCover() && index % 2 === 0 ? '/images/post-observation.svg' : undefined }))
  return <Section id="editorial" number="03" title={props.t.editorial} description={props.t.editorialDesc}>
    <div class="subsection-header"><span class="eyebrow">{props.t.example}</span><Toggle label={props.t.postCoverImage} checked={showCover()} onChange={setShowCover} /></div>
    <h3>{props.t.articleGridTitle}</h3><PostGrid posts={posts()} onOpen={props.openArticle} />
    <div class="editorial-grid"><ProjectCard eyebrow={props.t.project} title={props.t.projectTitle} description={props.t.projectBody} action={props.t.projectLink} onOpen={props.openProject} /><Author name={props.t.author} description={props.t.authorRole} /></div>
    <div class="editorial-bottom"><Quote caption={props.t.quoteCaption}>{props.t.quote}</Quote></div>
  </Section>
}
export function Feedback(props: { t: Copy; notify: (message: string) => void }) {
  const [recovered, setRecovered] = createSignal(false)
  const [empty, setEmpty] = createSignal(true)
  return <Section id="feedback" number="04" title={props.t.feedback} description={props.t.feedbackDesc}><div class="feedback-grid"><div class="feedback-alerts"><Alert title={props.t.success}>{props.t.successBody}</Alert><Alert title={recovered() ? props.t.success : props.t.error} error={!recovered()}><p aria-live="polite">{recovered() ? props.t.recovered : props.t.errorBody}</p><Button variant="ghost" onClick={() => setRecovered(!recovered())}>{props.t.retry}<Icon name="retry" /></Button></Alert><Button variant="secondary" onClick={() => props.notify(props.t.demoAction)}>{props.t.showToast}<Icon name="arrowUpRight" /></Button></div><div>{empty() ? <EmptyState title={props.t.empty} description={props.t.emptyBody}><Button variant="secondary" onClick={() => setEmpty(false)}>{props.t.reset}</Button></EmptyState> : <div class="empty-state"><h3>{props.t.subjects.join(' · ')}</h3><p>{props.t.recovered}</p><Button variant="secondary" onClick={() => setEmpty(true)}>{props.t.empty}</Button></div>}</div></div><div class="loading-row"><div><h3>{props.t.skeleton}</h3><p>{props.t.loading}…</p></div><Skeleton label={props.t.skeleton} /></div><Accordion title={props.t.accordion}>{props.t.accordionBody}</Accordion></Section>
}
export function Principles(props: { t: Copy }) {
  return <Section id="principles" number="05" title={props.t.principles} description={props.t.principlesDesc}><div class="principles-grid"><For each={props.t.principleTitles}>{(title, index) => <article><span class="principle-number">0{index() + 1}</span><h3>{title}</h3><p>{props.t.principleBodies[index()]}</p></article>}</For></div></Section>
}
