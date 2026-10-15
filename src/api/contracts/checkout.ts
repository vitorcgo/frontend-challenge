import type { EthAmount } from '@/lib/eth'
import type { CartCoupon, CartSummary } from './cart'
import type { IsoDateTime } from './common'
import type { EditionId, Network, NftImage } from './nfts'
import type { RealtimeEvent } from './realtime'
import type { WalletType } from './wallets'

export interface QuoteRequest {
  walletId: string
  network: Network
}

export interface QuoteItem {
  nftId: string
  name: string
  tokenId: string
  image: NftImage
  editionId: EditionId
  editionLabel: string
  quantity: number
  unitPrice: EthAmount
  lineTotal: EthAmount
}

/** Valores que o pedido vai cobrar; o pedido só é aceito se o catálogo ainda bater com eles. */
export interface Quote {
  id: string
  items: QuoteItem[]
  coupon: CartCoupon | null
  summary: CartSummary
  walletId: string
  network: Network
  createdAt: IsoDateTime
  expiresAt: IsoDateTime
}

export interface OrderInput {
  quoteId: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'rejected'

/** Recibo: cópia dos valores da cotação no momento do pedido, que não muda com o catálogo depois. */
export interface Order {
  id: string
  status: OrderStatus
  version: number
  items: QuoteItem[]
  coupon: CartCoupon | null
  summary: CartSummary
  wallet: { id: string; walletType: WalletType; address: string; network: Network }
  transactionHash: string | null
  explorerUrl: string | null
  rejectionReason: string | null
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export const IDEMPOTENCY_HEADER = 'Idempotency-Key'

export interface OrderUpdatedData {
  status: OrderStatus
  transactionHash: string | null
  rejectionReason: string | null
}

export type OrderUpdatedEvent = RealtimeEvent<'order.updated', 'order', OrderUpdatedData>

/** Detalhes do 409 QUOTE_STALE: o que mudou desde a cotação. */
export interface QuoteChange {
  nftId: string | null
  name: string
  kind: 'price' | 'availability' | 'coupon' | 'fee' | 'cart'
  from: string
  to: string
}
