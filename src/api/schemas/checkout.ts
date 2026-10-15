import { z } from 'zod'
import { NETWORKS, type OrderInput, type QuoteRequest } from '../contracts'

export const quoteRequestSchema = z.object({
  walletId: z.string().min(1),
  network: z.enum(NETWORKS, 'Selecione uma rede.'),
}) satisfies z.ZodType<QuoteRequest>

export const orderInputSchema = z.object({
  quoteId: z.string().min(1),
}) satisfies z.ZodType<OrderInput>
