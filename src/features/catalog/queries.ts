import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { NftListQuery } from '@/api/contracts'
import { getNft, listNfts } from '@/api/endpoints/nfts'

/** Remove valores vazios para que a mesma busca gere sempre a mesma chave de cache. */
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
}

export function nftListQueryOptions(query: NftListQuery) {
  const params = normalize(query)
  return queryOptions({
    queryKey: nftKeys.list(params),
    // O signal cancela a requisição quando a busca muda, então resposta antiga nunca sobrescreve a nova.
    queryFn: ({ signal }) => listNfts(params, signal),
    // Mantém a página anterior visível enquanto a próxima carrega.
    placeholderData: keepPreviousData,
  })
}

export function nftDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: ({ signal }) => getNft(id, signal),
  })
}
