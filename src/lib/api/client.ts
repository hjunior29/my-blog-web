import { ApiError } from './errors.ts'
import type {
  ChangePasswordDto,
  CreatePostDto,
  CsrfResponse,
  LoginResponse,
  LoginResult,
  MediaKind,
  MediaListResponse,
  MediaResponse,
  ResendTwoFactorResponse,
  TwoFactorChallengeResponse,
  PostListResponse,
  PostResponse,
  PostStatus,
  PreviewPostDto,
  PreviewPostResponse,
  SessionListResponse,
  TagWithCountDto,
  UpdatePostDto,
  UpdateProfileDto,
  UserResponse,
} from './types.ts'

export interface RequestOptions extends RequestInit {
  readonly timeoutMs?: number
  readonly skipAuthRefresh?: boolean
  readonly etag?: string
}

let inMemoryCsrfToken: string | null = null
let refreshPromise: Promise<void> | null = null

export const setCsrfToken = (token: string | null): void => {
  inMemoryCsrfToken = token
}

export const getStoredCsrfToken = (): string | null => inMemoryCsrfToken

const API_BASE = '/api/v1'
const DEFAULT_TIMEOUT_MS = 15000

const request = async <T>(endpoint: string, options: RequestOptions = {}): Promise<{ data: T; etag?: string }> => {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, skipAuthRefresh = false, etag, headers: customHeaders, ...init } = options

  const controller = new AbortController()
  const abort = () => controller.abort(init.signal?.reason)
  if (init.signal?.aborted) abort()
  init.signal?.addEventListener('abort', abort, { once: true })
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const headers = new Headers(customHeaders)
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  const method = (init.method || 'GET').toUpperCase()
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

  if (isMutation && endpoint !== '/auth/login' && !endpoint.startsWith('/auth/2fa/') && !inMemoryCsrfToken) {
    try { await apiClient.getCsrfToken() }
    catch (error) {
      clearTimeout(timeoutId)
      init.signal?.removeEventListener('abort', abort)
      throw error
    }
  }

  if (isMutation && inMemoryCsrfToken && !headers.has('X-CSRF-Token')) {
    headers.set('X-CSRF-Token', inMemoryCsrfToken)
  }

  if (etag && !headers.has('If-Match')) {
    headers.set('If-Match', etag)
  }

  if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...init,
      headers,
      credentials: 'same-origin',
      signal: controller.signal,
    })

    const responseEtag = response.headers.get('ETag') ?? undefined

    if (response.status === 401 && !endpoint.startsWith('/posts') && endpoint !== '/tags' && !skipAuthRefresh && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
      try {
        await singleFlightRefresh()
        return await request<T>(endpoint, { ...options, skipAuthRefresh: true })
      } catch (refreshErr) {
        setCsrfToken(null)
        throw refreshErr
      }
    }

    if (!response.ok) {
      let payload: unknown = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }
      throw ApiError.fromPayload(response.status, payload)
    }

    if (response.status === 204) {
      return { data: undefined as unknown as T, etag: responseEtag }
    }

    const data = (await response.json()) as T
    return { data, etag: responseEtag }
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      if (init.signal?.aborted) throw err
      throw new ApiError(408, 'request_timeout', 'Request timed out')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
    init.signal?.removeEventListener('abort', abort)
  }
}

const singleFlightRefresh = async (): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const renew = async () => {
          await apiClient.getCsrfToken()
          await apiClient.refreshToken()
        }
        if (typeof navigator !== 'undefined' && navigator.locks) {
          await navigator.locks.request('blog-session-refresh', async () => {
            try {
              await request('/users/me', { skipAuthRefresh: true })
              await apiClient.getCsrfToken()
            } catch (error) {
              if (!(error instanceof ApiError) || error.status !== 401) throw error
              await renew()
            }
          })
        } else {
          await renew()
        }
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

