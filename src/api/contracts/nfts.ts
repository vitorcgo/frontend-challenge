import type { EthAmount } from '@/lib/eth'
import type { IsoDateTime, Paginated } from './common'

export const NFT_CATEGORIES = [
  'arte-digital',
  'fotografia',
  'musica',
  'arte-3d',
  'colecionaveis',
  'generativa',
  'jogos',
  'assinaturas',
  'utilidade',
] as const
export type NftCategory = (typeof NFT_CATEGORIES)[number]

export const NETWORKS = ['ethereum', 'polygon', 'solana'] as const
export type Network = (typeof NETWORKS)[number]

export const NFT_TABS = ['all', 'new', 'trending'] as const
export type NftTab = (typeof NFT_TABS)[number]

export const NFT_SORTS = ['recent', 'price-asc', 'price-desc', 'name-asc'] as const
export type NftSort = (typeof NFT_SORTS)[number]

export const EDITION_IDS = ['1-1', '1-10', '1-50', 'open'] as const
export type EditionId = (typeof EDITION_IDS)[number]

export const NFT_PAGE_SIZE = 9
export const MAX_QUANTITY_PER_ORDER = 10

export interface NftImage {
  alt: string
  /** 480 px de largura, para cards. */
  small: string
  /** 960 px de largura, para o detalhe e telas de alta densidade. */
  large: string
}

export interface NftEdition {
  id: EditionId
  label: string
  /** null para edição aberta. */
  supply: number | null
  available: number
}

export interface NftSummary {
  id: string
  name: string
  tokenId: string
  image: NftImage
  category: NftCategory
  network: Network
  price: EthAmount
  /** Preço anterior, exibido riscado quando houve redução. */
  previousPrice: EthAmount | null
  rare: boolean
  available: boolean
  listedAt: IsoDateTime
  version: number
}

export interface Nft extends NftSummary {
  /** Imagens da galeria do detalhe; a primeira é a mesma de `image`. */
  gallery: NftImage[]
  description: string
  story: string[]
  collection: { id: string; name: string }
  creator: { name: string; royaltyPercent: number }
  contract: { address: string; standard: 'ERC-721' }
  attributes: string[]
  rating: { average: string; count: number }
  editions: NftEdition[]
  maxPerOrder: number
}

/** Parâmetros de GET /api/nfts. Listas viram parâmetros repetidos na URL (?category=a&category=b). */
export interface NftListQuery {
  search?: string
  category?: NftCategory | NftCategory[]
  network?: Network | Network[]
  priceMin?: EthAmount
  priceMax?: EthAmount
  collection?: string
  tab?: NftTab
  sort?: NftSort
  page?: number
  pageSize?: number
}
/** NFT escolhido pela curadoria para o bloco "NFT em destaque" da Início. */
export interface FeaturedNftResponse {
  nft: NftSummary
  headline: string
  subtitle: string
}

export interface NftListResponse extends Paginated<NftSummary> {
  facets: {
    categories: Record<NftCategory, number>
    networks: Record<Network, number>
    priceRange: { min: EthAmount; max: EthAmount }
  }
}
