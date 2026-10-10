import DOMPurify from 'dompurify'
import { createMemo, createEffect, onCleanup, createSignal } from 'solid-js'
import { useI18n } from '../i18n/index.ts'
import { DiagramModal } from './DiagramModal'

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

export function normalizeMermaidCode(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/<==>/g, '<-->')
    .replace(/\|([^"|\n\r]+?)\|/g, (match, inner) => {
      const trimmed = inner.trim()
      if (trimmed.includes('(') || trimmed.includes(')') || trimmed.includes('<') || trimmed.includes('>')) {
        return `|"${trimmed.replace(/"/g, '')}"|`
      }
      return match
    })
    .replace(/--\s*([^"\-|\n\r]+?)\s*-->/g, (match, inner) => {
      const trimmed = inner.trim()
      if (trimmed.includes('(') || trimmed.includes(')')) {
        return `-- "${trimmed.replace(/"/g, '')}" -->`
      }
      return match
    })
}

export function ArticleProse(props: ArticleProseProps) {
  let articleRef: HTMLElement | undefined
  const { t } = useI18n()

  const [activeSvg, setActiveSvg] = createSignal('')
  const [activeImage, setActiveImage] = createSignal<{ src: string; alt: string } | null>(null)
  const [isModalOpen, setIsModalOpen] = createSignal(false)

  const sanitizedHtml = createMemo(() => {
    if (!props.html) return ''
    if (typeof window === 'undefined') {
      return props.html
    }
    const clean = DOMPurify.sanitize(props.html, SANITIZE_CONFIG)
    return clean
  })

  const cleanupMermaidErrorNodes = (diagramId: string) => {
    document.getElementById(diagramId)?.remove()
    document.getElementById(`d${diagramId}`)?.remove()
  }

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
        suppressErrorRendering: true,
        fontFamily: 'var(--sans, system-ui, sans-serif)',
      })

      for (let i = 0; i < mermaidNodes.length; i++) {
        const codeElement = mermaidNodes[i] as HTMLElement
        const preElement = codeElement.parentElement as HTMLElement | null
        if (!preElement) continue
        const rawCode = codeElement.textContent?.trim() || ''
        if (!rawCode) continue
        const code = normalizeMermaidCode(rawCode)
        const diagramId = `mermaid-${Math.random().toString(36).slice(2, 9)}`
        try {
          const { svg } = await mermaid.render(diagramId, code)
          const container = document.createElement('div')
          container.className = 'article-mermaid'
          container.dataset.mermaidCode = code
          container.innerHTML = `
            <div class="article-mermaid-header">
              <button type="button" class="article-mermaid-expand-btn" aria-label="${t().expandDiagram}" title="${t().expandDiagram}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                <span>${t().expandDiagram}</span>
              </button>
            </div>
            <div class="article-mermaid-svg-wrapper">${svg}</div>
          `
          preElement.replaceWith(container)
        } catch (err) {
          console.error('[Mermaid render error]', err)
          cleanupMermaidErrorNodes(diagramId)
        }
      }
    } catch (err) {
      console.error('[Mermaid module error]', err)
    }
  }

  const enhanceArticleImages = () => {
    if (!articleRef || typeof window === 'undefined') return
    const images = articleRef.querySelectorAll<HTMLImageElement>('img')
    for (const img of images) {
      if (img.closest('.article-image-container') || img.closest('.article-mermaid')) continue
      const wrapper = document.createElement('div')
      wrapper.className = 'article-image-container'
      img.parentNode?.insertBefore(wrapper, img)
      wrapper.appendChild(img)

      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'article-image-expand-btn'
      btn.setAttribute('aria-label', t().expandImage)
      btn.setAttribute('title', t().expandImage)
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        <span>${t().expandImage}</span>
      `
      wrapper.appendChild(btn)
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
        suppressErrorRendering: true,
        fontFamily: 'var(--sans, system-ui, sans-serif)',
      })
      for (const container of containers) {
        const rawCode = container.dataset.mermaidCode || ''
        const svgWrapper = container.querySelector('.article-mermaid-svg-wrapper')
        if (!rawCode || !svgWrapper) continue
        const code = normalizeMermaidCode(rawCode)
        const diagramId = `mermaid-${Math.random().toString(36).slice(2, 9)}`
        try {
          const { svg } = await mermaid.render(diagramId, code)
          svgWrapper.innerHTML = svg
        } catch {
          cleanupMermaidErrorNodes(diagramId)
        }
      }
    } catch {
    }
  }

  const handleArticleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null
    if (!target) return

    const expandBtn = target.closest<HTMLElement>('.article-mermaid-expand-btn')
    const svgWrapper = target.closest<HTMLElement>('.article-mermaid-svg-wrapper')
    if (expandBtn || svgWrapper) {
      const container = target.closest<HTMLElement>('.article-mermaid')
      const svg = container?.querySelector('.article-mermaid-svg-wrapper svg')
      if (svg) {
        setActiveImage(null)
        setActiveSvg(svg.outerHTML)
        setIsModalOpen(true)
      }
      return
    }

    const imgExpandBtn = target.closest<HTMLElement>('.article-image-expand-btn')
    const imgContainer = target.closest<HTMLElement>('.article-image-container')
    const directImg = target.closest<HTMLImageElement>('img')

    if (imgExpandBtn || imgContainer || directImg) {
      const img = imgContainer?.querySelector('img') ?? directImg
      if (img && articleRef?.contains(img)) {
        setActiveSvg('')
        setActiveImage({
          src: img.currentSrc || img.src,
          alt: img.alt || img.title || '',
        })
        setIsModalOpen(true)
      }
    }
  }

  createEffect(() => {
    sanitizedHtml()
    renderMermaidDiagrams()
    enhanceArticleImages()
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
    <>
      <article
        ref={articleRef}
        class={`article-prose ${props.class ?? ''}`}
        innerHTML={sanitizedHtml()}
        onClick={handleArticleClick}
      />
      <DiagramModal
        open={isModalOpen()}
        svgHtml={activeSvg()}
        imageSrc={activeImage()?.src}
        imageAlt={activeImage()?.alt}
        onClose={() => setIsModalOpen(false)}
        labels={{
          zoomIn: t().zoomIn,
          zoomOut: t().zoomOut,
          resetZoom: t().resetZoom,
          panHint: t().diagramPanHint,
          close: t().close,
        }}
      />
    </>
  )
}
