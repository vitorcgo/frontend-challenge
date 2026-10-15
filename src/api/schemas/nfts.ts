import { z } from 'zod'
import { compareEth } from '@/lib/eth'
import { NETWORKS, NFT_CATEGORIES, NFT_PAGE_SIZE, NFT_SORTS, NFT_TABS } from '../contracts'

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
