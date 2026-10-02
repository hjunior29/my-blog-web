import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from './client.ts'
import { getCachedPost, setCachedPost, prefetchPost, clearPostCache } from './postsCache.ts'
import type { PostResponse } from './types.ts'

describe('postsCache', () => {
  const mockPostResponse: PostResponse = {
    id: 'post-1',
    slug: 'performance-guide',
    title: 'Performance Guide',
    summary: 'A summary',
    content_md: 'Content',
    content_html: '<p>Content</p>',
    featured_image_media_id: null,
    status: 'published',
    published_at: 1727400000,
    created_at: 1727390000,
    updated_at: 1727400000,
    author_id: 'author-1',
    tags: ['Web', 'Performance'],
    version: 1,
  }

  beforeEach(() => {
    clearPostCache()
    vi.restoreAllMocks()
  })

  it('stores and retrieves cached posts by slug and locale', () => {
    expect(getCachedPost('performance-guide', 'pt-BR')).toBeNull()

    const mockVm = {
      id: 'post-1',
      slug: 'performance-guide',
      title: 'Performance Guide',
      description: 'A summary',
      contentHtml: '<p>Content</p>',
      category: 'Web',
      tags: ['Web', 'Performance'],
      formattedDate: '01/10/2026',
      readingTimeMinutes: 2,
      version: 1,
      authorId: 'author-1',
      status: 'published' as const,
      publishedAtMs: 1727400000000,
      createdAtMs: 1727390000000,
      updatedAtMs: 1727400000000,
      featuredImageMediaId: null,
    }

    setCachedPost(mockVm, 'pt-BR')
    expect(getCachedPost('performance-guide', 'pt-BR')).toEqual(mockVm)
    expect(getCachedPost('performance-guide', 'en-US')).toBeNull()
  })

  it('deduplicates in-flight prefetch requests', async () => {
    const spy = vi.spyOn(apiClient, 'getPostBySlug').mockResolvedValue(mockPostResponse)

    const [res1, res2] = await Promise.all([
      prefetchPost('performance-guide', 'pt-BR'),
      prefetchPost('performance-guide', 'pt-BR'),
    ])

    expect(spy).toHaveBeenCalledTimes(1)
    expect(res1.slug).toBe('performance-guide')
    expect(res2.slug).toBe('performance-guide')
    expect(getCachedPost('performance-guide', 'pt-BR')).not.toBeNull()
  })

  it('returns cached post without making API call', async () => {
    const spy = vi.spyOn(apiClient, 'getPostBySlug').mockResolvedValue(mockPostResponse)

    await prefetchPost('performance-guide', 'pt-BR')
    expect(spy).toHaveBeenCalledTimes(1)

    const secondCall = await prefetchPost('performance-guide', 'pt-BR')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(secondCall.slug).toBe('performance-guide')
  })
})
