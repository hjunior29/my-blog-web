import { createSignal, onMount, onCleanup, For, Show } from 'solid-js'
import { A, useNavigate } from '@solidjs/router'
import { useI18n } from '../i18n/index.ts'
import { apiClient } from '../lib/api/client.ts'
import { mapPostSummaryToViewModel } from '../lib/api/mappers.ts'
import { prefetchPost } from '../lib/api/postsCache.ts'
import type { PostViewModel, TagWithCountDto } from '../lib/api/types.ts'
import { PostGrid, Arrow, Alert, EmptyState, Skeleton, Button, Badge, Icon, PaperZoomScene, LetterScene, createBookTransition } from '../design-system'
import './home.css'

export function HomePage() {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const { startTransition, abortTransition } = createBookTransition()

  const [posts, setPosts] = createSignal<PostViewModel[]>([])
  const [tags, setTags] = createSignal<readonly TagWithCountDto[]>([])
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [postsRes, tagsRes] = await Promise.all([
        apiClient.getPosts({ limit: 3, offset: 0 }),
        apiClient.getTags().catch(() => [] as readonly TagWithCountDto[]),
      ])
      const viewModels = postsRes.items.map((dto) => mapPostSummaryToViewModel(dto, locale() === 'pt' ? 'pt-BR' : 'en-US'))
      setPosts(viewModels)
      setTags(tagsRes)
    } catch {
      setError(t().genericErrorMessage)
    } finally {
      setLoading(false)
    }
  }

  onMount(() => {
    loadData()
  })

  const handleOpenPost = (trigger: HTMLElement, index: number) => {
    const post = posts()[index]
    if (!post) return
    const currentLocale = locale() === 'pt' ? 'pt-BR' : 'en-US'
    const postPromise = prefetchPost(post.slug, currentLocale)
    startTransition(trigger, post.title, async () => {
      await postPromise.catch(() => null)
      navigate(`/posts/${post.slug}`)
      window.scrollTo({ top: 0, behavior: 'instant' })
    })
  }

  const handleHoverPost = (index: number) => {
    const post = posts()[index]
    if (post) prefetchPost(post.slug, locale() === 'pt' ? 'pt-BR' : 'en-US')
  }

  onCleanup(() => {
    abortTransition()
  })

  return (
    <div class="home-page">
      <PaperZoomScene
        class="home-notebook-scene"
        label={t().notebookLabel}
        intro={
          <section class="home-hero" aria-labelledby="home-hero-title">
            <div class="home-hero-inner">
              <h1 id="home-hero-title" class="home-hero-title">{t().heroTitle}</h1>
              <div class="home-hero-footer">
                <p class="home-hero-subtitle">{t().heroSubtitle}</p>
                <A href="/posts" class="button primary large">
                  {t().heroCta}
                  <Arrow />
                </A>
              </div>
            </div>
            <div class="home-hero-cue" aria-hidden="true">
              <span>{t().heroScrollCue}</span>
              <i />
            </div>
          </section>
        }
      >
        <div class="home-notebook">
          <span class="eyebrow home-notebook-kicker">{t().notebookKicker}</span>
          <h2 class="home-notebook-title">{t().notebookTitle}</h2>
          <p class="home-notebook-lead">{t().notebookLead}</p>
          <section class="home-notebook-block" aria-labelledby="home-notebook-topics">
            <h3 id="home-notebook-topics" class="home-notebook-label">{t().notebookTopicsTitle}</h3>
            <ol class="home-notebook-topics">
              <For each={t().notebookTopics}>
                {(entry, index) => (
                  <li>
                    <span class="section-number">{String(index() + 1).padStart(2, '0')}</span>
                    <h4>{entry.title}</h4>
                    <p>{entry.body}</p>
                  </li>
                )}
              </For>
            </ol>
          </section>
          <section class="home-notebook-block" aria-labelledby="home-notebook-stack">
            <h3 id="home-notebook-stack" class="home-notebook-label">{t().notebookStackTitle}</h3>
            <p class="home-notebook-text">{t().notebookStack}</p>
          </section>
          <section class="home-notebook-block" aria-labelledby="home-notebook-rules">
            <h3 id="home-notebook-rules" class="home-notebook-label">{t().notebookRulesTitle}</h3>
            <ul class="home-notebook-rules">
              <For each={t().notebookRules}>
                {(rule) => (
                  <li>
                    <Icon name="asterisk" size={16} />
                    <span>{rule}</span>
                  </li>
                )}
              </For>
            </ul>
          </section>
        </div>
      </PaperZoomScene>

      <div class="home-flow">
        <section class="home-recent-section">
          <div class="section-header-row">
            <div class="home-section-heading">
              <h2>{t().recentArticlesTitle}</h2>
              <p class="section-description">{t().recentArticlesSubtitle}</p>
            </div>
            <A href="/posts" class="text-link">
              {t().allArticlesLink}
              <Arrow />
            </A>
          </div>

          <Show when={!loading()} fallback={
            <div class="post-grid">
              <Skeleton label={t().loadingMessage} />
              <Skeleton label={t().loadingMessage} />
              <Skeleton label={t().loadingMessage} />
            </div>
          }>
            <Show when={!error()} fallback={
              <Alert title={t().error} error>
                <p>{error()}</p>
                <Button variant="ghost" onClick={loadData}>
                  {t().retryAction}
                </Button>
              </Alert>
            }>
              <Show when={posts().length > 0} fallback={
                <EmptyState title={t().empty} description={t().emptyStateMessage}>
                  <A href="/about" class="button secondary">
                    {t().aboutReadMore}
                  </A>
                </EmptyState>
              }>
                <PostGrid
                  posts={posts().map((post) => ({
                    title: post.title,
                    description: post.description,
                    category: post.category,
                    date: post.formattedDate,
                    readingTime: `${post.readingTimeMinutes} min`,
                    slug: post.slug,
                    bookColor: post.bookColor,
                    coverImage: post.coverImage ?? undefined,
                  }))}
                  onOpen={handleOpenPost}
                  onHover={handleHoverPost}
                />
              </Show>
            </Show>
          </Show>
        </section>

        <Show when={tags().length > 0}>
          <section class="home-topics-section">
            <h2>{t().topicsTitle}</h2>
            <p class="section-description">{t().topicsSubtitle}</p>
            <div class="topics-cloud">
              <For each={tags()}>
                {(tag) => (
                  <A href={`/posts?q=${encodeURIComponent(tag.name)}`} class="topic-tag-item">
                    <Badge accent>{tag.name}</Badge>
                    <span class="topic-count">{tag.post_count}</span>
                  </A>
                )}
              </For>
            </div>
          </section>
        </Show>
      </div>

      <LetterScene
        class="home-letter-scene"
        label={t().letterLabel}
        recipientLabel={t().letterRecipientLabel}
        recipient={t().letterRecipient}
        sender={t().letterSender}
        postmark={t().letterPostmark}
        foldedLabel={t().letterFoldedLabel}
        heading={
          <>
            <span class="eyebrow home-letter-eyebrow">{t().letterEyebrow}</span>
            <h2 class="home-letter-heading">{t().letterHeading}</h2>
          </>
        }
        opening={
          <>
            <div class="home-letter-head">
              <span class="home-letter-mark" aria-hidden="true">h.</span>
              <span class="eyebrow">{t().letterLabel}</span>
            </div>
            <p class="home-letter-greeting">{t().letterGreeting}</p>
          </>
        }
        body={<For each={t().letterBody}>{(paragraph) => <p class="home-letter-paragraph">{paragraph}</p>}</For>}
        closing={
          <>
            <p class="home-letter-closing">{t().letterClosing}</p>
            <p class="home-letter-signature">{t().letterSignature}</p>
            <div class="home-letter-footer">
              <A href="/about" class="text-link">
                {t().aboutReadMore}
                <Arrow />
              </A>
              <p class="home-letter-postscript">{t().letterPostscript}</p>
            </div>
          </>
        }
      />
    </div>
  )
}
