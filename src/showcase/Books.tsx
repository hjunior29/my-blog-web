import { Icon } from '../design-system/Icon'
import { createSignal } from 'solid-js'
import { Book } from '../design-system/Book'
import { Section, Toggle } from '../design-system/primitives'
import type { Copy } from './copy'
import './books.css'

function ReferenceIllustration() {
  return <svg width="36" height="56" viewBox="0 0 36 56"><circle cx="18" cy="18" r="18" fill="#45dec4" /><circle cx="18" cy="38" r="18" fill="#e5484d" /><path d="M3.031 28a18 18 0 0 1 29.938 0 18 18 0 0 1-29.938 0" fill="#0070f3" /></svg>
}

export function Books(props: { t: Copy }) {
  const [rotated, setRotated] = createSignal(false)
  const [textured, setTextured] = createSignal(false)
  return <Section id="books" number="06" title={props.t.bookTitle} description={props.t.bookDescription}>
    <div class="book-controls"><Toggle label={props.t.bookRotate} checked={rotated()} onChange={setRotated} /><Toggle label={props.t.bookTexture} checked={textured()} onChange={setTextured} /><a class="text-link" href="https://vercel.com/geist/book" target="_blank" rel="noreferrer">{props.t.bookReference}<Icon name="arrowUpRight" /></a></div>
    <div class="book-gallery">
      <figure><div class="book-stage"><Book title={props.t.bookReferenceTitle} color="var(--reference-amber)" rotated={rotated()} textured={textured()} icon={<Icon name="triangle" size={16} />} /></div><figcaption><strong>{props.t.bookStripe}</strong><code>196 × 240 · stripe</code></figcaption></figure>
      <figure><div class="book-stage"><Book title={props.t.bookReferenceTitle} variant="simple" rotated={rotated()} textured={textured()} illustration={<ReferenceIllustration />} /></div><figcaption><strong>{props.t.bookSimple}</strong><code>196 × 240 · simple</code></figcaption></figure>
      <figure class="book-personal"><div class="book-stage"><Book title={props.t.bookPersonalTitle} color="var(--accent)" rotated={rotated()} textured={textured()} icon={<span class="book-monogram">h.</span>} /></div><figcaption><strong>{props.t.bookPersonal}</strong><code>{props.t.bookPersonalCaption}</code></figcaption></figure>
    </div>
    <p class="book-note">{props.t.bookNote}</p>
  </Section>
}
