import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { apiClient, setCsrfToken, getStoredCsrfToken } from './client.ts'
import { ApiError } from './errors.ts'

describe('apiClient', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    setCsrfToken(null)
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('getPosts sends query parameters and returns data', async () => {
    const mockResponse = {
      items: [],
      total: 0,
      limit: 10,
      offset: 0,
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockResponse,
    })

    const res = await apiClient.getPosts({ limit: 10, offset: 0 })
    expect(res).toEqual(mockResponse)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/posts?limit=10&offset=0',
      expect.objectContaining({
        credentials: 'same-origin',
      })
    )
  })

  it('searchPosts sends query parameter q correctly encoded', async () => {
    const mockResponse = {
      items: [],
      total: 0,
      limit: 12,
      offset: 0,
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockResponse,
    })

    const res = await apiClient.searchPosts('solid & rust')
    expect(res).toEqual(mockResponse)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/posts/search?q=solid+%26+rust',
      expect.anything()
    )
  })

  it('getCsrfToken stores token in memory', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ csrf_token: 'mock-csrf-token-123' }),
    })

    const token = await apiClient.getCsrfToken()
    expect(token).toBe('mock-csrf-token-123')
    expect(getStoredCsrfToken()).toBe('mock-csrf-token-123')
  })

  it('restores CSRF before a mutation after reload', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ csrf_token: 'restored-token' }), {
        headers: { 'content-type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    globalThis.fetch = fetchMock

    await apiClient.deletePost('1', '"2"')

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/auth/csrf')
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/v1/admin/posts/1')
    const headers = new Headers(fetchMock.mock.calls[1]?.[1].headers)
    expect(headers.get('X-CSRF-Token')).toBe('restored-token')
    expect(headers.get('If-Match')).toBe('"2"')
  })

  it('mutations attach X-CSRF-Token and Content-Type', async () => {
    setCsrfToken('active-csrf-token')

    const mockPost = {
      id: 'post-1',
      slug: 'new-post',
      title: 'New Post',
      summary: null,
      content_md: '# Hello',
      content_html: '<h1>Hello</h1>',
      featured_image_media_id: null,
      status: 'draft',
      version: 1,
      published_at: null,
      created_at: 1727400000,
      updated_at: 1727400000,
      author_id: 'user-1',
      tags: [],
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json', ETag: '"version-1"' }),
      json: async () => mockPost,
    })

    const res = await apiClient.createPost({
      title: 'New Post',
      content_md: '# Hello',
      tags: [],
    })

    expect(res.post).toEqual(mockPost)
    expect(res.etag).toBe('"version-1"')

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0]
    const headers = fetchCall[1]?.headers as Headers
    expect(headers.get('X-CSRF-Token')).toBe('active-csrf-token')
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('updatePost attaches If-Match header from etag parameter', async () => {
    setCsrfToken('active-csrf-token')

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json', ETag: '"version-2"' }),
      json: async () => ({ id: 'post-1', version: 2 }),
    })

    await apiClient.updatePost('post-1', {
      title: 'Updated Title',
      content_md: '# Updated',
      tags: [],
      version: 2,
    }, '"version-1"')

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0]
    const headers = fetchCall[1]?.headers as Headers
    expect(headers.get('If-Match')).toBe('"version-1"')
  })

  it('throws ApiError on non-200 responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        error: { code: 'not_found', message: 'Article not found' },
      }),
    })

    await expect(apiClient.getPostBySlug('nonexistent')).rejects.toThrow(ApiError)
  })

  it('getPostBySlug fetches post by slug', async () => {
    const mockPost = { id: 'p1', slug: 'teste-slug', title: 'Teste' }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockPost,
    })
    const res = await apiClient.getPostBySlug('teste-slug')
    expect(res).toEqual(mockPost)
  })

  it('getTags fetches tag list', async () => {
    const mockTags = [{ id: 't1', name: 'Rust', slug: 'rust', post_count: 5 }]
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockTags,
    })
    const res = await apiClient.getTags()
    expect(res).toEqual(mockTags)
  })

  it('login starts without a session or CSRF request', async () => {
    let callCount = 0
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      callCount++
      if (url === '/api/v1/auth/csrf') {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ csrf_token: 'csrf-initial' }),
        }
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ user: { id: 'u1', email: 'a@b.com' }, csrf_token: 'csrf-logged' }),
      }
    })

    const loginRes = await apiClient.login('a@b.com', 'secret123')
    expect(callCount).toBe(1)
    expect(loginRes.csrf_token).toBe('csrf-logged')
    expect(getStoredCsrfToken()).toBe('csrf-logged')
  })

  it('logout clears in-memory CSRF token', async () => {
    setCsrfToken('active-token')
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
    })
    await apiClient.logout()
    expect(getStoredCsrfToken()).toBeNull()
  })

  it('single-flight refresh retries failed 401 request with renewed token', async () => {
    let calls = 0
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      calls++
      if (url === '/api/v1/users/me' && calls === 1) {
        return { ok: false, status: 401, headers: new Headers(), json: async () => ({}) }
      }
      if (url === '/api/v1/auth/csrf') {
        return { ok: true, status: 200, headers: new Headers(), json: async () => ({ csrf_token: 'new-csrf' }) }
      }
      if (url === '/api/v1/auth/refresh') {
        return { ok: true, status: 200, headers: new Headers(), json: async () => ({ csrf_token: 'new-csrf' }) }
      }
      if (url === '/api/v1/users/me' && calls > 3) {
        return { ok: true, status: 200, headers: new Headers(), json: async () => ({ id: 'u1', email: 'test@blog.dev' }) }
      }
      throw new Error(`Unexpected url: ${url}`)
    })

    const user = await apiClient.getCurrentUser()
    expect(user.id).toBe('u1')
    expect(calls).toBe(4)
  })

  it('deduplicates concurrent 401 requests into a single refresh execution', async () => {
    let refreshCount = 0
    let usersMeCount = 0
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/v1/users/me') {
        usersMeCount++
        if (usersMeCount <= 2) {
          return { ok: false, status: 401, headers: new Headers(), json: async () => ({}) }
        }
        return { ok: true, status: 200, headers: new Headers(), json: async () => ({ id: 'u1' }) }
      }
      if (url === '/api/v1/auth/csrf') {
        return { ok: true, status: 200, headers: new Headers(), json: async () => ({ csrf_token: 'token' }) }
      }
      if (url === '/api/v1/auth/refresh') {
        refreshCount++
        return { ok: true, status: 200, headers: new Headers(), json: async () => ({ csrf_token: 'token' }) }
      }
      throw new Error(`Unexpected url ${url}`)
    })

    const [res1, res2] = await Promise.all([
      apiClient.getCurrentUser(),
      apiClient.getCurrentUser(),
    ])
    expect(res1.id).toBe('u1')
    expect(res2.id).toBe('u1')
    expect(refreshCount).toBe(1)
  })

  it('converts AbortError DOMException into 408 ApiError', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new DOMException('Request timeout', 'AbortError'))
    await expect(apiClient.getPosts()).rejects.toMatchObject({
      status: 408,
      code: 'request_timeout',
    })
  })

  it('adapts the sessions array returned by Rust', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: 'session' }]), { status: 200 }))
    expect(await apiClient.getSessions()).toEqual({ items: [{ id: 'session' }] })
  })

  it('handles 204 No Content for deletePost without JSON parsing error', async () => {
    setCsrfToken('csrf')
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
    })
    await expect(apiClient.deletePost('post-1', '"etag-1"')).resolves.toBeUndefined()
  })

  it('uploads media file via multipart form data', async () => {
    setCsrfToken('csrf-token')
    const mockMedia = {
      id: 'media-1',
      filename: 'photo.jpg',
      content_type: 'image/jpeg',
      media_kind: 'image',
      size_bytes: 1024,
      public_url: '/api/v1/media/media-1',
      created_at: '2026-10-04T00:00:00Z',
    }

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
      expect(url).toBe('/api/v1/admin/media')
      expect(init.method).toBe('POST')
      expect(init.body instanceof FormData).toBe(true)
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockMedia,
      }
    })

    const file = new File(['image-content'], 'photo.jpg', { type: 'image/jpeg' })
    const res = await apiClient.uploadMedia(file)
    expect(res).toEqual(mockMedia)
  })

  it('fetches admin media list with filter params', async () => {
    const mockList = { items: [], total: 0, limit: 10, offset: 0 }
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      expect(url).toBe('/api/v1/admin/media?kind=video&limit=10&offset=0')
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockList,
      }
    })

    const res = await apiClient.getAdminMedia({ kind: 'video', limit: 10, offset: 0 })
    expect(res).toEqual(mockList)
  })

  it('deletes media by id', async () => {
    setCsrfToken('csrf-token')
    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
      expect(url).toBe('/api/v1/admin/media/media-1')
      expect(init.method).toBe('DELETE')
      return {
        ok: true,
        status: 204,
        headers: new Headers(),
      }
    })

    await expect(apiClient.deleteMedia('media-1')).resolves.toBeUndefined()
  })
})

