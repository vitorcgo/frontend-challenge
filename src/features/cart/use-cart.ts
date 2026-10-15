import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Cart, CartItemInput } from '@/api/contracts'
import { addCartItem, applyCoupon, getCart, removeCartItem, removeCoupon, updateCartItem } from '@/api/endpoints/cart'
import { useSession } from '@/features/auth/session'
import { cartKeys } from './keys'

function useCartKey() {
  const { user, isLoading } = useSession()
  return { key: cartKeys.detail(user ? user.id : 'guest'), ready: !isLoading }
}

export function useCart() {
  const { key, ready } = useCartKey()
  return useQuery({ queryKey: key, queryFn: ({ signal }) => getCart(signal), enabled: ready })
}

export function useCartCount() {
  return useCart().data?.itemCount ?? 0
}

/** Todas as alterações do carrinho em fila: cada uma parte do resultado da anterior. */
function useCartMutation<Input>(mutationFn: (input: Input) => Promise<Cart>) {
  const queryClient = useQueryClient()
  const { key } = useCartKey()
  return useMutation({
    scope: { id: 'cart' },
    mutationFn,
    onSuccess: (cart) => queryClient.setQueryData(key, cart),
  })
}

export const useAddToCart = () => useCartMutation((input: CartItemInput) => addCartItem(input))
export const useUpdateCartItem = () =>
  useCartMutation(({ itemId, quantity }: { itemId: string; quantity: number }) => updateCartItem(itemId, quantity))
export const useRemoveCartItem = () => useCartMutation((itemId: string) => removeCartItem(itemId))
export const useApplyCoupon = () => useCartMutation((code: string) => applyCoupon(code))
export const useRemoveCoupon = () => useCartMutation(() => removeCoupon())
