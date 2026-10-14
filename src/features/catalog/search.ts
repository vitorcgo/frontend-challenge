import { z } from 'zod'
import { NETWORKS, NFT_CATEGORIES, NFT_SORTS, NFT_TABS, type NftListQuery } from '@/api/contracts'

const ethParam = z.string().regex(/^\d+(\.\d{1,18})?$/)

/**
 * Estado do catálogo na URL (§3: sobrevive a refresh e ao histórico).
 * Valores inválidos digitados na URL caem no padrão em vez de quebrar a página.
 */
export const catalogSearchSchema = z.object({
  search: z.string().trim().max(80).optional().catch(undefined),
  category: z.array(z.enum(NFT_CATEGORIES)).optional().catch(undefined),
  network: z.array(z.enum(NETWORKS)).optional().catch(undefined),
  priceMin: ethParam.optional().catch(undefined),
  priceMax: ethParam.optional().catch(undefined),
  tab: z.enum(NFT_TABS).default('all').catch('all'),
  sort: z.enum(NFT_SORTS).default('recent').catch('recent'),
  page: z.number().int().min(1).default(1).catch(1),
})

export type CatalogSearch = z.output<typeof catalogSearchSchema>

/** Valores padrão ficam fora da URL, para "/" e "/?page=1" serem o mesmo endereço. */
export const CATALOG_DEFAULTS = { tab: 'all', sort: 'recent', page: 1 } as const

export function toListQuery(search: CatalogSearch): NftListQuery {
  return {
    search: search.search,
    category: search.category,
    network: search.network,
    priceMin: search.priceMin,
    priceMax: search.priceMax,
    tab: search.tab,
    sort: search.sort,
    page: search.page,
  }
}

export function hasActiveFilters(search: CatalogSearch): boolean {
  return Boolean(
    search.search || search.category?.length || search.network?.length || search.priceMin || search.priceMax,
  )
}
