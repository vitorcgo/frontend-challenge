import axios, { isAxiosError, isCancel } from 'axios'
import { env } from '@/config/env'
import { apiReady } from '@/lib/api-ready'
import { toApiError } from './errors'
import { getSessionToken, reportInvalidSession } from './session-token'

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  // Timeout com código próprio (ETIMEDOUT), separado de requisição abortada (ECONNABORTED).
  transitional: { clarifyTimeoutError: true },
  // Listas viram parâmetros repetidos: ?category=a&category=b
  paramsSerializer: { indexes: null },
})

apiClient.interceptors.request.use(async (config) => {
  await apiReady
  const token = getSessionToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // Cancelamentos seguem como estão para o TanStack Query reconhecer a consulta descartada.
    if (isCancel(error)) return Promise.reject(error)
    const apiError = toApiError(error)
    // Sessão recusada numa chamada que levava token: a interface encerra a sessão e avisa.
    const sentToken = isAxiosError(error) && Boolean(error.config?.headers.has('Authorization'))
    if (sentToken && apiError.isUnauthenticated) {
      reportInvalidSession(apiError.code === 'SESSION_EXPIRED' ? 'expired' : 'invalid')
    }
    return Promise.reject(apiError)
  },
)
