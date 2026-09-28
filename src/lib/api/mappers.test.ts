import { describe, it, expect } from 'vitest'
import {
  unixSecondsToMs,
  formatDate,
  estimateReadingTimeMinutes,
  mapPostSummaryToViewModel,
  mapPostToViewModel,
} from './mappers.ts'
import type { PostResponse, PostSummaryResponse } from './types.ts'

describe('api mappers', () => {
  it('unixSecondsToMs handles valid numbers, null, and NaN', () => {
    expect(unixSecondsToMs(1727400000)).toBe(1727400000000)
    expect(unixSecondsToMs(null)).toBeNull()
    expect(unixSecondsToMs(undefined)).toBeNull()
    expect(unixSecondsToMs(Number.NaN)).toBeNull()
  })

  it('formatDate formats timestamps correctly', () => {
    const ts = 1727400000000
    const formattedPt = formatDate(ts, 'pt-BR')
    expect(formattedPt.length).toBeGreaterThan(0)
    const formattedEn = formatDate(ts, 'en-US')
    expect(formattedEn.length).toBeGreaterThan(0)
    expect(formatDate(null)).toBe('')
  })

  it('estimateReadingTimeMinutes calculates reading time based on word count', () => {
    expect(estimateReadingTimeMinutes('')).toBe(1)
    expect(estimateReadingTimeMinutes(null)).toBe(1)
    const shortText = 'One two three four five'
    expect(estimateReadingTimeMinutes(shortText)).toBe(1)
    const words450 = new Array(450).fill('word').join(' ')
    expect(estimateReadingTimeMinutes(words450)).toBe(3)
  })

  it('mapPostSummaryToViewModel maps summary DTO to PostViewModel', () => {
    const summaryDto: PostSummaryResponse = {
      id: 'post-1',
      slug: 'hello-world',
      title: 'Hello World',
      summary: 'A short summary',
      featured_image_media_id: null,
      status: 'published',
      published_at: 1727400000,
      created_at: 1727390000,
      updated_at: 1727400000,
      author_id: 'user-1',
      tags: ['technology', 'solid'],
    }

    const vm = mapPostSummaryToViewModel(summaryDto, 'en-US')
    expect(vm.id).toBe('post-1')
    expect(vm.slug).toBe('hello-world')
    expect(vm.title).toBe('Hello World')
    expect(vm.description).toBe('A short summary')
    expect(vm.category).toBe('technology')
    expect(vm.tags).toEqual(['technology', 'solid'])
    expect(vm.publishedAtMs).toBe(1727400000000)
    expect(vm.createdAtMs).toBe(1727390000000)
    expect(vm.updatedAtMs).toBe(1727400000000)
    expect(vm.status).toBe('published')
    expect(vm.readingTimeMinutes).toBe(1)
  })

  it('mapPostToViewModel maps full post DTO to PostViewModel', () => {
    const postDto: PostResponse = {
      id: 'post-2',
      slug: 'full-post',
      title: 'Full Post',
      summary: null,
      content_md: '# Markdown\n\nContent here with several words.',
      content_html: '<h1>Markdown</h1><p>Content here with several words.</p>',
      featured_image_media_id: null,
      status: 'published',
      version: 3,
      published_at: 1727400000,
      created_at: 1727390000,
      updated_at: 1727400000,
      author_id: 'user-1',
      tags: [],
    }

    const vm = mapPostToViewModel(postDto, '"etag-123"', 'pt-BR')
    expect(vm.id).toBe('post-2')
    expect(vm.description).toBe('')
    expect(vm.category).toBe('Artigo')
    expect(vm.contentMd).toBe(postDto.content_md)
    expect(vm.contentHtml).toBe(postDto.content_html)
    expect(vm.version).toBe(3)
    expect(vm.etag).toBe('"etag-123"')
  })

  it('maps TagDto objects and numeric IDs correctly', () => {
    const postDto: PostResponse = {
      id: 42,
      slug: 'numeric-id',
      title: 'Post With Tag Objects',
      summary: 'Summary text',
      content_md: '# Content',
      content_html: '<h1>Content</h1>',
      featured_image_media_id: null,
      status: 'published',
      version: 1,
      published_at: 1727400000,
      created_at: 1727390000,
      updated_at: 1727400000,
      author_id: 1,
      tags: [
        { id: 10, name: 'Architecture', slug: 'architecture' },
        { id: 11, name: 'Rust', slug: 'rust' },
      ],
    }

    const vm = mapPostToViewModel(postDto, undefined, 'en-US')
    expect(vm.id).toBe('42')
    expect(vm.authorId).toBe('1')
    expect(vm.category).toBe('Architecture')
    expect(vm.tags).toEqual(['Architecture', 'Rust'])
  })
})
