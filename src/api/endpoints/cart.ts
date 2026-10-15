import { apiClient } from '../client'
import type { Cart, CartItemInput, CartMergeInput } from '../contracts'

export async function getCart(signal?: AbortSignal): Promise<Cart> {
  const { data } = await apiClient.get<Cart>('/cart', { signal })
  return data
}

export async function addCartItem(input: CartItemInput): Promise<Cart> {
  const { data } = await apiClient.post<Cart>('/cart/items', input)
  return data
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  const { data } = await apiClient.patch<Cart>(`/cart/items/${encodeURIComponent(itemId)}`, { quantity })
  return data
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const { data } = await apiClient.delete<Cart>(`/cart/items/${encodeURIComponent(itemId)}`)
  return data
}

export async function applyCoupon(code: string): Promise<Cart> {
  const { data } = await apiClient.put<Cart>('/cart/coupon', { code })
  return data
}

export async function removeCoupon(): Promise<Cart> {
  const { data } = await apiClient.delete<Cart>('/cart/coupon')
  return data
}

export async function mergeGuestCart(input: CartMergeInput): Promise<Cart> {
  const { data } = await apiClient.post<Cart>('/cart/merge', input)
  return data
}
