import { A } from '@solidjs/router'
import { createEffect, createSignal, For, Show } from 'solid-js'
import { useI18n } from '../../i18n'
import { apiClient, formatDate, unixSecondsToMs, type PostSummaryResponse, type PostStatus } from '../../lib/api'
import { Alert, Button, Dialog, EmptyState, Icon, Pagination, Skeleton, StatusBadge, Toast } from '../../design-system'
import './studio-posts.css'

const PAGE_SIZE = 10

type FilterStatus = PostStatus | 'all'

export function StudioPostsPage() {
  const { t, locale } = useI18n()
  const [posts, setPosts] = createSignal<readonly PostSummaryResponse[]>([])
  const [total, setTotal] = createSignal(0)
  const [page, setPage] = createSignal(1)
  const [statusFilter, setStatusFilter] = createSignal<FilterStatus>('all')
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string | null>(null)

  const [postToDelete, setPostToDelete] = createSignal<PostSummaryResponse | null>(null)
  const [isDeleting, setIsDeleting] = createSignal(false)
  const [deleteError, setDeleteError] = createSignal<string | null>(null)
  const [toastMessage, setToastMessage] = createSignal<string | null>(null)

  const fetchPosts = async () => {
    setLoading(true)
    setError(null)
    try {
      const currentFilter = statusFilter()
      const offset = (page() - 1) * PAGE_SIZE
      const res = await apiClient.getAdminPosts({
        limit: PAGE_SIZE,
        offset,
        status: currentFilter === 'all' ? undefined : currentFilter,
      })
      setPosts(res.items)
      setTotal(res.total)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t().genericErrorMessage
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  createEffect(() => {
    statusFilter()
    page()
    fetchPosts()
  })

  const handleFilterChange = (newStatus: FilterStatus) => {
    setStatusFilter(newStatus)
    setPage(1)
  }

  const handleConfirmDelete = async () => {
    const target = postToDelete()
    if (!target) return

    setIsDeleting(true)
    setDeleteError(null)
    try {
      const postId = String(target.id)
      const etag = target.version === undefined ? (await apiClient.getAdminPost(postId)).etag : `"${target.version}"`
      await apiClient.deletePost(postId, etag)
      setToastMessage(t().postDeletedSuccess)
      setPostToDelete(null)

      if (posts().length === 1 && page() > 1) {
        setPage(p => p - 1)
      } else {
        await fetchPosts()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t().genericErrorMessage
      setDeleteError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div class="studio-posts-page">
      <div class="section-header-row">
        <div>
          <h1 class="serif">{t().studioPostsTitle}</h1>
        </div>
        <A href="/studio/posts/new" class="button primary">
          <Icon name="plus" size={16} />
          {t().newPostButton}
        </A>
      </div>

      <div class="studio-filters-bar" role="tablist" aria-label={t().studioPostsTitle}>
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter() === 'all'}
          class={`filter-tab ${statusFilter() === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterChange('all')}
        >
          {t().statusAll}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter() === 'draft'}
          class={`filter-tab ${statusFilter() === 'draft' ? 'active' : ''}`}
          onClick={() => handleFilterChange('draft')}
        >
          {t().statusDraft}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter() === 'published'}
          class={`filter-tab ${statusFilter() === 'published' ? 'active' : ''}`}
          onClick={() => handleFilterChange('published')}
        >
          {t().statusPublished}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter() === 'scheduled'}
          class={`filter-tab ${statusFilter() === 'scheduled' ? 'active' : ''}`}
          onClick={() => handleFilterChange('scheduled')}
        >
          {t().statusScheduled}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter() === 'archived'}
          class={`filter-tab ${statusFilter() === 'archived' ? 'active' : ''}`}
          onClick={() => handleFilterChange('archived')}
        >
          {t().statusArchived}
        </button>
      </div>

      <Show when={error()}>
        <div class="studio-error-container">
          <Alert error title={t().genericErrorMessage}>
            <p>{error()}</p>
            <Button variant="secondary" onClick={fetchPosts} class="retry-button">
              <Icon name="retry" size={14} />
              {t().retryAction}
            </Button>
          </Alert>
        </div>
      </Show>

      <div class="studio-table-container">
        <Show when={loading() && posts().length === 0}>
          <div class="studio-table-loading" aria-busy="true">
            <Skeleton label={t().loadingMessage} />
            <Skeleton label={t().loadingMessage} />
            <Skeleton label={t().loadingMessage} />
          </div>
        </Show>

        <Show when={!loading() && posts().length === 0 && !error()}>
          <EmptyState title={t().studioPostsTitle} description={t().emptyStateMessage}>
            <A href="/studio/posts/new" class="button primary">
              <Icon name="plus" size={16} />
              {t().newPostButton}
            </A>
          </EmptyState>
        </Show>

        <Show when={posts().length > 0}>
          <table class="studio-table">
            <thead>
              <tr>
                <th scope="col" class="th-title">{t().tableHeaderTitle}</th>
                <th scope="col" class="th-status">{t().tableHeaderStatus}</th>
                <th scope="col" class="th-tags">{t().tableHeaderTags}</th>
                <th scope="col" class="th-updated">{t().tableHeaderUpdated}</th>
                <th scope="col" class="th-actions">{t().tableHeaderActions}</th>
              </tr>
            </thead>
            <tbody>
              <For each={posts()}>
                {post => (
                  <tr class="studio-table-row">
                    <td class="td-title">
                      <A href={`/studio/posts/${post.id}/edit`} class="post-title-link">
                        {post.title}
                      </A>
                      <Show when={post.summary}>
                        <p class="post-summary-preview">{post.summary}</p>
                      </Show>
                    </td>
                    <td class="td-status">
                      <StatusBadge status={post.status} />
                    </td>
                    <td class="td-tags">
                      <div class="table-tags-list">
                        <For each={post.tags}>
                          {tag => (
                            <span class="table-tag-chip">
                              {typeof tag === 'string' ? tag : tag.name}
                            </span>
                          )}
                        </For>
                        <Show when={!post.tags || post.tags.length === 0}>
                          <span class="muted-dash">—</span>
                        </Show>
                      </div>
                    </td>
                    <td class="td-updated">
                      <time datetime={new Date(unixSecondsToMs(post.updated_at) ?? Date.now()).toISOString()}>
                        {formatDate(unixSecondsToMs(post.updated_at), locale())}
                      </time>
                    </td>
                    <td class="td-actions">
                      <div class="row-actions">
                        <A
                          href={`/studio/posts/${post.id}/edit`}
                          class="action-btn"
                          aria-label={`${t().editAction}: ${post.title}`}
                          title={t().editAction}
                        >
                          <Icon name="edit" size={16} />
                        </A>
                        <button
                          type="button"
                          class="action-btn danger"
                          onClick={() => {
                            setDeleteError(null)
                            setPostToDelete(post)
                          }}
                          aria-label={`${t().deleteAction}: ${post.title}`}
                          title={t().deleteAction}
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </div>

      <Show when={total() > PAGE_SIZE}>
        <div class="studio-pagination-wrapper">
          <Pagination
            page={page()}
            total={total()}
            limit={PAGE_SIZE}
            onChange={setPage}
          />
        </div>
      </Show>

      <Dialog
        open={postToDelete() !== null}
        title={t().deleteConfirmTitle}
        badge="Danger"
        closeLabel={t().cancelAction}
        onClose={() => {
          if (!isDeleting()) {
            setPostToDelete(null)
            setDeleteError(null)
          }
        }}
      >
        <div class="delete-dialog-content">
          <p class="delete-warning-text">
            {t().deleteConfirmMessage(postToDelete()?.title ?? '')}
          </p>

          <Show when={deleteError()}>
            <Alert error title={t().genericErrorMessage}>
              <p>{deleteError()}</p>
            </Alert>
          </Show>

          <div class="dialog-actions-row">
            <Button
              variant="primary"
              busy={isDeleting()}
              disabled={isDeleting()}
              onClick={handleConfirmDelete}
              class="danger-button"
            >
              {t().deleteConfirmButton}
            </Button>
          </div>
        </div>
      </Dialog>

      <Toast
        message={toastMessage() ?? ''}
        closeLabel={t().cancelAction}
        onClose={() => setToastMessage(null)}
      />
    </div>
  )
}
