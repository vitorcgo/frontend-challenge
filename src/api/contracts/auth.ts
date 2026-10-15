import type { IsoDateTime } from './common'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface SessionUser {
  id: string
  username: string
  displayName: string
  email: string
  avatarUrl: string | null
}

export interface Session {
  token: string
  expiresAt: IsoDateTime
  user: SessionUser
}

export interface CurrentSession {
  expiresAt: IsoDateTime
  user: SessionUser
}
