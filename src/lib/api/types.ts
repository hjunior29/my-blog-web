export type PostStatus = 'draft' | 'published' | 'scheduled' | 'archived'
export type UserRole = 'owner' | 'author'
export type UserStatus = 'active' | 'inactive'

export interface TagDto {
  readonly id: number | string
  readonly name: string
  readonly slug: string
}

export interface PostResponse {
  readonly id: string | number
  readonly slug: string
  readonly title: string
  readonly summary: string | null
  readonly content_md: string
  readonly content_html: string
  readonly featured_image_media_id: string | null
  readonly status: PostStatus
  readonly version: number
  readonly published_at: number | null
  readonly created_at: number
  readonly updated_at: number
  readonly author_id: string | number
  readonly tags: readonly (TagDto | string)[]
}

export interface PostSummaryResponse {
  readonly id: string | number
  readonly slug: string
  readonly title: string
  readonly summary: string | null
  readonly featured_image_media_id: string | null
  readonly status: PostStatus
  readonly published_at: number | null
  readonly created_at: number
  readonly updated_at: number
  readonly author_id: string | number
  readonly tags: readonly (TagDto | string)[]
}

export interface PostListResponse {
  readonly items: readonly PostSummaryResponse[]
  readonly total: number
  readonly limit: number
  readonly offset: number
}

export interface TagWithCountDto {
  readonly id: string | number
  readonly name: string
  readonly slug: string
  readonly post_count: number
}

export interface CreatePostDto {
  readonly title: string
  readonly summary?: string | null
  readonly content_md: string
  readonly featured_image_media_id?: string | null
  readonly status?: PostStatus
  readonly tags: readonly string[]
}

export interface UpdatePostDto {
  readonly title: string
  readonly summary?: string | null
  readonly content_md: string
  readonly featured_image_media_id?: string | null
  readonly status?: PostStatus
  readonly tags: readonly string[]
  readonly version: number
}

export interface PreviewPostDto {
  readonly content_md: string
}

export interface PreviewPostResponse {
  readonly content_html: string
}

export interface UserResponse {
  readonly id: string | number
  readonly email: string
  readonly display_name: string
  readonly role: UserRole
  readonly status: UserStatus
  readonly bio: string | null
  readonly created_at: number
  readonly updated_at: number
}

export interface LoginResponse {
  readonly user: UserResponse
  readonly csrf_token: string
}

export interface CsrfResponse {
  readonly csrf_token: string
}

export interface UpdateProfileDto {
  readonly display_name: string
  readonly bio?: string | null
}

export interface ChangePasswordDto {
  readonly current_password: string
  readonly new_password: string
}

export interface SessionItemResponse {
  readonly id: string
  readonly ip_address: string | null
  readonly user_agent: string | null
  readonly created_at: number
  readonly expires_at: number
  readonly is_current: boolean
}

export interface SessionListResponse {
  readonly items: readonly SessionItemResponse[]
}

export interface PostViewModel {
  readonly id: string
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly category: string
  readonly tags: readonly string[]
  readonly contentMd?: string
  readonly contentHtml?: string
  readonly publishedAtMs: number | null
  readonly createdAtMs: number
  readonly updatedAtMs: number
  readonly formattedDate: string
  readonly readingTimeMinutes: number
  readonly status: PostStatus
  readonly version: number
  readonly authorId: string
  readonly etag?: string
}
