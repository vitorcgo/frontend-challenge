import { http, HttpResponse } from 'msw'
import { GUEST_CART_HEADER, type Cart, type CartItem } from '@/api/contracts'
import { cartItemInputSchema, cartItemUpdateSchema, cartMergeSchema, couponInputSchema } from '@/api/schemas'
import { addEth, multiplyEth, percentOfEth, subtractEth } from '@/lib/eth'
import { read, write, type CartRecord, type MockDatabase } from '../db'
import { COUPONS, NETWORK_FEES } from '../fixtures/pricing'
import { ApiFailure, API, newId, notFound, nowIso, param, readJson, requireSession, route } from '../http'

/** Carrinho de quem entrou na conta, ou do visitante identificado pelo cabeçalho. */
function cartKey(request: Request): string | null {
  if (request.headers.has('Authorization')) return `user:${requireSession(request).user.id}`
  const guestId = request.headers.get(GUEST_CART_HEADER)
  return guestId ? `guest:${guestId}` : null
}

function requireCartKey(request: Request): string {
  const key = cartKey(request)
  if (!key) throw new ApiFailure(422, 'VALIDATION_ERROR', 'Carrinho não identificado.')
  return key
}

const emptyCart = (): CartRecord => ({ items: [], couponCode: null, updatedAt: nowIso() })

function findCoupon(code: string | null) {
  const coupon = COUPONS.find((item) => item.code === code)
  return coupon && Date.parse(coupon.expiresAt) > Date.now() ? coupon : undefined
}

export function toCart(record: CartRecord, db: Readonly<MockDatabase>): Cart {
  const items: CartItem[] = []
  for (const item of record.items) {
    const nft = db.nfts.find((candidate) => candidate.id === item.nftId)
    const edition = nft?.editions.find((candidate) => candidate.id === item.editionId)
    if (!nft || !edition) continue
    const maxQuantity = Math.min(edition.available, nft.maxPerOrder)
    items.push({
      id: item.id,
      nftId: nft.id,
      nftVersion: nft.version,
      name: nft.name,
      tokenId: nft.tokenId,
      image: nft.image,
      network: nft.network,
      editionId: edition.id,
      editionLabel: edition.label,
      quantity: item.quantity,
      maxQuantity,
      unitPrice: nft.price,
      addedPrice: item.addedPrice,
      lineTotal: multiplyEth(nft.price, item.quantity),
      issue: maxQuantity === 0 ? 'sold-out' : item.quantity > maxQuantity ? 'insufficient' : null,
    })
  }

  // Itens com problema de estoque ficam fora do valor até a pessoa ajustar a quantidade.
  const payable = items.filter((item) => item.issue === null)
  const subtotal = addEth('0', ...payable.map((item) => item.lineTotal))
  const coupon = findCoupon(record.couponCode)
  const discount = coupon ? percentOfEth(subtotal, coupon.percent) : '0'
  const networks = new Set(payable.map((item) => item.network))
  const networkFee = addEth('0', ...[...networks].map((network) => NETWORK_FEES[network]))

  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    coupon: coupon ? { code: coupon.code, description: coupon.description } : null,
    summary: { subtotal, discount, networkFee, total: addEth(subtractEth(subtotal, discount), networkFee) },
    updatedAt: record.updatedAt,
  }
}

function respond(key: string | null) {
  return HttpResponse.json<Cart>(read((db) => toCart((key && db.carts[key]) || emptyCart(), db)))
}

function updateCart(key: string, change: (cart: CartRecord, db: MockDatabase) => void) {
  write((db) => {
    const cart = (db.carts[key] ??= emptyCart())
    change(cart, db)
    cart.updatedAt = nowIso()
  })
  return respond(key)
}

function availableUnits(db: Readonly<MockDatabase>, nftId: string, editionId: string) {
  const nft = db.nfts.find((item) => item.id === nftId)
  const edition = nft?.editions.find((item) => item.id === editionId)
  if (!nft || !edition) throw notFound('Este NFT não existe ou foi removido do catálogo.')
  return { nft, max: Math.min(edition.available, nft.maxPerOrder), label: edition.label }
}

