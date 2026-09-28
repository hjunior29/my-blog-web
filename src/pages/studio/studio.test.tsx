import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, waitFor } from '@solidjs/testing-library'
import { Router, Route } from '@solidjs/router'
import { I18nProvider } from '../../i18n'
import { apiClient, ApiError } from '../../lib/api'
import { authStore } from '../../lib/auth'
import { StudioPostsPage } from './StudioPostsPage'
import { StudioEditorPage } from './StudioEditorPage'
import { StudioAccountPage } from './StudioAccountPage'

if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function () {
    this.open = false
  }
}

const mockPost = {
  id: 'post-1',
  slug: 'test-article',
  title: 'Test Article',
  summary: 'A short summary',
  content_md: '# Hello world',
  content_html: '<h1>Hello world</h1>',
  featured_image_media_id: null,
  status: 'draft' as const,
  version: 1,
  published_at: null,
  created_at: 1727400000,
  updated_at: 1727400000,
  author_id: 'user-1',
  tags: [{ id: 'tag-1', name: 'tech', slug: 'tech' }],
}

describe('StudioPostsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.history.pushState({}, '', '/studio/posts')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders title, loads posts and displays them in table', async () => {
    vi.spyOn(apiClient, 'getAdminPosts').mockResolvedValue({
      items: [mockPost],
      total: 1,
      limit: 10,
      offset: 0,
    })

    const { findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/studio/posts" component={StudioPostsPage} />
        </Router>
      </I18nProvider>
    ))

    expect(await findByText('Test Article')).not.toBeNull()
    expect(await findByText('tech')).not.toBeNull()
  })

  it('filters posts by status when tab is clicked', async () => {
    const getAdminPostsSpy = vi.spyOn(apiClient, 'getAdminPosts').mockResolvedValue({
      items: [mockPost],
      total: 1,
      limit: 10,
      offset: 0,
    })

    const { getByRole } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/studio/posts" component={StudioPostsPage} />
        </Router>
      </I18nProvider>
    ))

    const publishedTab = getByRole('tab', { name: /Published|Publicado/i })
    fireEvent.click(publishedTab)

    await waitFor(() => {
      expect(getAdminPostsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'published', offset: 0 }),
      )
    })
  })

  it('renders empty state when no posts exist', async () => {
    vi.spyOn(apiClient, 'getAdminPosts').mockResolvedValue({
      items: [],
      total: 0,
      limit: 10,
      offset: 0,
    })

    const { findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/studio/posts" component={StudioPostsPage} />
        </Router>
      </I18nProvider>
    ))

    expect(await findByText(/No items available|Nenhum item/i)).not.toBeNull()
  })

  it('handles post deletion flow with confirmation', async () => {
    vi.spyOn(apiClient, 'getAdminPosts').mockResolvedValue({
      items: [mockPost],
      total: 1,
      limit: 10,
      offset: 0,
    })
    vi.spyOn(apiClient, 'getAdminPost').mockResolvedValue({
      post: mockPost,
      etag: '"1"',
    })
    const deleteSpy = vi.spyOn(apiClient, 'deletePost').mockResolvedValue(undefined)

    const { findByTitle, findByText, getByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/studio/posts" component={StudioPostsPage} />
        </Router>
      </I18nProvider>
    ))

    const deleteBtn = await findByTitle(/Delete|Excluir/i)
    fireEvent.click(deleteBtn)

    expect(await findByText(/Permanently delete article|Excluir artigo definitivamente/i)).not.toBeNull()

    const confirmBtn = getByText(/Confirm deletion|Confirmar exclusão/i)
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('post-1', '"1"')
    })
  })
})

