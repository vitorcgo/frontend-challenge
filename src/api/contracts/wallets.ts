import type { IsoDateTime } from './common'
import type { Network } from './nfts'

export const WALLET_SLOTS = ['primary', 'secondary'] as const
export type WalletSlot = (typeof WALLET_SLOTS)[number]

export const WALLET_TYPES = ['metamask', 'walletconnect', 'coinbase'] as const
export type WalletType = (typeof WALLET_TYPES)[number]

export interface WalletInput {
  displayName: string
  alias: string
  network: Network
  profileName: string
  address: string
  secondaryAddress: string
  walletType: WalletType
  referralCode: string
  email: string
  ensName: string
}

export interface WalletCreate extends WalletInput {
  slot: WalletSlot
}

export interface Wallet extends WalletInput {
  id: string
  slot: WalletSlot
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export interface WalletConnectRequest {
  network: Network
}

export interface WalletConnection {
  walletId: string
  network: Network
  connectedAt: IsoDateTime
}

export interface WalletsResponse {
  primary: Wallet | null
  secondary: Wallet | null
  connection: WalletConnection | null
}