export const apiClient = {
  async getPosts(params?: { limit?: number; offset?: number; signal?: AbortSignal }): Promise<PostListResponse> {
    const search = new URLSearchParams()
    if (typeof params?.limit === 'number') search.set('limit', String(params.limit))
    if (typeof params?.offset === 'number') search.set('offset', String(params.offset))
    const query = search.toString() ? `?${search.toString()}` : ''
    const res = await request<PostListResponse>(`/posts${query}`, { signal: params?.signal })
    return res.data
  },

  async searchPosts(q: string, params?: { limit?: number; offset?: number; signal?: AbortSignal }): Promise<PostListResponse> {
    const search = new URLSearchParams({ q })
    if (typeof params?.limit === 'number') search.set('limit', String(params.limit))
    if (typeof params?.offset === 'number') search.set('offset', String(params.offset))
    const res = await request<PostListResponse>(`/posts/search?${search.toString()}`, { signal: params?.signal })
    return res.data
  },

  async getPostBySlug(slug: string): Promise<PostResponse> {
    const res = await request<PostResponse>(`/posts/${encodeURIComponent(slug)}`)
    return res.data
  },

  async getTags(): Promise<readonly TagWithCountDto[]> {
    const res = await request<readonly TagWithCountDto[]>('/tags')
    return res.data
  },

  async getCsrfToken(): Promise<string> {
    const res = await request<CsrfResponse>('/auth/csrf', { method: 'GET', skipAuthRefresh: true })
    setCsrfToken(res.data.csrf_token)
    return res.data.csrf_token
  },

  async login(email: string, password: string, remember_me?: boolean): Promise<LoginResult> {
    const body: Record<string, unknown> = { email, password }
    if (remember_me !== undefined) body.remember_me = remember_me
    const res = await request<LoginResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
      skipAuthRefresh: true,
    })
    if (!res.data.requires_2fa && res.data.csrf_token) {
      setCsrfToken(res.data.csrf_token)
    }
    return res.data
  },

  async verifyTwoFactor(challenge_token: string, code: string, remember_me?: boolean): Promise<LoginResponse> {
    const body: Record<string, unknown> = { challenge_token, code }
    if (remember_me !== undefined) body.remember_me = remember_me
    const res = await request<LoginResponse>('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify(body),
      skipAuthRefresh: true,
    })
    if (res.data?.csrf_token) {
      setCsrfToken(res.data.csrf_token)
    }
    return res.data
  },

  async resendTwoFactor(challenge_token: string): Promise<ResendTwoFactorResponse> {
    const res = await request<ResendTwoFactorResponse>('/auth/2fa/resend', {
      method: 'POST',
      body: JSON.stringify({ challenge_token }),
      skipAuthRefresh: true,
    })
    return res.data
  },

  async refreshToken(): Promise<void> {
    const res = await request<CsrfResponse>('/auth/refresh', {
      method: 'POST',
      skipAuthRefresh: true,
    })
    if (res.data?.csrf_token) {
      setCsrfToken(res.data.csrf_token)
    }
  },

  async logout(): Promise<void> {
    try {
      await request<void>('/auth/logout', { method: 'POST', skipAuthRefresh: true })
    } finally {
      setCsrfToken(null)
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await request<void>('/auth/logout-all', { method: 'POST', skipAuthRefresh: true })
    } finally {
      setCsrfToken(null)
    }
  },

  async getCurrentUser(): Promise<UserResponse> {
    const res = await request<UserResponse>('/users/me')
    return res.data
  },

  async updateProfile(dto: UpdateProfileDto): Promise<UserResponse> {
    const res = await request<UserResponse>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(dto),
    })
    return res.data
  },

  async changePassword(dto: ChangePasswordDto): Promise<void> {
    await request<void>('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify(dto),
    })
  },

  async getSessions(): Promise<SessionListResponse> {
    const res = await request<SessionListResponse['items']>('/auth/sessions')
    return { items: res.data }
  },

  async revokeSession(id: string): Promise<void> {
    await request<void>(`/auth/sessions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },

  async getAdminPosts(params?: { limit?: number; offset?: number; status?: PostStatus }): Promise<PostListResponse> {
    const search = new URLSearchParams()
    if (typeof params?.limit === 'number') search.set('limit', String(params.limit))
    if (typeof params?.offset === 'number') search.set('offset', String(params.offset))
    if (params?.status) search.set('status', params.status)
    const query = search.toString() ? `?${search.toString()}` : ''
    const res = await request<PostListResponse>(`/admin/posts${query}`)
    return res.data
  },

  async getAdminPost(id: string): Promise<{ post: PostResponse; etag?: string }> {
    const res = await request<PostResponse>(`/admin/posts/${encodeURIComponent(id)}`)
    return { post: res.data, etag: res.etag }
  },

  async createPost(dto: CreatePostDto): Promise<{ post: PostResponse; etag?: string }> {
    const res = await request<PostResponse>('/admin/posts', {
      method: 'POST',
      body: JSON.stringify(dto),
    })
    return { post: res.data, etag: res.etag }
  },

  async updatePost(id: string, dto: UpdatePostDto, etag?: string): Promise<{ post: PostResponse; etag?: string }> {
    const res = await request<PostResponse>(`/admin/posts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
      etag: etag ?? (dto.version !== undefined ? `"${dto.version}"` : undefined),
    })
    return { post: res.data, etag: res.etag }
  },

  async savePostDraft(id: string, dto: UpdatePostDto, etag?: string): Promise<{ post: PostResponse; etag?: string }> {
    const res = await request<PostResponse>(`/admin/posts/${encodeURIComponent(id)}/draft`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
      etag: etag ?? (dto.version !== undefined ? `"${dto.version}"` : undefined),
    })
    return { post: res.data, etag: res.etag }
  },

  async discardPostDraft(id: string, etag?: string): Promise<{ post: PostResponse; etag?: string }> {
    const res = await request<PostResponse>(`/admin/posts/${encodeURIComponent(id)}/draft`, {
      method: 'DELETE',
      etag,
    })
    return { post: res.data, etag: res.etag }
  },

  async publishPost(id: string, etag?: string): Promise<{ post: PostResponse; etag?: string }> {
    const res = await request<PostResponse>(`/admin/posts/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
      etag,
    })
    return { post: res.data, etag: res.etag }
  },

  async unpublishPost(id: string, etag?: string): Promise<{ post: PostResponse; etag?: string }> {
    const res = await request<PostResponse>(`/admin/posts/${encodeURIComponent(id)}/unpublish`, {
      method: 'POST',
      etag,
    })
    return { post: res.data, etag: res.etag }
  },

  async archivePost(id: string, etag?: string): Promise<{ post: PostResponse; etag?: string }> {
    const res = await request<PostResponse>(`/admin/posts/${encodeURIComponent(id)}/archive`, {
      method: 'POST',
      etag,
    })
    return { post: res.data, etag: res.etag }
  },

  async unarchivePost(id: string, etag?: string): Promise<{ post: PostResponse; etag?: string }> {
    const res = await request<PostResponse>(`/admin/posts/${encodeURIComponent(id)}/unarchive`, {
      method: 'POST',
      etag,
    })
    return { post: res.data, etag: res.etag }
  },

  async deletePost(id: string, etag?: string): Promise<void> {
    await request<void>(`/admin/posts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      etag,
    })
  },

  async previewPost(dto: PreviewPostDto): Promise<PreviewPostResponse> {
    const res = await request<PreviewPostResponse>('/admin/posts/preview', {
      method: 'POST',
      body: JSON.stringify(dto),
    })
    return res.data
  },

  async uploadMedia(file: File): Promise<MediaResponse> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await request<MediaResponse>('/admin/media', {
      method: 'POST',
      body: formData,
      timeoutMs: 120000,
    })
    return res.data
  },

  async getAdminMedia(params?: { kind?: MediaKind; limit?: number; offset?: number }): Promise<MediaListResponse> {
    const search = new URLSearchParams()
    if (params?.kind) search.set('kind', params.kind)
    if (typeof params?.limit === 'number') search.set('limit', String(params.limit))
    if (typeof params?.offset === 'number') search.set('offset', String(params.offset))
    const query = search.toString() ? `?${search.toString()}` : ''
    const res = await request<MediaListResponse>(`/admin/media${query}`)
    return res.data
  },

  async deleteMedia(id: string): Promise<void> {
    await request<void>(`/admin/media/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },
}
