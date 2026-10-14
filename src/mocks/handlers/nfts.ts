import { http, HttpResponse } from 'msw'
import {
  NETWORKS,
  NFT_CATEGORIES,
  nftListQuerySchema,
  type Network,
  type Nft,
  type NftCategory,
  type NftListResponse,
} from '@/api/contracts'
import { compareEth } from '@/lib/eth'
import { read } from '../db'
import type { NftRecord } from '../fixtures/nfts'
import { API, notFound, param, route, validate } from '../http'
import { toNft, toNftSummary } from '../mappers'
import { getScenario } from '../scenarios'

type ListQuery = ReturnType<typeof nftListQuerySchema.parse>

function parseQuery(url: URL): ListQuery {
  const multi = (name: string) => {
    const values = url.searchParams.getAll(name).flatMap((value) => value.split(',')).filter(Boolean)
    return values.length ? values : undefined
  }
  const single = (name: string) => url.searchParams.get(name) || undefined
  return validate(nftListQuerySchema, {
    search: single('search'),
    category: multi('category'),
    network: multi('network'),
    priceMin: single('priceMin'),
    priceMax: single('priceMax'),
    collection: single('collection'),
    tab: single('tab'),
    sort: single('sort'),
    page: single('page'),
    pageSize: single('pageSize'),
  })
}

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

type Filter = 'category' | 'network'

/** Aplica todos os filtros, exceto os ignorados (usado para calcular as contagens de cada faceta). */
function applyFilters(nfts: NftRecord[], query: ListQuery, ignore?: Filter): NftRecord[] {
  const search = query.search ? normalize(query.search) : ''
  return nfts.filter((nft) => {
    if (search && !normalize(`${nft.name} ${nft.collection.name} ${nft.creator.name}`).includes(search)) return false
    if (query.collection && nft.collection.id !== query.collection) return false
    if (query.tab === 'new' && !nft.newRelease) return false
    if (query.tab === 'trending' && nft.trendingScore === 0) return false
    if (query.priceMin && compareEth(nft.price, query.priceMin) < 0) return false
    if (query.priceMax && compareEth(nft.price, query.priceMax) > 0) return false
    if (ignore !== 'category' && query.category && !query.category.includes(nft.category)) return false
    if (ignore !== 'network' && query.network && !query.network.includes(nft.network)) return false
    return true
  })
}

function sortNfts(nfts: NftRecord[], query: ListQuery): NftRecord[] {
  const sorted = [...nfts]
  switch (query.sort) {
    case 'price-asc':
      return sorted.sort((a, b) => compareEth(a.price, b.price) || a.name.localeCompare(b.name))
    case 'price-desc':
      return sorted.sort((a, b) => compareEth(b.price, a.price) || a.name.localeCompare(b.name))
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    default:
      return sorted.sort((a, b) => b.listedAt.localeCompare(a.listedAt))
  }
}

function countBy<K extends string>(keys: readonly K[], nfts: NftRecord[], pick: (nft: NftRecord) => K) {
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>
  for (const nft of nfts) counts[pick(nft)] += 1
  return counts
}

function priceRange(nfts: NftRecord[]) {
  if (!nfts.length) return { min: '0', max: '0' }
  const prices = nfts.map((nft) => nft.price).sort(compareEth)
  return { min: prices[0]!, max: prices[prices.length - 1]! }
}

export const nftHandlers = [
  http.get(
    `${API}/nfts`,
    route(({ request }) => {
      const query = parseQuery(new URL(request.url))
      const catalog = getScenario() === 'empty-catalog' ? [] : read((db) => db.nfts)

      const filtered = sortNfts(applyFilters(catalog, query), query)
      const total = filtered.length
      const start = (query.page - 1) * query.pageSize

      return HttpResponse.json<NftListResponse>({
        items: filtered.slice(start, start + query.pageSize).map(toNftSummary),
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
        facets: {
          categories: countBy<NftCategory>(NFT_CATEGORIES, applyFilters(catalog, query, 'category'), (n) => n.category),
          networks: countBy<Network>(NETWORKS, applyFilters(catalog, query, 'network'), (n) => n.network),
          priceRange: priceRange(catalog),
        },
      })
    }),
  ),

  http.get(
    `${API}/nfts/:id`,
    route(({ params }) => {
      const id = param(params, 'id')
      const nft = getScenario() === 'empty-catalog' ? undefined : read((db) => db.nfts.find((item) => item.id === id))
      if (!nft) throw notFound('Este NFT não existe ou foi removido do catálogo.')
      return HttpResponse.json<Nft>(toNft(nft))
    }),
  ),
]
