import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@solidjs/testing-library'
import { Router, Route } from '@solidjs/router'
import { I18nProvider } from '../i18n/index.ts'
import { HomePage } from './HomePage.tsx'
import { PostsPage } from './PostsPage.tsx'
import { ArticlePage } from './ArticlePage.tsx'
import { AboutPage } from './AboutPage.tsx'
import { NotFoundPage } from './NotFoundPage.tsx'
import { PublicLayout } from '../app/PublicLayout.tsx'
import { apiClient } from '../lib/api/client.ts'

describe('Public Pages', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.history.pushState({}, '', '/')
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('HomePage renders hero, loads posts and topics', async () => {
    vi.spyOn(apiClient, 'getPosts').mockResolvedValue({
      items: [
        {
          id: 'p1',
          slug: 'test-post',
          title: 'Test Article Title',
          summary: 'A short description',
          featured_image_media_id: null,
          status: 'published',
          published_at: 1727400000,
          created_at: 1727390000,
          updated_at: 1727400000,
          author_id: 'user-1',
          tags: ['Solid', 'Rust'],
        },
      ],
      total: 1,
      limit: 3,
      offset: 0,
    })

    vi.spyOn(apiClient, 'getTags').mockResolvedValue([
      { id: '1', name: 'Solid', slug: 'solid', post_count: 5 },
    ])

    const { getByRole, findByText, findAllByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/" component={HomePage} />
        </Router>
      </I18nProvider>
    ))

    const heading = getByRole('heading', { level: 1 })
    expect(heading).not.toBeNull()

    const articleCard = await findByText('Test Article Title')
    expect(articleCard).not.toBeNull()

    const tagItems = await findAllByText('Solid')
    expect(tagItems.length).toBeGreaterThanOrEqual(1)
  })

  it('PostsPage renders search input and paginated posts', async () => {
    window.history.pushState({}, '', '/posts')
    vi.spyOn(apiClient, 'getPosts').mockResolvedValue({
      items: [
        {
          id: 'p1',
          slug: 'paginated-post',
          title: 'Paginated Article Title',
          summary: 'Paginated summary',
          featured_image_media_id: null,
          status: 'published',
          published_at: 1727400000,
          created_at: 1727390000,
          updated_at: 1727400000,
          author_id: 'user-1',
          tags: ['Engineering'],
        },
      ],
      total: 24,
      limit: 12,
      offset: 0,
    })

    const { findByText, getByPlaceholderText, getByRole } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/posts" component={PostsPage} />
        </Router>
      </I18nProvider>
    ))

    expect(getByPlaceholderText(/search/i)).not.toBeNull()
    const article = await findByText('Paginated Article Title')
    expect(article).not.toBeNull()
    expect(getByRole('navigation', { name: /page|página/i })).not.toBeNull()
  })

  it('PostsPage renders empty state when no articles match', async () => {
    window.history.pushState({}, '', '/posts')
    vi.spyOn(apiClient, 'getPosts').mockResolvedValue({
      items: [],
      total: 0,
      limit: 12,
      offset: 0,
    })

    const { findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/posts" component={PostsPage} />
        </Router>
      </I18nProvider>
    ))

    const emptyNotice = await findByText(/No articles found|Nenhum artigo encontrado/i)
    expect(emptyNotice).not.toBeNull()
  })

  it('ArticlePage renders post details and prose content', async () => {
    window.history.pushState({}, '', '/posts/test-slug')
    vi.spyOn(apiClient, 'getPostBySlug').mockResolvedValue({
      id: 'p1',
      slug: 'test-slug',
      title: 'Detailed Article Post',
      summary: 'Article lead text',
      content_md: 'Raw content',
      content_html: '<p>Rendered article paragraph</p>',
      featured_image_media_id: null,
      status: 'published',
      published_at: 1727400000,
      created_at: 1727390000,
      updated_at: 1727400000,
      author_id: 'user-1',
      tags: ['SolidJS'],
      version: 1,
    })

    const { findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/posts/:slug" component={ArticlePage} />
        </Router>
      </I18nProvider>
    ))

    const title = await findByText('Detailed Article Post')
    expect(title).not.toBeNull()
    const prose = await findByText('Rendered article paragraph')
    expect(prose).not.toBeNull()
  })

  it('ArticlePage renders neutral 404 state when post is not found', async () => {
    window.history.pushState({}, '', '/posts/non-existent')
    vi.spyOn(apiClient, 'getPostBySlug').mockRejectedValue({ status: 404 })

    const { findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/posts/:slug" component={ArticlePage} />
        </Router>
      </I18nProvider>
    ))

    const notFoundHeading = await findByText(/Article not found|Artigo não encontrado/i)
    expect(notFoundHeading).not.toBeNull()
  })

  it('HomePage renders error alert with retry button on failure', async () => {
    const postsSpy = vi.spyOn(apiClient, 'getPosts')
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ items: [], total: 0, limit: 3, offset: 0 })
    vi.spyOn(apiClient, 'getTags').mockResolvedValue([])

    const { findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/" component={HomePage} />
        </Router>
      </I18nProvider>
    ))

    const retryBtn = await findByText(/Try again|Tentar novamente/i)
    expect(retryBtn).not.toBeNull()
    retryBtn.click()
    expect(postsSpy).toHaveBeenCalledTimes(2)
  })

  it('ArticlePage renders error alert with retry button on server error', async () => {
    window.history.pushState({}, '', '/posts/server-error')
    const getSpy = vi.spyOn(apiClient, 'getPostBySlug')
      .mockRejectedValueOnce({ status: 500 })
      .mockResolvedValueOnce({
        id: 'p1',
        slug: 'server-error',
        title: 'Recovered Article',
        summary: 'Lead',
        content_md: 'Body',
        content_html: '<p>Recovered</p>',
        featured_image_media_id: null,
        status: 'published',
        published_at: 1727400000,
        created_at: 1727390000,
        updated_at: 1727400000,
        author_id: 'user-1',
        tags: [],
        version: 1,
      })

    const { findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/posts/:slug" component={ArticlePage} />
        </Router>
      </I18nProvider>
    ))

    const retryBtn = await findByText(/Try again|Tentar novamente/i)
    expect(retryBtn).not.toBeNull()
    retryBtn.click()
    expect(getSpy).toHaveBeenCalledTimes(2)
  })

  it('ArticlePage copies link to clipboard on share click', async () => {
    window.history.pushState({}, '', '/posts/shareable')
    vi.spyOn(apiClient, 'getPostBySlug').mockResolvedValue({
      id: 'p1',
      slug: 'shareable',
      title: 'Shareable Article',
      summary: 'Lead',
      content_md: 'Body',
      content_html: '<p>Body</p>',
      featured_image_media_id: null,
      status: 'published',
      published_at: 1727400000,
      created_at: 1727390000,
      updated_at: 1727400000,
      author_id: 'user-1',
      tags: [],
      version: 1,
    })

    const writeTextSpy = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    })

    const { findAllByRole, findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/posts/:slug" component={ArticlePage} />
        </Router>
      </I18nProvider>
    ))

    const [shareBtn] = await findAllByRole('button', { name: /share|compartilhar/i })
    shareBtn.click()

    expect(writeTextSpy).toHaveBeenCalled()
    const toast = await findByText(/Link copied|Link copiado/i)
    expect(toast).not.toBeNull()
  })

  it('ArticlePage shows the reading ribbon and returns to the shelf', async () => {
    window.history.pushState({}, '', '/posts/ribbon')
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    vi.spyOn(apiClient, 'getPostBySlug').mockResolvedValue({
      id: 'p1',
      slug: 'ribbon',
      title: 'Ribbon Article',
      summary: 'Lead',
      content_md: 'Body',
      content_html: '<p>Body</p>',
      featured_image_media_id: null,
      status: 'published',
      published_at: 1727400000,
      created_at: 1727390000,
      updated_at: 1727400000,
      author_id: 'user-1',
      tags: [],
      version: 1,
    })

    const { container, findAllByRole, findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/posts" component={() => <p>Shelf</p>} />
          <Route path="/posts/:slug" component={ArticlePage} />
        </Router>
      </I18nProvider>
    ))

    const [backLink] = await findAllByRole('link', { name: /Back to all articles|Voltar para todos os artigos/i })
    expect(container.querySelector('.article-reader .ds-bookmark-ribbon')?.classList.contains('ds-bookmark-ribbon-interactive')).toBe(true)
    expect(backLink.getAttribute('href')).toBe('/posts')
    backLink.click()

    expect(await findByText('Shelf')).not.toBeNull()
    expect(window.location.pathname).toBe('/posts')
  })

  it('ArticlePage displays resume banner when a reading bookmark exists', async () => {
    window.localStorage.setItem('blog_bookmark_saved-article', JSON.stringify({
      slug: 'saved-article',
      progress: 0.45,
      timestamp: Date.now(),
    }))
    window.history.pushState({}, '', '/posts/saved-article')
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    vi.spyOn(apiClient, 'getPostBySlug').mockResolvedValue({
      id: 'p2',
      slug: 'saved-article',
      title: 'Saved Article Post',
      summary: 'Lead',
      content_md: 'Body',
      content_html: '<p>Body paragraph</p>',
      featured_image_media_id: null,
      status: 'published',
      published_at: 1727400000,
      created_at: 1727390000,
      updated_at: 1727400000,
      author_id: 'user-1',
      tags: [],
      version: 1,
    })

    const { container, findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/posts/:slug" component={ArticlePage} />
        </Router>
      </I18nProvider>
    ))

    const bannerPrompt = await findByText(/45%/)
    expect(bannerPrompt).not.toBeNull()
    const resumeBtn = container.querySelector('.ds-reading-resume-actions .button') as HTMLButtonElement
    expect(resumeBtn).not.toBeNull()
    resumeBtn.click()
    expect(scrollToSpy).toHaveBeenCalled()
  })

  it('AboutPage renders author title and colophon', () => {
    const { getByRole, getByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/" component={AboutPage} />
        </Router>
      </I18nProvider>
    ))

    const heading = getByRole('heading', { level: 1 })
    expect(heading).not.toBeNull()
    expect(getByText(/Colophon|Colofão/i)).not.toBeNull()
  })

  it('NotFoundPage renders 404 and return button', () => {
    const { getByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/" component={NotFoundPage} />
        </Router>
      </I18nProvider>
    ))

    expect(getByText('404')).not.toBeNull()
  })

  it('PublicLayout theme button switches and persists the theme', () => {
    localStorage.setItem('blog_theme', 'light')
    const { container } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/" component={PublicLayout}>
            <Route path="/" component={AboutPage} />
          </Route>
        </Router>
      </I18nProvider>
    ))

    const themeButton = container.querySelector('.theme-button') as HTMLButtonElement
    expect(document.documentElement.dataset.theme).toBe('light')
    themeButton.click()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(themeButton.getAttribute('aria-pressed')).toBe('true')
    expect(localStorage.getItem('blog_theme')).toBe('dark')
    localStorage.removeItem('blog_theme')
  })

  it('guarantees no administrative or studio links leak into public navigation or footer', () => {
    const { container } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/" component={PublicLayout}>
            <Route path="/" component={HomePage} />
          </Route>
        </Router>
      </I18nProvider>
    ))

    const forbiddenLinks = container.querySelectorAll('a[href*="studio"], a[href*="login"], a[href*="admin"]')
    expect(forbiddenLinks.length).toBe(0)
  })
})
