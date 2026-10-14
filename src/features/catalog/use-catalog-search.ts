import { useQuery } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { nftListQueryOptions } from './queries'
import { toListQuery, type CatalogSearch } from './search'

const homeRoute = getRouteApi('/')

export function useCatalogSearch(): CatalogSearch {
  return homeRoute.useSearch()
}

/** Qualquer mudança de busca, filtro, aba ou ordenação volta para a página 1 (§3). */
export function useUpdateCatalogSearch() {
  const navigate = useNavigate({ from: '/' })
  return useCallback(
    (patch: Partial<CatalogSearch>, options: { replace?: boolean } = {}) =>
      navigate({
        search: (prev) => ({ ...prev, ...patch, page: 1 }),
        replace: options.replace,
        resetScroll: false,
      }),
    [navigate],
  )
}

/** Mesma consulta da grade: filtros e grade compartilham o cache, sem requisição extra. */
export function useCatalogQuery(search: CatalogSearch) {
  return useQuery(nftListQueryOptions(toListQuery(search)))
}
