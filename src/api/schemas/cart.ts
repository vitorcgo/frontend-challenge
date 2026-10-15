import { z } from 'zod'
import { EDITION_IDS, type CartItemInput, type CartItemUpdate, type CartMergeInput, type CouponInput } from '../contracts'

export const cartItemInputSchema = z.object({
  nftId: z.string().min(1),
  editionId: z.enum(EDITION_IDS),
  quantity: z.number().int().min(1, 'A quantidade mínima é 1.'),
}) satisfies z.ZodType<CartItemInput>

export const cartItemUpdateSchema = z.object({
  quantity: z.number().int().min(1, 'A quantidade mínima é 1.'),
}) satisfies z.ZodType<CartItemUpdate>

export const couponInputSchema = z.object({
  code: z.string().trim().toUpperCase().min(1, 'Informe o código.').max(30, 'Código muito longo.'),
}) satisfies z.ZodType<CouponInput>

export const cartMergeSchema = z.object({
  guestCartId: z.string().min(8),
}) satisfies z.ZodType<CartMergeInput>
