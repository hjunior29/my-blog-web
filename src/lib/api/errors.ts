export interface ApiErrorPayload {
  readonly error?: {
    readonly code?: string
    readonly message?: string
    readonly details?: unknown
  }
  readonly code?: string
  readonly message?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  static fromPayload(status: number, payload: unknown, fallbackMessage = 'An unexpected error occurred'): ApiError {
    if (typeof payload === 'object' && payload !== null) {
      const data = payload as ApiErrorPayload
      if (data.error && typeof data.error === 'object') {
        const code = data.error.code || `http_${status}`
        const message = data.error.message || fallbackMessage
        return new ApiError(status, code, message, data.error.details)
      }
      if (typeof data.message === 'string') {
        const code = data.code || `http_${status}`
        return new ApiError(status, code, data.message)
      }
    }
    return new ApiError(status, `http_${status}`, fallbackMessage)
  }
}

export const isApiError = (value: unknown): value is ApiError => {
  return value instanceof ApiError
}