describe('StudioEditorPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.history.pushState({}, '', '/studio/posts/new')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders empty editor for new article', async () => {
    const { findByPlaceholderText, findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/studio/posts/new" component={StudioEditorPage} />
        </Router>
      </I18nProvider>
    ))

    expect(await findByText(/New article|Novo artigo/i)).not.toBeNull()
    const input = await findByPlaceholderText(/Article title|Título do artigo/i)
    expect((input as HTMLInputElement).value).toBe('')
  })

  it('creates draft post on save', async () => {
    const createSpy = vi.spyOn(apiClient, 'createPost').mockResolvedValue({
      post: { ...mockPost, id: 'created-id' },
      etag: '"1"',
    })

    const { findByPlaceholderText, findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/studio/posts/new" component={StudioEditorPage} />
        </Router>
      </I18nProvider>
    ))

    const titleInput = await findByPlaceholderText(/Article title|Título do artigo/i)
    fireEvent.input(titleInput, { target: { value: 'My New Awesome Post' } })

    const saveDraftBtn = await findByText(/Save draft|Salvar rascunho/i)
    fireEvent.click(saveDraftBtn)

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'My New Awesome Post',
          status: 'draft',
        }),
      )
    })
  })

  it('loads existing post in edit mode and updates it', async () => {
    window.history.pushState({}, '', '/studio/posts/post-1/edit')

    vi.spyOn(apiClient, 'getAdminPost').mockResolvedValue({
      post: mockPost,
      etag: '"1"',
    })
    const updateSpy = vi.spyOn(apiClient, 'updatePost').mockResolvedValue({
      post: { ...mockPost, version: 2 },
      etag: '"2"',
    })

    const { findByDisplayValue, findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/studio/posts/:id/edit" component={StudioEditorPage} />
        </Router>
      </I18nProvider>
    ))

    expect(await findByDisplayValue('Test Article')).not.toBeNull()

    const saveDraftBtn = await findByText(/Save draft|Salvar rascunho/i)
    fireEvent.click(saveDraftBtn)

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        'post-1',
        expect.objectContaining({
          title: 'Test Article',
          version: 1,
        }),
        '"1"',
      )
    })
  })

  it('handles OCC 412 version conflict by showing conflict modal', async () => {
    window.history.pushState({}, '', '/studio/posts/post-1/edit')

    vi.spyOn(apiClient, 'getAdminPost').mockResolvedValue({
      post: mockPost,
      etag: '"1"',
    })
    vi.spyOn(apiClient, 'updatePost').mockRejectedValue(
      new ApiError(412, 'conflict', 'Conflict version mismatch'),
    )

    const { findByDisplayValue, findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/studio/posts/:id/edit" component={StudioEditorPage} />
        </Router>
      </I18nProvider>
    ))

    await findByDisplayValue('Test Article')

    const saveDraftBtn = await findByText(/Save draft|Salvar rascunho/i)
    fireEvent.click(saveDraftBtn)

    expect(await findByText(/Version conflict detected|Conflito de versão detectado/i)).not.toBeNull()
  })

  it('publishes article when publish button is clicked', async () => {
    window.history.pushState({}, '', '/studio/posts/post-1/edit')

    vi.spyOn(apiClient, 'getAdminPost').mockResolvedValue({
      post: mockPost,
      etag: '"1"',
    })
    const publishSpy = vi.spyOn(apiClient, 'publishPost').mockResolvedValue({
      post: { ...mockPost, status: 'published', version: 2 },
      etag: '"2"',
    })

    const { findByDisplayValue, findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/studio/posts/:id/edit" component={StudioEditorPage} />
        </Router>
      </I18nProvider>
    ))

    await findByDisplayValue('Test Article')

    const publishBtn = await findByText(/Publish article|Publicar artigo/i)
    fireEvent.click(publishBtn)

    await waitFor(() => {
      expect(publishSpy).toHaveBeenCalledWith('post-1', '"1"')
    })
  })
})

