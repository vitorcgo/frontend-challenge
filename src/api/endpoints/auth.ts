import { apiClient } from '../client'
import type { CurrentSession, LoginRequest, RegisterRequest, Session } from '../contracts'

export async function login(input: LoginRequest): Promise<Session> {
  const { data } = await apiClient.post<Session>('/auth/login', input)
  return data
}

export async function register(input: RegisterRequest): Promise<Session> {
  const { data } = await apiClient.post<Session>('/auth/register', input)
  return data
}

export async function getSession(signal?: AbortSignal): Promise<CurrentSession> {
  const { data } = await apiClient.get<CurrentSession>('/auth/session', { signal })
  return data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}
