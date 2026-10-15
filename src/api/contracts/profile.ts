import type { IsoDateTime } from './common'

export const MAX_AVATAR_BYTES = 200 * 1024

export interface Profile {
  id: string
  displayName: string
  username: string
  email: string
  ensName: string
  walletNickname: string
  avatarUrl: string | null
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export interface ProfileUpdate {
  displayName: string
  username: string
  email: string
  ensName: string
  walletNickname: string
}

export interface AvatarUpdate {
  dataUrl: string
}

export interface PasswordChange {
  currentPassword: string
  newPassword: string
}