describe('StudioAccountPage', () => {
  const mockUser = {
    id: 'user-1',
    email: 'admin@blog.local',
    display_name: 'Helder',
    bio: 'Software Craftsman',
    role: 'owner' as const,
    status: 'active' as const,
    created_at: 1727400000,
    updated_at: 1727400000,
  }

  const mockSessions = [
    {
      id: 'session-1',
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0 Chrome/128',
      created_at: 1727400000,
      expires_at: 1727486400,
      is_current: true,
    },
    {
      id: 'session-2',
      ip_address: '192.168.1.10',
      user_agent: 'Safari/17.0',
      created_at: 1727390000,
      expires_at: 1727476400,
      is_current: false,
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    window.history.pushState({}, '', '/studio/account')
    authStore.setUser(mockUser)
    authStore.setStatus('authenticated')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders account page, profile data, and active sessions', async () => {
    vi.spyOn(apiClient, 'getCurrentUser').mockResolvedValue(mockUser)
    vi.spyOn(apiClient, 'getSessions').mockResolvedValue({ items: mockSessions })

    const { findByDisplayValue, findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/studio/account" component={StudioAccountPage} />
        </Router>
      </I18nProvider>
    ))

    expect(await findByDisplayValue('Helder')).not.toBeNull()
    expect(await findByText('Mozilla/5.0 Chrome/128')).not.toBeNull()
    expect(await findByText(/This session|Esta sessão/i)).not.toBeNull()
  })

  it('updates profile successfully', async () => {
    vi.spyOn(apiClient, 'getCurrentUser').mockResolvedValue(mockUser)
    vi.spyOn(apiClient, 'getSessions').mockResolvedValue({ items: mockSessions })
    const updateSpy = vi.spyOn(apiClient, 'updateProfile').mockResolvedValue({
      ...mockUser,
      display_name: 'Helder Updated',
    })

    const { findByDisplayValue, findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/studio/account" component={StudioAccountPage} />
        </Router>
      </I18nProvider>
    ))

    const nameInput = await findByDisplayValue('Helder')
    fireEvent.input(nameInput, { target: { value: 'Helder Updated' } })

    const saveBtn = await findByText(/Save profile|Salvar perfil/i)
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ display_name: 'Helder Updated' }),
      )
    })
  })

  it('changes password when form is valid', async () => {
    vi.spyOn(apiClient, 'getCurrentUser').mockResolvedValue(mockUser)
    vi.spyOn(apiClient, 'getSessions').mockResolvedValue({ items: mockSessions })
    const changePasswordSpy = vi.spyOn(apiClient, 'changePassword').mockResolvedValue(undefined)

    const { container, findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/studio/account" component={StudioAccountPage} />
        </Router>
      </I18nProvider>
    ))

    const currentPwdInput = container.querySelector('#current-password') as HTMLInputElement
    const newPwdInput = container.querySelector('#new-password') as HTMLInputElement
    const confirmPwdInput = container.querySelector('#confirm-password') as HTMLInputElement

    fireEvent.input(currentPwdInput, { target: { value: 'OldPassword123!' } })
    fireEvent.input(newPwdInput, { target: { value: 'NewSecurePassword123!' } })
    fireEvent.input(confirmPwdInput, { target: { value: 'NewSecurePassword123!' } })

    const updatePwdBtn = await findByText(/Update password|Atualizar senha/i)
    fireEvent.click(updatePwdBtn)

    await waitFor(() => {
      expect(changePasswordSpy).toHaveBeenCalledWith({
        current_password: 'OldPassword123!',
        new_password: 'NewSecurePassword123!',
      })
    })
  })

  it('revokes non-current session', async () => {
    vi.spyOn(apiClient, 'getCurrentUser').mockResolvedValue(mockUser)
    vi.spyOn(apiClient, 'getSessions').mockResolvedValue({ items: mockSessions })
    const revokeSpy = vi.spyOn(apiClient, 'revokeSession').mockResolvedValue(undefined)

    const { findByLabelText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/studio/account" component={StudioAccountPage} />
        </Router>
      </I18nProvider>
    ))

    const revokeBtn = await findByLabelText(/Revoke session: session-2|Revogar sessão: session-2/i)
    fireEvent.click(revokeBtn)

    await waitFor(() => {
      expect(revokeSpy).toHaveBeenCalledWith('session-2')
    })
  })
})
