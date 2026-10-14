import axios, { isCancel } from 'axios'
import { env } from '@/config/env'
import { apiReady } from '@/lib/api-ready'
import { toApiError } from './errors'
import { getSessionToken } from './session-token'

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
  // Cancelamentos seguem como estão para o TanStack Query reconhecer a consulta descartada.
  (error: unknown) => Promise.reject(isCancel(error) ? error : toApiError(error)),
)
