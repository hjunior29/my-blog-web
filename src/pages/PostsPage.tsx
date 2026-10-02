import { createSignal, createEffect, onCleanup, Show } from 'solid-js'
import { useSearchParams, useNavigate } from '@solidjs/router'
import { useI18n } from '../i18n/index.ts'
import { apiClient } from '../lib/api/client.ts'
import { mapPostSummaryToViewModel } from '../lib/api/mappers.ts'
import type { PostViewModel } from '../lib/api/types.ts'
import { PostGrid, Alert, EmptyState, Skeleton, Button, Pagination, SearchField, createBookTransition } from '../design-system'

const PAGE_SIZE = 12

export function PostsPage() {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { startTransition, abortTransition } = createBookTransition()

  const query = () => (searchParams.q as string) ?? ''
  const currentPage = () => {
    const p = parseInt((searchParams.page as string) ?? '1', 10)
    return Number.isNaN(p) || p < 1 ? 1 : p
  }

  const [posts, setPosts] = createSignal<PostViewModel[]>([])
  const [total, setTotal] = createSignal(0)
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string | null>(null)
  const [searchInput, setSearchInput] = createSignal(query())

  let sequence = 0
  let activeRequest: AbortController | undefined
  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  const fetchPosts = async () => {
    const requestId = ++sequence
    activeRequest?.abort()
    activeRequest = new AbortController()
    const signal = activeRequest.signal
    const language = locale()
    setLoading(true)
    setError(null)
    const q = query().trim()
    const page = currentPage()
    const offset = (page - 1) * PAGE_SIZE

    try {
      const res = q
        ? await apiClient.searchPosts(q, { limit: PAGE_SIZE, offset, signal })
        : await apiClient.getPosts({ limit: PAGE_SIZE, offset, signal })

      if (requestId !== sequence) return
      const mapped = res.items.map((dto) =>
        mapPostSummaryToViewModel(dto, language === 'pt' ? 'pt-BR' : 'en-US')
      )
      setPosts(mapped)
      setTotal(res.total)
    } catch {
      if (requestId !== sequence || signal.aborted) return
      setError(t().genericErrorMessage)
    } finally {
      if (requestId === sequence) setLoading(false)
    }
  }

  createEffect(() => {
    fetchPosts()
  })

  createEffect(() => {
    setSearchInput(query())
  })

  const handleSearchInput = (value: string) => {
    setSearchInput(value)
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      setSearchParams({ q: value.trim() || undefined, page: undefined }, { replace: true })
    }, 300)
  }

  const handleSearchSubmit = () => {
    clearTimeout(debounceTimer)
    setSearchParams({ q: searchInput().trim() || undefined, page: undefined })
  }

  const handleSearchClear = () => {
    clearTimeout(debounceTimer)
    setSearchInput('')
    setSearchParams({ q: undefined, page: undefined })
  }

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage > 1 ? String(newPage) : undefined })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOpenPost = (trigger: HTMLElement, index: number) => {
    const post = posts()[index]
    if (!post) return
    startTransition(trigger, post.title, () => {
      navigate(`/posts/${post.slug}`)
      window.scrollTo({ top: 0, behavior: 'instant' })
    })
  }

  onCleanup(() => {
    sequence++
    activeRequest?.abort()
    abortTransition()
    clearTimeout(debounceTimer)
  })

  return (
    <div class="posts-page">
      <header class="posts-page-header">
        <h1 class="posts-page-title">{t().navArticles}</h1>
        <p class="posts-page-subtitle">{t().closingSubtitle}</p>

        <div class="posts-search-wrapper">
          <SearchField
            value={searchInput()}
            placeholder={t().searchPlaceholder}
            label={t().searchLabel}
            clearLabel={t().searchClear}
            onInput={handleSearchInput}
            onSubmit={handleSearchSubmit}
            onClear={handleSearchClear}
          />
        </div>

        <Show when={!loading() && total() > 0}>
          <p class="posts-results-count">
            {t().searchResultsCount(total())}
          </p>
        </Show>
      </header>

      <Show when={!loading()} fallback={
        <div class="post-grid">
          <Skeleton label={t().loadingMessage} />
          <Skeleton label={t().loadingMessage} />
          <Skeleton label={t().loadingMessage} />
          <Skeleton label={t().loadingMessage} />
          <Skeleton label={t().loadingMessage} />
          <Skeleton label={t().loadingMessage} />
        </div>
      }>
        <Show when={!error()} fallback={
          <Alert title={t().error} error>
            <p>{error()}</p>
            <Button variant="ghost" onClick={fetchPosts}>
              {t().retryAction}
            </Button>
          </Alert>
        }>
          <Show when={posts().length > 0} fallback={
            <EmptyState
              title={t().noResultsTitle}
              description={t().noResultsDescription}
            >
              <Button variant="secondary" onClick={handleSearchClear}>
                {t().resetSearch}
              </Button>
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
              onOpen={handleOpenPost}
            />

            <Show when={total() > PAGE_SIZE}>
              <div class="posts-pagination-row">
                <Pagination
                  page={currentPage()}
                  total={total()}
                  limit={PAGE_SIZE}
                  onChange={handlePageChange}
                  label={t().page}
                  previous={t().previous}
                  next={t().next}
                />
              </div>
            </Show>
          </Show>
        </Show>
      </Show>
    </div>
  )
}
