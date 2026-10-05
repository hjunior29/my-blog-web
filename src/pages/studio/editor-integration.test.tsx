import { afterEach, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { Route, Router } from '@solidjs/router'
import { I18nProvider } from '../../i18n'
import { apiClient } from '../../lib/api'
import { StudioEditorPage } from './StudioEditorPage'

const post = {
  id: '1', slug: 'article', title: 'Article', summary: '', content_md: 'Body',
  content_html: '<p>Body</p>', featured_image_media_id: null,
  status: 'draft' as const, version: 1, published_at: null,
  created_at: 1, updated_at: 1, author_id: '1', tags: [],
}

const renderEditor = () => render(() => (
  <I18nProvider>
    <Router>
      <Route path="/studio/posts/new" component={StudioEditorPage} />
      <Route path="/studio/posts/:id/edit" component={StudioEditorPage} />
    </Router>
  </I18nProvider>
))

afterEach(() => vi.restoreAllMocks())

it('creates and publishes a new article with one publish action', async () => {
  window.history.pushState({}, '', '/studio/posts/new')
  vi.spyOn(apiClient, 'previewPost').mockResolvedValue({ content_html: '' })
  vi.spyOn(apiClient, 'getAdminPost').mockResolvedValue({ post, etag: '"1"' })
  const create = vi.spyOn(apiClient, 'createPost').mockResolvedValue({ post, etag: '"1"' })
  const publish = vi.spyOn(apiClient, 'publishPost').mockResolvedValue({
    post: { ...post, status: 'published', version: 2 }, etag: '"2"',
  })
  const screen = renderEditor()
  fireEvent.input(await screen.findByPlaceholderText(/Article title|Título do artigo/i), {
    target: { value: 'Article' },
  })
  fireEvent.click(await screen.findByText(/Publish article|Publicar artigo/i))
  await waitFor(() => expect(publish).toHaveBeenCalledWith('1', '"1"'))
  expect(create).toHaveBeenCalledTimes(1)
})

it('preserves unsaved text when unpublishing and saves with the new version', async () => {
  window.history.pushState({}, '', '/studio/posts/1/edit')
  vi.spyOn(apiClient, 'previewPost').mockResolvedValue({ content_html: '' })
  vi.spyOn(apiClient, 'getAdminPost').mockResolvedValue({
    post: { ...post, status: 'published' }, etag: '"1"',
  })
  vi.spyOn(apiClient, 'unpublishPost').mockResolvedValue({
    post: { ...post, version: 2 }, etag: '"2"',
  })
  const update = vi.spyOn(apiClient, 'updatePost').mockResolvedValue({
    post: { ...post, title: 'Unsaved title', version: 3 }, etag: '"3"',
  })
  const screen = renderEditor()
  fireEvent.input(await screen.findByDisplayValue('Article'), {
    target: { value: 'Unsaved title' },
  })
  const unpublishBtns = await screen.findAllByRole('button', { name: /Unpublish|Despublicar/i })
  fireEvent.click(unpublishBtns[0])
  fireEvent.click(await screen.findByText(/Save draft|Salvar rascunho/i))
  await waitFor(() => expect(update).toHaveBeenCalledWith('1',
    expect.objectContaining({ title: 'Unsaved title', version: 2 }), '"2"'))
})
