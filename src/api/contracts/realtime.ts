import type { EthAmount } from '@/lib/eth'
import type { IsoDateTime } from './common'
import type { NftEdition } from './nfts'

export interface RealtimeEvent<Type extends string, Resource extends string, Data> {
  /** Identidade estável: o mesmo evento repetido chega com o mesmo id. */
  id: string
  type: Type
  resource: { type: Resource; id: string }
  version: number
  occurredAt: IsoDateTime
  data: Data
}

export interface NftUpdatedData {
  price: EthAmount
  previousPrice: EthAmount | null
  available: boolean
  editions: NftEdition[]
}

export type NftUpdatedEvent = RealtimeEvent<'nft.updated', 'nft', NftUpdatedData>

export const REALTIME_EVENTS = {
  nftUpdated: 'nft.updated',
  orderUpdated: 'order.updated',
  sessionJoin: 'session.join',
} as const
