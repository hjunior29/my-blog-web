import { Icon } from './Icon'
import type { JSX } from 'solid-js'
import { Arrow, Badge } from './primitives'
import { Book } from './Book'
import './post-card.css'

export { NotebookArt } from './NotebookArt'

export interface PostCardProps {
  readonly title: string
  readonly description: string
  readonly category: string
  readonly date: string
  readonly readingTime: string
  readonly slug?: string
  readonly href?: string
  readonly tags?: readonly string[]
  readonly coverImage?: string
  readonly coverPosition?: string
  readonly onOpen?: (trigger: HTMLElement) => void
}

export function PostCard(props: PostCardProps) {
  const getHref = () => props.href ?? (props.slug ? `/posts/${props.slug}` : undefined)

  const handleClick = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (props.onOpen) {
      e.preventDefault()
      props.onOpen(e.currentTarget as HTMLElement)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      if (props.onOpen) {
        e.preventDefault()
        props.onOpen(e.currentTarget as HTMLElement)
      }
    }
  }

  return (
    <article class="post-card post-book-card">
      <div class="post-book-stage">
        <Book
          title={props.title}
          width={248}
          color="var(--accent)"
          coverImage={props.coverImage}
          coverPosition={props.coverPosition}
          icon={<span class="post-book-mark">h.</span>}
        />
        {getHref() ? (
          <a
            href={getHref()}
            class="post-book-action"
            aria-label={props.title}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <button
            type="button"
            class="post-book-action"
            aria-label={props.title}
            onClick={(event) => props.onOpen?.(event.currentTarget)}
          />
        )}
      </div>
      <div class="post-book-details">
        <Badge accent>{props.category}</Badge>
        <p>{props.description}</p>
        <div class="metadata">
          <span>{props.date}</span>
          <span aria-hidden="true">·</span>
          <span>{props.readingTime}</span>
        </div>
      </div>
    </article>
  )
}

export function Author(props: { name: string; description: string }) {
  return (
    <div class="author">
      <span class="avatar" aria-hidden="true">h.</span>
      <div>
        <strong>{props.name}</strong>
        <p>{props.description}</p>
      </div>
    </div>
  )
}

export function Quote(props: { children: JSX.Element; caption: string }) {
  return (
    <figure class="quote">
      <Icon name="quote" />
      <blockquote>{props.children}</blockquote>
      <figcaption>{props.caption}</figcaption>
    </figure>
  )
}

export function ProjectCard(props: { eyebrow: string; title: string; description: string; action: string; onOpen: () => void }) {
  return (
    <article class="project-card">
      <div class="project-visual" aria-hidden="true">
        <div class="mini-browser">
          <div class="mini-toolbar"><i /><i /><i /></div>
          <span>helder<span class="accent-text">.</span></span>
          <div class="mini-layout">
            <div><i /><i /><i /></div>
            <b>h.</b>
          </div>
        </div>
      </div>
      <div class="project-content">
        <span class="eyebrow">{props.eyebrow}</span>
        <h3>{props.title}</h3>
        <p>{props.description}</p>
        <div class="row">
          <Badge>SolidJS</Badge>
          <Badge>TypeScript</Badge>
        </div>
        <button class="text-link" onClick={props.onOpen}>
          {props.action}
          <Arrow diagonal />
        </button>
      </div>
    </article>
  )
}
