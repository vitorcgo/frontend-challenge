import { useQuery } from '@tanstack/react-query'
import { getOrder } from '@/api/endpoints/checkout'
import { getWallets } from '@/api/endpoints/wallets'
import { useSession } from '@/features/auth/session'

export const walletKeys = {
  list: (userId: string | undefined) => ['wallets', userId] as const,
}

export const orderKeys = {
  all: ['orders'] as const,
  detail: (id: string) => ['orders', id] as const,
}

export function useWallets() {
  const { user } = useSession()
  return useQuery({ queryKey: walletKeys.list(user?.id), queryFn: ({ signal }) => getWallets(signal), enabled: Boolean(user) })
}

const PENDING_POLL_MS = 5000

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: ({ signal }) => getOrder(id, signal),
    // O `order.updated` chega pelo socket; a leitura periódica é só a rede de segurança se o socket cair.
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? PENDING_POLL_MS : false),
  })
}
