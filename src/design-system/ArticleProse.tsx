import DOMPurify from 'dompurify'
import { createMemo, createEffect, onCleanup } from 'solid-js'

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
    'video', 'audio', 'source',
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'target', 'rel', 'src', 'alt', 'id', 'class',
    'controls', 'poster', 'loop', 'muted', 'preload', 'width', 'height', 'type',
  ],
  ADD_ATTR: ['rel'],
  FORCE_BODY: false,
}

export function ArticleProse(props: ArticleProseProps) {
  let articleRef: HTMLElement | undefined

  const sanitizedHtml = createMemo(() => {
    if (!props.html) return ''
    if (typeof window === 'undefined') {
      return props.html
    }
    const clean = DOMPurify.sanitize(props.html, SANITIZE_CONFIG)
    return clean
  })

  const renderMermaidDiagrams = async () => {
    if (!articleRef || typeof window === 'undefined') return
    const mermaidNodes = articleRef.querySelectorAll('pre > code.language-mermaid')
    if (mermaidNodes.length === 0) return

    try {
      const { default: mermaid } = await import('mermaid')
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'neutral',
        securityLevel: 'loose',
        fontFamily: 'var(--sans, system-ui, sans-serif)',
      })

      for (let i = 0; i < mermaidNodes.length; i++) {
        const codeElement = mermaidNodes[i] as HTMLElement
        const preElement = codeElement.parentElement as HTMLElement | null
        if (!preElement) continue
        const code = codeElement.textContent?.trim() || ''
        if (!code) continue
        const diagramId = `mermaid-${Math.random().toString(36).slice(2, 9)}`
        try {
          const { svg } = await mermaid.render(diagramId, code)
          const container = document.createElement('div')
          container.className = 'article-mermaid'
          container.dataset.mermaidCode = code
          container.innerHTML = svg
          preElement.replaceWith(container)
        } catch {
          // Graceful fallback: preserve pre block
        }
      }
    } catch {
      // Graceful fallback: leave as pre
    }
  }

  const rerenderMermaidTheme = async () => {
    if (!articleRef || typeof window === 'undefined') return
    const containers = articleRef.querySelectorAll<HTMLElement>('.article-mermaid')
    if (containers.length === 0) return
    try {
      const { default: mermaid } = await import('mermaid')
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'neutral',
        securityLevel: 'loose',
        fontFamily: 'var(--sans, system-ui, sans-serif)',
      })
      for (const container of containers) {
        const code = container.dataset.mermaidCode
        if (!code) continue
        const diagramId = `mermaid-${Math.random().toString(36).slice(2, 9)}`
        try {
          const { svg } = await mermaid.render(diagramId, code)
          container.innerHTML = svg
        } catch {
        }
      }
    } catch {
    }
  }

  createEffect(() => {
    sanitizedHtml()
    renderMermaidDiagrams()
  })

  createEffect(() => {
    if (typeof window === 'undefined') return
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-theme') {
          rerenderMermaidTheme()
        }
      }
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    onCleanup(() => observer.disconnect())
  })

  return (
    <article
      ref={articleRef}
      class={`article-prose ${props.class ?? ''}`}
      innerHTML={sanitizedHtml()}
    />
  )
}
