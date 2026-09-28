import DOMPurify from 'dompurify'
import { createMemo } from 'solid-js'

export interface ArticleProseProps {
  readonly html: string
  readonly class?: string
}

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'em', 'b', 'i', 'u', 's', 'del',
    'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    'hr', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img', 'span', 'figure', 'figcaption',
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'id', 'class'],
  ADD_ATTR: ['rel'],
  FORCE_BODY: false,
}

export function ArticleProse(props: ArticleProseProps) {
  const sanitizedHtml = createMemo(() => {
    if (!props.html) return ''
    if (typeof window === 'undefined') {
      return props.html
    }
    const clean = DOMPurify.sanitize(props.html, SANITIZE_CONFIG)
    return clean
  })

  return (
    <article
      class={`article-prose ${props.class ?? ''}`}
      innerHTML={sanitizedHtml()}
    />
  )
}
