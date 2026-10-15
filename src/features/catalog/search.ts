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

/** Mesmo limite do contrato da API; os campos de busca usam este valor em `maxLength`. */
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

/** O que links e navegações podem passar: tudo opcional. */
export type CatalogSearchInput = Partial<CatalogSearch>

/** Valores padrão ficam fora da URL, para "/" e "/?page=1" serem o mesmo endereço. */
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

/**
 * Estado do catálogo na URL (§3: sobrevive a refresh e ao histórico).
 * Valor inválido digitado na URL cai no padrão em vez de quebrar a página; busca longa é cortada, nunca descartada.
 * Validação escrita à mão para o Zod não entrar no carregamento inicial.
 */
export function validateCatalogSearch(input: CatalogSearchInput): CatalogSearch {
  const raw = input as Record<string, unknown>
  const search = (text(raw.search) ?? '').trim().slice(0, SEARCH_MAX_LENGTH)
  const page = Number(raw.page)
  let priceMin = eth(raw.priceMin)
  let priceMax = eth(raw.priceMax)
  // Faixa invertida na URL é corrigida aqui, em vez de virar erro de validação na API.
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

/**
 * Validador no formato Standard Schema (o mesmo que o Zod segue): o roteador entende que nos links
 * tudo é opcional (input) e que dentro da página os padrões já estão preenchidos (output).
 */
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
