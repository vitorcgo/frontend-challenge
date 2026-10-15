import {
  NETWORKS,
  NFT_CATEGORIES,
  NFT_SORTS,
  NFT_TABS,
  type Network,
  type NftCategory,
  type NftListQuery,
  type NftSort,
  type NftTab,
} from '@/api/contracts'
import { compareEth, isEthAmount } from '@/lib/eth'

export const SEARCH_MAX_LENGTH = 80

export interface CatalogSearch {
  search?: string
  category?: NftCategory[]
  network?: Network[]
  priceMin?: string
  priceMax?: string
  tab: NftTab
  sort: NftSort
  page: number
}

export type CatalogSearchInput = Partial<CatalogSearch>

export const CATALOG_DEFAULTS = { tab: 'all', sort: 'recent', page: 1 } as const

const oneOf = <T extends string>(options: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (options as readonly string[]).includes(value)

function list<T extends string>(options: readonly T[], value: unknown): T[] | undefined {
  if (!Array.isArray(value)) return undefined
  const valid = [...new Set(value.filter((item): item is T => oneOf(options, item)))]
  return valid.length ? valid : undefined
}

// O roteador lê a URL como JSON: "?priceMax=1" digitado à mão chega como número, não como texto.
const text = (value: unknown) =>
  typeof value === 'string' ? value : typeof value === 'number' || typeof value === 'boolean' ? String(value) : undefined

const eth = (value: unknown) => {
  const amount = text(value)
  return amount !== undefined && isEthAmount(amount) ? amount : undefined
}

// Escrito à mão, sem Zod, para não pesar no carregamento inicial.
export function validateCatalogSearch(input: CatalogSearchInput): CatalogSearch {
  const raw = input as Record<string, unknown>
  const search = (text(raw.search) ?? '').trim().slice(0, SEARCH_MAX_LENGTH)
  const page = Number(raw.page)
  let priceMin = eth(raw.priceMin)
  let priceMax = eth(raw.priceMax)
  if (priceMin && priceMax && compareEth(priceMin, priceMax) > 0) [priceMin, priceMax] = [priceMax, priceMin]
  return {
    search: search || undefined,
    category: list(NFT_CATEGORIES, raw.category),
    network: list(NETWORKS, raw.network),
    priceMin,
    priceMax,
    tab: oneOf(NFT_TABS, raw.tab) ? raw.tab : CATALOG_DEFAULTS.tab,
    sort: oneOf(NFT_SORTS, raw.sort) ? raw.sort : CATALOG_DEFAULTS.sort,
    page: Number.isInteger(page) && page >= 1 ? page : CATALOG_DEFAULTS.page,
  }
}

// Formato Standard Schema: o roteador tipa os links com o input (tudo opcional) e a página com o output.
export const catalogSearchValidator = {
  '~standard': {
    version: 1,
    vendor: 'kurio',
    validate: (value: unknown) => ({ value: validateCatalogSearch((value ?? {}) as CatalogSearchInput) }),
    types: undefined as unknown as { input: CatalogSearchInput; output: CatalogSearch },
  },
} as const

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
