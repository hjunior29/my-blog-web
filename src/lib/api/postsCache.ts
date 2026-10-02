import { apiClient } from './client.ts'
import { mapPostToViewModel } from './mappers.ts'
import type { PostViewModel } from './types.ts'

const MAX_CACHE_SIZE = 30
const postCache = new Map<string, PostViewModel>()
const inFlightRequests = new Map<string, Promise<PostViewModel>>()

const makeKey = (slug: string, locale = 'pt-BR') => `${slug}:${locale}`

export function getCachedPost(slug: string, locale = 'pt-BR'): PostViewModel | null {
  return postCache.get(makeKey(slug, locale)) ?? null
}

export function setCachedPost(post: PostViewModel, locale = 'pt-BR'): void {
  const key = makeKey(post.slug, locale)
  if (postCache.has(key)) {
    postCache.delete(key)
  } else if (postCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = postCache.keys().next().value
    if (oldestKey) postCache.delete(oldestKey)
  }
  postCache.set(key, post)
}

export async function prefetchPost(slug: string, locale = 'pt-BR'): Promise<PostViewModel> {
  const key = makeKey(slug, locale)
  const cached = postCache.get(key)
  if (cached) return cached

  const existingRequest = inFlightRequests.get(key)
  if (existingRequest) return existingRequest

  const requestPromise = (async () => {
    try {
      const res = await apiClient.getPostBySlug(slug)
      const vm = mapPostToViewModel(res, undefined, locale)
      setCachedPost(vm, locale)
      return vm
    } finally {
      inFlightRequests.delete(key)
    }
  })()

  inFlightRequests.set(key, requestPromise)
  return requestPromise
}

export function clearPostCache(): void {
  postCache.clear()
  inFlightRequests.clear()
}
