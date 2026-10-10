import { createSignal, createEffect, Show } from 'solid-js'
import { useParams, useNavigate, A } from '@solidjs/router'
import { useI18n } from '../i18n/index.ts'
import { getCachedPost, prefetchPost } from '../lib/api/postsCache.ts'
import type { PostViewModel } from '../lib/api/types.ts'
import { ArticleProse, Alert, Badge, BookmarkRibbon, Button, Icon, ReadingResumeBanner, Skeleton, Toast, bookReturnHref, transitionArticleToBook } from '../design-system'
import { getReadingBookmark, saveReadingBookmark, removeReadingBookmark, calculateResumeScrollY, type ReadingBookmark } from '../lib/storage/readingBookmark.ts'

const SHELF_PATH = '/posts'

export function ArticlePage() {
  const { t, locale } = useI18n()
  const params = useParams()
  const navigate = useNavigate()
  let articleElement: HTMLElement | undefined

  const currentLocale = () => (locale() === 'pt' ? 'pt-BR' : 'en-US')
  const initialCached = params.slug ? getCachedPost(params.slug, currentLocale()) : null

  const [post, setPost] = createSignal<PostViewModel | null>(initialCached)
  const [loading, setLoading] = createSignal(!initialCached)
  const [errorStatus, setErrorStatus] = createSignal<number | null>(null)
  const [toastMessage, setToastMessage] = createSignal('')
  const [savedBookmark, setSavedBookmark] = createSignal<ReadingBookmark | null>(null)
  const [showResumeBanner, setShowResumeBanner] = createSignal(false)

  createEffect(() => {
    const slug = params.slug
    if (!slug) return
    const bookmark = getReadingBookmark(slug)
    setSavedBookmark(bookmark)
    if (bookmark && bookmark.progress >= 0.05 && bookmark.progress <= 0.95) {
      setShowResumeBanner(true)
    } else {
      setShowResumeBanner(false)
    }
  })

  const handleSaveBookmark = (progress: number) => {
    const slug = params.slug
    if (!slug) return
    const bookmark = saveReadingBookmark(slug, progress)
    setSavedBookmark(bookmark)
    const pct = Math.round(bookmark.progress * 100)
    setToastMessage(t().bookmarkSavedToast(pct))
  }

  const handleResumeReading = () => {
    const bookmark = savedBookmark()
    if (!bookmark || !articleElement) return
    setShowResumeBanner(false)
    const destY = calculateResumeScrollY(articleElement, bookmark.progress, 65)
    window.scrollTo({ top: destY, behavior: 'smooth' })
  }

  const handleDismissBanner = () => {
    setShowResumeBanner(false)
  }

  const handleClearBookmark = () => {
    const slug = params.slug
    if (!slug) return
    removeReadingBookmark(slug)
    setSavedBookmark(null)
    setShowResumeBanner(false)
    setToastMessage(t().bookmarkRemovedToast)
  }

  const fetchPost = async () => {
    if (!params.slug) return
    const activeLocale = currentLocale()
    const cached = getCachedPost(params.slug, activeLocale)
    if (cached) {
      setPost(cached)
      setLoading(false)
      if (typeof document !== 'undefined') {
        document.title = `${cached.title} / ${t().brandName}`
      }
      return
    }
    setLoading(true)
    setErrorStatus(null)
    try {
      const vm = await prefetchPost(params.slug, activeLocale)
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

  const backHref = () => bookReturnHref(params.slug ?? '', SHELF_PATH)

  const handleBack = (event: MouseEvent) => {
    if (!params.slug || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    transitionArticleToBook({
      slug: params.slug,
      href: backHref(),
      label: t().backToArticles,
      restoreFocus: event.detail === 0,
      navigate: (href) => navigate(href, { scroll: false }),
    })
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
          <article ref={articleElement} class="article-reader">
            <BookmarkRibbon
              target={() => articleElement}
              interactive
              savedProgress={savedBookmark()?.progress}
              onBookmark={handleSaveBookmark}
              onJumpToSaved={handleResumeReading}
              onClearBookmark={handleClearBookmark}
              ariaLabel={t().bookmarkAriaLabel}
              jumpActionLabel={t().bookmarkJumpAction}
              updateActionLabel={t().bookmarkUpdateAction}
              clearActionLabel={t().bookmarkClearAction}
            />

            <Show when={showResumeBanner() && savedBookmark()}>
              <ReadingResumeBanner
                progress={savedBookmark()!.progress}
                onResume={handleResumeReading}
                onDismiss={handleDismissBanner}
                label={t().bookmarkResumePrompt(Math.round(savedBookmark()!.progress * 100))}
                resumeActionLabel={t().bookmarkResumeAction}
                dismissLabel={t().bookmarkDismissAction}
              />
            </Show>

            <nav class="article-top-nav" aria-label="Article navigation">
              <A href={backHref()} class="article-back-btn" title={t().backToArticles} aria-label={t().backToArticles} onClick={handleBack}>
                <Icon name="arrowLeft" size={18} />
              </A>
              <Button variant="ghost" size="small" onClick={handleShare} aria-label={t().shareArticle} class="article-share-btn">
                <Icon name="share" size={15} />
                <span>{t().shareArticle}</span>
              </Button>
            </nav>

            <header class="article-header">
              <Show when={post()!.coverImage}>
                <div class="article-hero-cover-wrapper">
                  <img
                    src={post()!.coverImage!}
                    alt={post()!.title}
                    class="article-hero-cover-image"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </Show>

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
            </header>

            <div class="article-body">
              <ArticleProse html={post()!.contentHtml ?? ''} />
            </div>

            <footer class="article-bottom-nav" aria-label="Article bottom navigation">
              <A href={backHref()} class="article-back-btn" title={t().backToArticles} aria-label={t().backToArticles} onClick={handleBack}>
                <Icon name="arrowLeft" size={18} />
              </A>
              <Button variant="ghost" size="small" onClick={handleShare} aria-label={t().shareArticle} class="article-share-btn">
                <Icon name="share" size={15} />
                <span>{t().shareArticle}</span>
              </Button>
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
