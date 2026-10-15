import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { NftListQuery } from '@/api/contracts'
import { getFeaturedNft, getNft, listNfts } from '@/api/endpoints/nfts'

function normalize(query: NftListQuery): NftListQuery {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== '' && !(Array.isArray(value) && !value.length)),
  ) as NftListQuery
}

export const nftKeys = {
  all: ['nfts'] as const,
  lists: () => [...nftKeys.all, 'list'] as const,
  list: (query: NftListQuery) => [...nftKeys.lists(), normalize(query)] as const,
  details: () => [...nftKeys.all, 'detail'] as const,
  detail: (id: string) => [...nftKeys.details(), id] as const,
  featured: () => [...nftKeys.all, 'featured'] as const,
}

export function featuredNftQueryOptions() {
  return queryOptions({
    queryKey: nftKeys.featured(),
    queryFn: ({ signal }) => getFeaturedNft(signal),
  })
}

export function nftListQueryOptions(query: NftListQuery) {
  const params = normalize(query)
  return queryOptions({
    queryKey: nftKeys.list(params),
    queryFn: ({ signal }) => listNfts(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function nftDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: ({ signal }) => getNft(id, signal),
  })
}
