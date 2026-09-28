import { describe, it, expect } from 'vitest'
import { ApiError, isApiError } from './errors.ts'

describe('ApiError', () => {
  it('constructs an ApiError with status, code and message', () => {
    const err = new ApiError(404, 'not_found', 'Post not found', { slug: 'missing' })
    expect(err.name).toBe('ApiError')
    expect(err.status).toBe(404)
    expect(err.code).toBe('not_found')
    expect(err.message).toBe('Post not found')
    expect(err.details).toEqual({ slug: 'missing' })
  })

  it('fromPayload parses nested error object from backend', () => {
    const payload = {
      error: {
        code: 'validation_error',
        message: 'Invalid title',
        details: { field: 'title' },
      },
    }
    const err = ApiError.fromPayload(422, payload)
    expect(err.status).toBe(422)
    expect(err.code).toBe('validation_error')
    expect(err.message).toBe('Invalid title')
    expect(err.details).toEqual({ field: 'title' })
  })

  it('fromPayload parses flat message/code payload', () => {
    const payload = { code: 'bad_request', message: 'Malformed JSON' }
    const err = ApiError.fromPayload(400, payload)
    expect(err.status).toBe(400)
    expect(err.code).toBe('bad_request')
    expect(err.message).toBe('Malformed JSON')
  })

  it('fromPayload handles null and non-object payloads', () => {
    const err = ApiError.fromPayload(500, null, 'Server error')
    expect(err.status).toBe(500)
    expect(err.code).toBe('http_500')
    expect(err.message).toBe('Server error')
  })

  it('isApiError identifies ApiError instances', () => {
    const apiErr = new ApiError(403, 'forbidden', 'Access denied')
    const stdErr = new Error('Generic error')
    expect(isApiError(apiErr)).toBe(true)
    expect(isApiError(stdErr)).toBe(false)
    expect(isApiError(null)).toBe(false)
  })
})
