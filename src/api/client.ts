import axios, { isAxiosError, isCancel } from 'axios'
import { env } from '@/config/env'
import { apiReady } from '@/lib/api-ready'
import { GUEST_CART_HEADER } from './contracts'
import { toApiError } from './errors'
import { getGuestCartId } from './guest-cart'
import { getSessionToken, reportInvalidSession } from './session-token'

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  // Timeout com código próprio (ETIMEDOUT), separado de requisição abortada (ECONNABORTED).
  transitional: { clarifyTimeoutError: true },
  paramsSerializer: { indexes: null },
})

apiClient.interceptors.request.use(async (config) => {
  await apiReady
  const token = getSessionToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  else if (config.url?.startsWith('/cart')) config.headers.set(GUEST_CART_HEADER, getGuestCartId())
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // Cancelamentos seguem como estão para o TanStack Query reconhecer a consulta descartada.
    if (isCancel(error)) return Promise.reject(error)
    const apiError = toApiError(error)
    const sentToken = isAxiosError(error) && Boolean(error.config?.headers.has('Authorization'))
    if (sentToken && apiError.isUnauthenticated) {
      reportInvalidSession(apiError.code === 'SESSION_EXPIRED' ? 'expired' : 'invalid')
    }
    return Promise.reject(apiError)
  },
)
