import { z } from 'zod'
import { compareEth, type EthAmount } from '@/lib/eth'
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

const csvList = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .union([z.enum(values), z.array(z.enum(values))])
    .transform((value) => (Array.isArray(value) ? value : [value]))

const ethParam = z.string().regex(/^\d+(\.\d{1,18})?$/, 'Valor em ETH inválido.')

export const nftListQuerySchema = z
  .object({
    search: z.string().trim().max(80).optional(),
    category: csvList(NFT_CATEGORIES).optional(),
    network: csvList(NETWORKS).optional(),
    priceMin: ethParam.optional(),
    priceMax: ethParam.optional(),
    collection: z.string().optional(),
    tab: z.enum(NFT_TABS).default('all'),
    sort: z.enum(NFT_SORTS).default('recent'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(36).default(NFT_PAGE_SIZE),
  })
  .refine((query) => !query.priceMin || !query.priceMax || compareEth(query.priceMin, query.priceMax) <= 0, {
    path: ['priceMax'],
    message: 'O preço máximo precisa ser maior ou igual ao mínimo.',
  })
export type NftListQuery = z.input<typeof nftListQuerySchema>

export interface NftListResponse extends Paginated<NftSummary> {
  facets: {
    categories: Record<NftCategory, number>
    networks: Record<Network, number>
    priceRange: { min: EthAmount; max: EthAmount }
  }
}
