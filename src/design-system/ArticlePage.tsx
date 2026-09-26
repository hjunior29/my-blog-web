import { createUniqueId, onMount, type JSX } from 'solid-js'
import { Button } from './primitives'
import { Icon } from './Icon'
import './article-page.css'

export function ArticlePage(props: { title: string; description: string; category: string; author: string; date: string; readingTime: string; coverImage?: string; backLabel: string; onBack: () => void; children: JSX.Element }) {
  const titleId = createUniqueId()
  let heading!: HTMLHeadingElement
  onMount(() => heading.focus({ preventScroll: true }))
  return <div class="article-page"><header class="article-site-header"><a class="wordmark" href="#editorial" onClick={event => { event.preventDefault(); props.onBack() }}>helder<span>.</span></a><Button variant="ghost" onClick={props.onBack}><Icon name="arrowLeft" size={16} />{props.backLabel}</Button></header>
    <main class="article-main"><article aria-labelledby={titleId}><div class="article-meta"><span class="eyebrow accent-text">{props.category}</span><span>{props.readingTime}</span></div><h1 ref={heading} tabindex="-1" id={titleId}>{props.title}</h1><p class="article-description">{props.description}</p><div class="article-author"><span class="avatar" aria-hidden="true">h.</span><div><strong>{props.author}</strong><span>{props.date}</span></div></div>{props.coverImage && <img class="article-image" src={props.coverImage} alt="" width="800" height="480" />}<div class="article-prose">{props.children}</div></article></main></div>
}
