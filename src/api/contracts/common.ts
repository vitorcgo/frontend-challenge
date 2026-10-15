export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHENTICATED'
  | 'SESSION_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'EMAIL_TAKEN'
  | 'USERNAME_TAKEN'
  | 'CONFLICT'
  | 'WALLET_REJECTED'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'

export type FieldErrors = Record<string, string[]>

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    message: string
    fieldErrors?: FieldErrors
    details?: unknown
  }
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type IsoDateTime = string
