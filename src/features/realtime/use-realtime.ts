import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect, useSyncExternalStore } from 'react'
import type { Socket } from 'socket.io-client'
import {
  REALTIME_EVENTS,
  type Cart,
  type FeaturedNftResponse,
  type Nft,
  type NftListResponse,
  type NftUpdatedEvent,
} from '@/api/contracts'
import { getSessionToken, subscribeSessionToken } from '@/api/session-token'
import { cartKeys } from '@/features/cart/keys'
import { nftKeys } from '@/features/catalog/queries'
import { announce } from '@/lib/announce'
import { apiReady } from '@/lib/api-ready'
import { formatEth } from '@/lib/format'

const seenEvents = new Set<string>()
const appliedVersion = new Map<string, number>()
const MAX_SEEN = 500

function knownVersion(queryClient: QueryClient, id: string) {
  const versions = [appliedVersion.get(id) ?? 0, queryClient.getQueryData<Nft>(nftKeys.detail(id))?.version ?? 0]
  for (const [, list] of queryClient.getQueriesData<NftListResponse>({ queryKey: nftKeys.lists() })) {
    const nft = list?.items.find((item) => item.id === id)
    if (nft) versions.push(nft.version)
  }
  return Math.max(...versions)
}

/** Repetido ou mais velho que o que já se conhece: ignorado, para nunca voltar a um estado anterior. */
function shouldApply(queryClient: QueryClient, event: NftUpdatedEvent) {
  if (seenEvents.has(event.id)) return false
  seenEvents.add(event.id)
  if (seenEvents.size > MAX_SEEN) seenEvents.delete(seenEvents.values().next().value!)
  if (knownVersion(queryClient, event.resource.id) >= event.version) return false
  appliedVersion.set(event.resource.id, event.version)
  return true
}

function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent) {
  if (!shouldApply(queryClient, event)) return
  const id = event.resource.id
  const { price, previousPrice, available, editions } = event.data
  const changes = { price, previousPrice, available, version: event.version }

  queryClient.setQueryData<Nft>(nftKeys.detail(id), (nft) => nft && { ...nft, ...changes, editions })
  queryClient.setQueriesData<NftListResponse>({ queryKey: nftKeys.lists() }, (list) =>
    list && { ...list, items: list.items.map((nft) => (nft.id === id ? { ...nft, ...changes } : nft)) },
  )
  queryClient.setQueryData<FeaturedNftResponse>(nftKeys.featured(), (featured) =>
    featured && featured.nft.id === id ? { ...featured, nft: { ...featured.nft, ...changes } } : featured,
  )

  // O carrinho é recalculado pela API (preço, estoque e resumo); a interface só avisa.
  const inCart = queryClient
    .getQueriesData<Cart>({ queryKey: cartKeys.all })
    .flatMap(([, cart]) => cart?.items ?? [])
    .find((item) => item.nftId === id)
  if (inCart) {
    void queryClient.invalidateQueries({ queryKey: cartKeys.all })
    announce(
      available
        ? `${inCart.name} no seu carrinho agora custa ${formatEth(price)}. O resumo foi atualizado.`
        : `${inCart.name} no seu carrinho esgotou. O resumo foi atualizado.`,
    )
  }
}

/** Ao reconectar, eventos podem ter sido perdidos: catálogo e carrinho voltam a ser lidos da API. */
function reconcile(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: nftKeys.all })
  void queryClient.invalidateQueries({ queryKey: cartKeys.all })
}

/** Um socket por sessão: trocar de usuário fecha o anterior e com ele as inscrições da sessão antiga. */
export function useRealtime() {
  const queryClient = useQueryClient()
  const token = useSyncExternalStore(subscribeSessionToken, getSessionToken)

  useEffect(() => {
    let cancelled = false
    let socket: Socket | undefined

    // Depois dos mocks (que respondem pelo socket) e fora do carregamento inicial.
    void apiReady.then(async () => {
      const { createSocket } = await import('@/lib/socket')
      if (cancelled) return
      let connectedBefore = false
      socket = createSocket()
      socket.on('connect', () => {
        if (token) socket?.emit(REALTIME_EVENTS.sessionJoin, token)
        if (connectedBefore) reconcile(queryClient)
        connectedBefore = true
      })
      socket.on(REALTIME_EVENTS.nftUpdated, (event: NftUpdatedEvent) => applyNftUpdated(queryClient, event))
      socket.connect()
    })

    return () => {
      cancelled = true
      socket?.removeAllListeners()
      socket?.disconnect()
    }
  }, [token, queryClient])
}
