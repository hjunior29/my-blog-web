import type { PostResponse, PostSummaryResponse, PostViewModel, TagDto } from './types.ts'

export const unixSecondsToMs = (seconds: number | null | undefined): number | null => {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) return null
  return Math.round(seconds * 1000)
}

export const formatDate = (timestampMs: number | null, locale = 'pt-BR'): string => {
  if (!timestampMs) return ''
  try {
    const date = new Date(timestampMs)
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  } catch {
    return ''
  }
}

export const estimateReadingTimeMinutes = (text: string | null | undefined): number => {
  if (!text) return 1
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

const extractTagNames = (tags: readonly (TagDto | string)[]): string[] => {
  return tags.map((t) => (typeof t === 'string' ? t : t.name))
}

export const mapPostSummaryToViewModel = (
  dto: PostSummaryResponse,
  locale = 'pt-BR'
): PostViewModel => {
  const publishedAtMs = unixSecondsToMs(dto.published_at)
  const createdAtMs = unixSecondsToMs(dto.created_at) ?? Date.now()
  const updatedAtMs = unixSecondsToMs(dto.updated_at) ?? createdAtMs
  const effectiveDateMs = publishedAtMs ?? createdAtMs
  const tagNames = extractTagNames(dto.tags)

  return {
    id: String(dto.id),
    slug: dto.slug,
    title: dto.title,
    description: dto.summary ?? '',
    category: tagNames[0] ?? (locale.startsWith('pt') ? 'Artigo' : 'Article'),
    tags: tagNames,
    publishedAtMs,
    createdAtMs,
    updatedAtMs,
    formattedDate: formatDate(effectiveDateMs, locale),
    readingTimeMinutes: estimateReadingTimeMinutes(dto.summary),
    status: dto.status,
    version: dto.version ?? 1,
    authorId: String(dto.author_id),
    bookColor: dto.book_color ?? null,
    coverImage: dto.featured_image_media_id ?? null,
    hasDraft: dto.has_draft ?? false,
  }
}

export const mapPostToViewModel = (
  dto: PostResponse,
  etag?: string,
  locale = 'pt-BR'
): PostViewModel => {
  const publishedAtMs = unixSecondsToMs(dto.published_at)
  const createdAtMs = unixSecondsToMs(dto.created_at) ?? Date.now()
  const updatedAtMs = unixSecondsToMs(dto.updated_at) ?? createdAtMs
  const effectiveDateMs = publishedAtMs ?? createdAtMs
  const tagNames = extractTagNames(dto.tags)

  return {
    id: String(dto.id),
    slug: dto.slug,
    title: dto.title,
    description: dto.summary ?? '',
    category: tagNames[0] ?? (locale.startsWith('pt') ? 'Artigo' : 'Article'),
    tags: tagNames,
    contentMd: dto.content_md,
    contentHtml: dto.content_html,
    publishedAtMs,
    createdAtMs,
    updatedAtMs,
    formattedDate: formatDate(effectiveDateMs, locale),
    readingTimeMinutes: estimateReadingTimeMinutes(dto.content_md || dto.summary),
    status: dto.status,
    version: dto.version,
    authorId: String(dto.author_id),
    etag,
    bookColor: dto.book_color ?? null,
    coverImage: dto.featured_image_media_id ?? null,
    hasDraft: dto.has_draft ?? false,
  }
}
