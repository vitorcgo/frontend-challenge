import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'
import { nftListQueryOptions } from './queries'
import { toListQuery, validateCatalogSearch, type CatalogSearch } from './search'

/** Busca do catálogo na URL. Fora da Início (atrás do modal de login), cai nos valores padrão. */
export function useCatalogSearch(): CatalogSearch {
  return validateCatalogSearch(useSearch({ strict: false }))
}

/** Qualquer mudança de busca, filtro, aba ou ordenação volta para a página 1 (§3). */
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

/** Mesma consulta da grade: filtros e grade compartilham o cache, sem requisição extra. */
export function useCatalogQuery(search: CatalogSearch) {
  return useQuery(nftListQueryOptions(toListQuery(search)))
}
