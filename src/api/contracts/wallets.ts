import { z } from 'zod'
import { emailSchema } from './auth'
import type { IsoDateTime } from './common'
import { NETWORKS, type Network } from './nfts'
import { ensNameSchema } from './profile'

export const WALLET_SLOTS = ['primary', 'secondary'] as const
export type WalletSlot = (typeof WALLET_SLOTS)[number]

export const WALLET_TYPES = ['metamask', 'walletconnect', 'coinbase'] as const
export type WalletType = (typeof WALLET_TYPES)[number]

export const walletAddressSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Informe um endereço 0x com 40 caracteres hexadecimais.')

const requiredText = (max: number) =>
  z.string().trim().min(2, 'Use pelo menos 2 caracteres.').max(max, `Use no máximo ${max} caracteres.`)

/** Campos do formulário "Carteiras" do Figma. */
export const walletInputSchema = z.object({
  displayName: requiredText(40),
  alias: requiredText(40),
  network: z.enum(NETWORKS, 'Selecione uma rede.'),
  profileName: requiredText(40),
  address: walletAddressSchema,
  secondaryAddress: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^0x[a-fA-F0-9]{40}$/.test(value) || /^[a-z0-9-]{3,40}\.eth$/.test(value),
      'Informe um endereço 0x ou um nome ENS terminado em ".eth".',
    )
    .default(''),
  walletType: z.enum(WALLET_TYPES, 'Selecione uma carteira.'),
  referralCode: z
    .string()
    .trim()
    .regex(/^[A-Z0-9]{4,12}$/, 'Use de 4 a 12 letras maiúsculas ou números.'),
  email: emailSchema,
  ensName: ensNameSchema,
})
export type WalletInput = z.input<typeof walletInputSchema>

export const walletCreateSchema = walletInputSchema.extend({ slot: z.enum(WALLET_SLOTS) })
export type WalletCreate = z.input<typeof walletCreateSchema>

export interface Wallet extends z.output<typeof walletInputSchema> {
  id: string
  slot: WalletSlot
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export const walletConnectSchema = z.object({ network: z.enum(NETWORKS, 'Selecione uma rede.') })
export type WalletConnectRequest = z.infer<typeof walletConnectSchema>

export interface WalletConnection {
  walletId: string
  network: Network
  connectedAt: IsoDateTime
}

export interface WalletsResponse {
  primary: Wallet | null
  secondary: Wallet | null
  /** Conexão simulada ativa nesta sessão. */
  connection: WalletConnection | null
}
