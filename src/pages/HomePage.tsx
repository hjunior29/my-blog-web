import { createSignal, onMount, For, Show } from 'solid-js'
import { A } from '@solidjs/router'
import { useI18n } from '../i18n/index.ts'
import { apiClient } from '../lib/api/client.ts'
import { mapPostSummaryToViewModel } from '../lib/api/mappers.ts'
import type { PostViewModel, TagWithCountDto } from '../lib/api/types.ts'
import { PostGrid, Author, Arrow, Alert, EmptyState, Skeleton, Button, Badge } from '../design-system'
import { NotebookArt } from '../design-system/editorial'

export function HomePage() {
  const { t, locale } = useI18n()

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

  return (
    <div class="home-page">
      <section class="home-hero">
        <div class="home-hero-content">
          <span class="eyebrow">{t().brandName}</span>
          <h1 class="home-hero-title">{t().heroTitle}</h1>
          <p class="home-hero-subtitle">{t().heroSubtitle}</p>
          <div class="home-hero-actions">
            <A href="/posts" class="button primary large">
              {t().heroCta}
              <Arrow />
            </A>
          </div>
        </div>

        <div class="home-hero-visual" aria-hidden="true">
          <NotebookArt compact motionLabel={t().pauseAnimations} />
        </div>
      </section>

      <section class="home-recent-section">
        <div class="section-header-row">
          <div>
            <h2>{t().recentArticlesTitle}</h2>
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
                }))}
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

      <section class="home-about-section">
        <div class="home-about-card">
          <Author name={t().brandName} description={t().aboutBriefBody} />
          <div class="home-about-action">
            <A href="/about" class="text-link">
              {t().aboutReadMore}
              <Arrow />
            </A>
          </div>
        </div>
      </section>

      <section class="home-closing-section">
        <div class="home-closing-card">
          <h3>{t().closingTitle}</h3>
          <p>{t().closingSubtitle}</p>
        </div>
      </section>
    </div>
  )
}
