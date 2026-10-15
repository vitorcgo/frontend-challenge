import { useQuery } from '@tanstack/react-query'
import { getProfile } from '@/api/endpoints/profile'
import { useSession } from '@/features/auth/session'

export const profileKeys = {
  detail: (userId: string | undefined) => ['profile', userId] as const,
}

export function useProfile() {
  const { user } = useSession()
  return useQuery({ queryKey: profileKeys.detail(user?.id), queryFn: ({ signal }) => getProfile(signal), enabled: Boolean(user) })
}
