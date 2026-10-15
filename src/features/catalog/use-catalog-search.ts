import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'
import { nftListQueryOptions } from './queries'
import { toListQuery, validateCatalogSearch, type CatalogSearch } from './search'

export function useCatalogSearch(): CatalogSearch {
  return validateCatalogSearch(useSearch({ strict: false }))
}

export function useUpdateCatalogSearch() {
  const navigate = useNavigate()
  return useCallback(
    (patch: Partial<CatalogSearch>, options: { replace?: boolean } = {}) =>
      navigate({
        to: '/',
        search: (prev) => ({ ...validateCatalogSearch(prev), ...patch, page: 1 }),
        replace: options.replace,
        resetScroll: false,
      }),
    [navigate],
  )
}

export function useCatalogQuery(search: CatalogSearch) {
  return useQuery(nftListQueryOptions(toListQuery(search)))
}
