import type { EthAmount } from '@/lib/eth'
import type { IsoDateTime } from './common'
import type { EditionId, NftImage, Network } from './nfts'

export type CartItemIssue = 'sold-out' | 'insufficient'

export interface CartItem {
  id: string
  nftId: string
  /** Versão do NFT usada no cálculo; eventos com versão menor ou igual são antigos. */
  nftVersion: number
  name: string
  tokenId: string
  image: NftImage
  network: Network
  editionId: EditionId
  editionLabel: string
  quantity: number
  /** Unidades que ainda restam na edição, já limitadas ao máximo por pedido. */
  maxQuantity: number
  unitPrice: EthAmount
  /** Preço quando o item entrou no carrinho; diferente de `unitPrice` se o preço mudou depois. */
  addedPrice: EthAmount
  lineTotal: EthAmount
  issue: CartItemIssue | null
}

export interface CartCoupon {
  code: string
  description: string
}

export interface CartSummary {
  subtotal: EthAmount
  discount: EthAmount
  networkFee: EthAmount
  total: EthAmount
}

export interface Cart {
  items: CartItem[]
  itemCount: number
  coupon: CartCoupon | null
  summary: CartSummary
  updatedAt: IsoDateTime
}

export interface CartItemInput {
  nftId: string
  editionId: EditionId
  quantity: number
}

export interface CartItemUpdate {
  quantity: number
}

export interface CouponInput {
  code: string
}

export interface CartMergeInput {
  guestCartId: string
}

/** Cabeçalho que identifica o carrinho de quem ainda não entrou na conta. */
export const GUEST_CART_HEADER = 'X-Guest-Cart'
