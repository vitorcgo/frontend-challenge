import { apiClient } from '../client'
import { IDEMPOTENCY_HEADER, type Order, type Quote, type QuoteRequest } from '../contracts'

export async function createQuote(input: QuoteRequest): Promise<Quote> {
  const { data } = await apiClient.post<Quote>('/checkout/quote', input)
  return data
}

export async function createOrder(quoteId: string, idempotencyKey: string): Promise<Order> {
  const { data } = await apiClient.post<Order>('/orders', { quoteId }, { headers: { [IDEMPOTENCY_HEADER]: idempotencyKey } })
  return data
}

export async function getOrder(id: string, signal?: AbortSignal): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/orders/${encodeURIComponent(id)}`, { signal })
  return data
}