function availabilityConflict(max: number, label: string) {
  const message =
    max === 0 ? `A edição ${label} esgotou.` : `Só ${max === 1 ? 'resta 1 unidade' : `restam ${max} unidades`} da edição ${label} para este pedido.`
  return new ApiFailure(409, 'AVAILABILITY_CONFLICT', message, undefined, { maxQuantity: max })
}

export const cartHandlers = [
  http.get(
    `${API}/cart`,
    route(({ request }) => respond(cartKey(request))),
  ),

  http.post(
    `${API}/cart/items`,
    route(async ({ request }) => {
      const key = requireCartKey(request)
      const input = await readJson(request, cartItemInputSchema)
      return updateCart(key, (cart, db) => {
        const { nft, max, label } = availableUnits(db, input.nftId, input.editionId)
        const existing = cart.items.find((item) => item.nftId === input.nftId && item.editionId === input.editionId)
        const quantity = (existing?.quantity ?? 0) + input.quantity
        if (quantity > max) throw availabilityConflict(max, label)
        if (existing) existing.quantity = quantity
        else cart.items.push({ id: newId('item'), nftId: nft.id, editionId: input.editionId, quantity, addedPrice: nft.price })
      })
    }),
  ),

  http.patch(
    `${API}/cart/items/:id`,
    route(async ({ request, params }) => {
      const key = requireCartKey(request)
      const { quantity } = await readJson(request, cartItemUpdateSchema)
      return updateCart(key, (cart, db) => {
        const item = cart.items.find((candidate) => candidate.id === param(params, 'id'))
        if (!item) throw notFound('Este item não está mais no carrinho.')
        const { max, label } = availableUnits(db, item.nftId, item.editionId)
        // Diminuir sempre é permitido, mesmo acima do estoque, para a pessoa conseguir ajustar o item.
        if (quantity > item.quantity && quantity > max) throw availabilityConflict(max, label)
        item.quantity = quantity
      })
    }),
  ),

  http.delete(
    `${API}/cart/items/:id`,
    route(({ request, params }) => {
      const key = requireCartKey(request)
      return updateCart(key, (cart) => {
        cart.items = cart.items.filter((item) => item.id !== param(params, 'id'))
      })
    }),
  ),

  http.put(
    `${API}/cart/coupon`,
    route(async ({ request }) => {
      const key = requireCartKey(request)
      const { code } = await readJson(request, couponInputSchema)
      const coupon = COUPONS.find((item) => item.code === code)
      if (!coupon) {
        throw new ApiFailure(422, 'COUPON_INVALID', 'Cupom inválido.', { code: ['Cupom inválido. Confira o código.'] })
      }
      if (Date.parse(coupon.expiresAt) <= Date.now()) {
        throw new ApiFailure(422, 'COUPON_EXPIRED', 'Este cupom expirou.', { code: ['Este cupom expirou.'] })
      }
      return updateCart(key, (cart) => {
        cart.couponCode = coupon.code
      })
    }),
  ),

  http.delete(
    `${API}/cart/coupon`,
    route(({ request }) => {
      const key = requireCartKey(request)
      return updateCart(key, (cart) => {
        cart.couponCode = null
      })
    }),
  ),

  // Ao entrar na conta, os itens do visitante passam para o carrinho do usuário (§3).
  http.post(
    `${API}/cart/merge`,
    route(async ({ request }) => {
      const { user } = requireSession(request)
      const { guestCartId } = await readJson(request, cartMergeSchema)
      const key = `user:${user.id}`
      return updateCart(key, (cart, db) => {
        const guest = db.carts[`guest:${guestCartId}`]
        if (!guest) return
        for (const item of guest.items) {
          const { max } = availableUnits(db, item.nftId, item.editionId)
          const existing = cart.items.find((candidate) => candidate.nftId === item.nftId && candidate.editionId === item.editionId)
          if (existing) existing.quantity = Math.min(existing.quantity + item.quantity, Math.max(max, existing.quantity))
          else cart.items.push({ ...item, id: newId('item') })
        }
        cart.couponCode ??= guest.couponCode
        delete db.carts[`guest:${guestCartId}`]
      })
    }),
  ),
]
