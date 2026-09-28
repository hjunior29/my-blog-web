import { createSignal, createEffect, Show } from 'solid-js'
import { useParams, A } from '@solidjs/router'
import { useI18n } from '../i18n/index.ts'
import { apiClient } from '../lib/api/client.ts'
import { mapPostToViewModel } from '../lib/api/mappers.ts'
import type { PostViewModel } from '../lib/api/types.ts'
import { ArticleProse, Alert, Badge, Button, Icon, Skeleton, Toast } from '../design-system'

export function ArticlePage() {
  const { t, locale } = useI18n()
  const params = useParams()

  const [post, setPost] = createSignal<PostViewModel | null>(null)
  const [loading, setLoading] = createSignal(true)
  const [errorStatus, setErrorStatus] = createSignal<number | null>(null)
  const [toastMessage, setToastMessage] = createSignal('')

  const fetchPost = async () => {
    if (!params.slug) return
    setLoading(true)
    setErrorStatus(null)
    try {
      const res = await apiClient.getPostBySlug(params.slug)
      const vm = mapPostToViewModel(res, undefined, locale() === 'pt' ? 'pt-BR' : 'en-US')
      setPost(vm)
      if (typeof document !== 'undefined') {
        document.title = `${vm.title} / ${t().brandName}`
      }
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'status' in err) {
        setErrorStatus((err as { status: number }).status)
      } else {
        setErrorStatus(500)
      }
    } finally {
      setLoading(false)
    }
  }

  createEffect(() => {
    fetchPost()
  })

  const handleShare = async () => {
    const currentPost = post()
    if (!currentPost) return

    const url = window.location.href
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: currentPost.title,
          text: currentPost.description,
          url,
        })
        return
      } catch {
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setToastMessage(t().linkCopied)
    } catch {
      setToastMessage(t().linkCopyFailed)
    }
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <div class="article-reader-container">
      <Show when={!loading()} fallback={
        <div class="article-loading-state">
          <Skeleton label={t().loadingMessage} />
          <Skeleton label={t().loadingMessage} />
        </div>
      }>
        <Show when={post() && !errorStatus()} fallback={
          <Show when={errorStatus() !== 404} fallback={
            <div class="article-not-found">
              <h1 class="serif">{t().articleNotFoundTitle}</h1>
              <p>{t().articleNotFoundBody}</p>
              <div class="article-not-found-action">
                <A href="/posts" class="button secondary">
                  <Icon name="arrowLeft" size={16} />
                  {t().backToArticles}
                </A>
              </div>
            </div>
          }>
            <div class="article-error-state">
              <Alert title={t().error} error>
                <p>{t().genericErrorMessage}</p>
                <Button variant="ghost" onClick={fetchPost}>
                  {t().retryAction}
                </Button>
              </Alert>
            </div>
          </Show>
        }>
          <article class="article-reader">
            <nav class="article-back-nav" aria-label="Secondary navigation">
              <A href="/posts" class="text-link">
                <Icon name="arrowLeft" size={16} />
                {t().backToArticles}
              </A>
            </nav>

            <header class="article-header">
              <div class="article-category">
                <Badge accent>{post()!.category}</Badge>
              </div>

              <h1 class="article-title">{post()!.title}</h1>

              <Show when={post()!.description}>
                <p class="article-lead">{post()!.description}</p>
              </Show>

              <div class="article-meta">
                <span class="article-author">{t().brandName}</span>
                <span class="meta-dot" aria-hidden="true">·</span>
                <time class="article-date">{post()!.formattedDate}</time>
                <span class="meta-dot" aria-hidden="true">·</span>
                <span class="article-reading-time">{post()!.readingTimeMinutes} min</span>
              </div>

              <div class="article-actions-bar">
                <Button variant="ghost" size="small" onClick={handleShare} aria-label={t().shareArticle}>
                  <Icon name="share" size={14} />
                  <span>{t().shareArticle}</span>
                </Button>

                <Button variant="ghost" size="small" onClick={handlePrint} aria-label={t().printArticle}>
                  <Icon name="print" size={14} />
                  <span>{t().printArticle}</span>
                </Button>
              </div>
            </header>

            <div class="article-body">
              <ArticleProse html={post()!.contentHtml ?? ''} />
            </div>

            <footer class="article-footer-nav">
              <A href="/posts" class="button secondary">
                <Icon name="arrowLeft" size={16} />
                {t().backToArticles}
              </A>
            </footer>
          </article>
        </Show>
      </Show>

      <Toast
        message={toastMessage()}
        closeLabel={t().close}
        onClose={() => setToastMessage('')}
      />
    </div>
  )
}
