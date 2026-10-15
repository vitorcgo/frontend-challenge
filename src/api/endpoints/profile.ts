import { apiClient } from '../client'
import type { PasswordChange, Profile, ProfileUpdate } from '../contracts'

export async function getProfile(signal?: AbortSignal): Promise<Profile> {
  const { data } = await apiClient.get<Profile>('/profile', { signal })
  return data
}

export async function updateProfile(input: ProfileUpdate): Promise<Profile> {
  const { data } = await apiClient.put<Profile>('/profile', input)
  return data
}

export async function updateAvatar(dataUrl: string): Promise<Profile> {
  const { data } = await apiClient.put<Profile>('/profile/avatar', { dataUrl })
  return data
}

export async function removeAvatar(): Promise<Profile> {
  const { data } = await apiClient.delete<Profile>('/profile/avatar')
  return data
}

export async function changePassword(input: PasswordChange): Promise<void> {
  await apiClient.put('/profile/password', input)
}
