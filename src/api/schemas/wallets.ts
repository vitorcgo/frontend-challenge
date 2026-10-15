import { z } from 'zod'
import {
  NETWORKS,
  WALLET_SLOTS,
  WALLET_TYPES,
  type WalletConnectRequest,
  type WalletCreate,
  type WalletInput,
} from '../contracts'
import { emailSchema } from './auth'
import { ensNameSchema } from './profile'

export const walletAddressSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Informe um endereço 0x com 40 caracteres hexadecimais.')

const requiredText = (max: number) =>
  z.string().trim().min(2, 'Use pelo menos 2 caracteres.').max(max, `Use no máximo ${max} caracteres.`)

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
}) satisfies z.ZodType<WalletInput, unknown>

export const walletCreateSchema = walletInputSchema.extend({
  slot: z.enum(WALLET_SLOTS),
}) satisfies z.ZodType<WalletCreate, unknown>

export const walletConnectSchema = z.object({
  network: z.enum(NETWORKS, 'Selecione uma rede.'),
}) satisfies z.ZodType<WalletConnectRequest>
