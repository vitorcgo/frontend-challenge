import { isAxiosError } from 'axios'
import type { ApiErrorBody, ApiErrorCode, FieldErrors } from './contracts'

export type ClientErrorCode = ApiErrorCode | 'NETWORK_ERROR' | 'TIMEOUT' | 'UNKNOWN_ERROR'

/** Erro único que as telas recebem, venha ele da API, da rede ou de um timeout. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ClientErrorCode,
    message: string,
    readonly fieldErrors: FieldErrors = {},
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /** Falhas que podem dar certo numa nova tentativa sem efeito colateral. */
  get isTransient(): boolean {
    return this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT' || this.status >= 500
  }

  get isUnauthenticated(): boolean {
    return this.code === 'UNAUTHENTICATED' || this.code === 'SESSION_EXPIRED'
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

function isErrorBody(data: unknown): data is ApiErrorBody {
  return typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'object'
}

export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error
  if (!isAxiosError(error)) return new ApiError(0, 'UNKNOWN_ERROR', 'Algo deu errado. Tente novamente.')

  if (error.code === 'ETIMEDOUT') {
    return new ApiError(0, 'TIMEOUT', 'O servidor demorou para responder. Tente novamente.')
  }
  if (!error.response) {
    return new ApiError(0, 'NETWORK_ERROR', 'Sem conexão com o servidor. Verifique sua internet e tente novamente.')
  }

  const { status, data } = error.response
  if (isErrorBody(data)) {
    const { code, message, fieldErrors, details } = data.error
    return new ApiError(status, code, message, fieldErrors, details)
  }
  return new ApiError(status, status >= 500 ? 'INTERNAL_ERROR' : 'UNKNOWN_ERROR', 'Algo deu errado. Tente novamente.')
}
