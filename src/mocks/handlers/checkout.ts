import { delay, http, HttpResponse } from 'msw'
import {
  IDEMPOTENCY_HEADER,
  type CartItem,
  type Network,
  type Order,
  type Quote,
  type QuoteChange,
  type QuoteItem,
} from '@/api/contracts'
import { orderInputSchema, quoteRequestSchema } from '@/api/schemas'
import { compareEth } from '@/lib/eth'
import { read, write, type MockDatabase, type OrderRecord, type QuoteRecord } from '../db'
import { ApiFailure, API, newId, notFound, nowIso, param, readJson, requireSession, route } from '../http'
import { publishNftUpdated, publishOrderUpdated } from '../realtime'
import { getScenario } from '../scenarios'
import { toCart } from './cart'

const QUOTE_TTL_MS = 5 * 60 * 1000
const SETTLE_DELAY_MS = 2000
const TIMEOUT_DELAY_MS = 20_000

const EXPLORERS: Record<Network, string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  solana: 'https://solscan.io/tx/',
}

const toQuoteItem = (item: CartItem): QuoteItem => ({
  nftId: item.nftId,
  name: item.name,
  tokenId: item.tokenId,
  image: item.image,
  editionId: item.editionId,
  editionLabel: item.editionLabel,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  lineTotal: item.lineTotal,
})

function toQuote({ userId: _userId, versions: _versions, ...quote }: QuoteRecord): Quote {
  return quote
}

function toOrder({
  userId: _userId,
  quoteId: _quoteId,
  idempotencyKey: _key,
  settleAt: _settleAt,
  outcome: _outcome,
  ...order
}: OrderRecord): Order {
  return order
}

function quoteChanges(quote: QuoteRecord, db: Readonly<MockDatabase>): QuoteChange[] {
  const changes: QuoteChange[] = []
  for (const item of quote.items) {
    const nft = db.nfts.find((candidate) => candidate.id === item.nftId)
    const edition = nft?.editions.find((candidate) => candidate.id === item.editionId)
    if (!nft || !edition) continue
    if (compareEth(nft.price, item.unitPrice) !== 0) {
      changes.push({ nftId: nft.id, name: nft.name, kind: 'price', from: item.unitPrice, to: nft.price })
    }
    if (edition.available < item.quantity) {
      changes.push({
        nftId: nft.id,
        name: nft.name,
        kind: 'availability',
        from: String(item.quantity),
        to: String(edition.available),
      })
    }
  }
  return changes
}

const randomHash = () =>
  `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, '0')).join('')}`

/** Resolve o pedido pendente: confirma (baixa estoque, tira do carrinho só o que foi comprado) ou recusa. */
function settleOrder(orderId: string) {
  const changedNfts = new Set<string>()
  const settled = write((db) => {
    const order = db.orders.find((item) => item.id === orderId)
    if (!order || order.status !== 'pending') return undefined

    const missing = order.items.find((item) => {
      const edition = db.nfts.find((nft) => nft.id === item.nftId)?.editions.find((e) => e.id === item.editionId)
      return !edition || edition.available < item.quantity
    })

    if (order.outcome === 'rejected' || missing) {
      order.status = 'rejected'
      order.rejectionReason = missing
        ? `A edição ${missing.editionLabel} de ${missing.name} esgotou antes da confirmação. Nenhum valor foi cobrado.`
        : 'O pagamento foi recusado pela carteira. Nenhum valor foi cobrado.'
    } else {
      for (const item of order.items) {
        const nft = db.nfts.find((candidate) => candidate.id === item.nftId)!
        const edition = nft.editions.find((candidate) => candidate.id === item.editionId)!
        edition.available -= item.quantity
        nft.available = nft.editions.some((candidate) => candidate.available > 0)
        nft.version += 1
        changedNfts.add(nft.id)
      }
      const cart = db.carts[`user:${order.userId}`]
      if (cart) {
        for (const bought of order.items) {
          const item = cart.items.find((candidate) => candidate.nftId === bought.nftId && candidate.editionId === bought.editionId)
          if (item) item.quantity -= bought.quantity
        }
        cart.items = cart.items.filter((item) => item.quantity > 0)
        if (!cart.items.length) cart.couponCode = null
        cart.updatedAt = nowIso()
      }
      order.status = 'confirmed'
      order.transactionHash = randomHash()
      order.explorerUrl = EXPLORERS[order.wallet.network] + order.transactionHash
    }
    order.version += 1
    order.updatedAt = nowIso()
    return { ...order }
  })

  if (!settled) return
  publishOrderUpdated(settled)
  for (const id of changedNfts) {
    const nft = read((db) => db.nfts.find((item) => item.id === id))
    if (nft) publishNftUpdated(nft)
  }
}

/** Depois de um refresh o temporizador se perde: a leitura do pedido resolve o que já venceu. */
function settleIfDue(orderId: string) {
  const order = read((db) => db.orders.find((item) => item.id === orderId))
  if (order?.status === 'pending' && Date.parse(order.settleAt) <= Date.now()) settleOrder(orderId)
}

function ownOrder(userId: string, orderId: string) {
  const order = read((db) => db.orders.find((item) => item.id === orderId))
  if (!order) throw notFound('Pedido não encontrado.')
  if (order.userId !== userId) throw new ApiFailure(403, 'FORBIDDEN', 'Você não tem permissão para ver este pedido.')
  return order
}

export const checkoutHandlers = [
  http.post(
    `${API}/checkout/quote`,
    route(async ({ request }) => {
      const { user } = requireSession(request)
      const input = await readJson(request, quoteRequestSchema)
      const quote = write((db) => {
        const wallet = db.wallets.find((item) => item.id === input.walletId)
        if (!wallet) throw notFound('Carteira não encontrada.')
        if (wallet.userId !== user.id) throw new ApiFailure(403, 'FORBIDDEN', 'Você não tem permissão para usar esta carteira.')
        const record = db.carts[`user:${user.id}`]
        const cart = record ? toCart(record, db) : undefined
        if (!cart?.items.length) throw new ApiFailure(422, 'VALIDATION_ERROR', 'Seu carrinho está vazio.')
        if (cart.items.some((item) => item.issue)) {
          throw new ApiFailure(409, 'AVAILABILITY_CONFLICT', 'Alguns itens do carrinho não estão mais disponíveis na quantidade escolhida.')
        }
        const now = Date.now()
        const quoteRecord: QuoteRecord = {
          id: newId('qt'),
          userId: user.id,
          items: cart.items.map(toQuoteItem),
          coupon: cart.coupon,
          summary: cart.summary,
          walletId: wallet.id,
          network: input.network,
          createdAt: new Date(now).toISOString(),
          expiresAt: new Date(now + QUOTE_TTL_MS).toISOString(),
          versions: Object.fromEntries(cart.items.map((item) => [item.nftId, item.nftVersion])),
        }
        db.quotes = [...db.quotes.filter((item) => item.userId !== user.id).slice(-50), quoteRecord]
        return quoteRecord
      })
      return HttpResponse.json<Quote>(toQuote(quote), { status: 201 })
    }),
  ),

  http.post(
    `${API}/orders`,
    route(async ({ request }) => {
      const { user, session } = requireSession(request)
      const key = request.headers.get(IDEMPOTENCY_HEADER)
      if (!key) throw new ApiFailure(422, 'VALIDATION_ERROR', `O cabeçalho ${IDEMPOTENCY_HEADER} é obrigatório.`)
      const { quoteId } = await readJson(request, orderInputSchema)

      // Mesma chave: devolve o pedido já criado (clique repetido ou reenvio após timeout); com outro conteúdo é conflito.
      const existing = read((db) => db.orders.find((item) => item.userId === user.id && item.idempotencyKey === key))
      if (existing) {
        if (existing.quoteId !== quoteId) {
          throw new ApiFailure(409, 'IDEMPOTENCY_CONFLICT', 'Esta chave de pedido já foi usada com outro conteúdo.')
        }
        settleIfDue(existing.id)
        return HttpResponse.json<Order>(toOrder(ownOrder(user.id, existing.id)))
      }

      const order = write((db) => {
        const quote = db.quotes.find((item) => item.id === quoteId && item.userId === user.id)
        if (!quote) throw notFound('Cotação não encontrada. Revise o pedido de novo.')
        if (Date.parse(quote.expiresAt) <= Date.now()) {
          throw new ApiFailure(409, 'QUOTE_EXPIRED', 'A cotação expirou. Revise o pedido de novo.')
        }
        const changes = quoteChanges(quote, db)
        if (changes.length) {
          throw new ApiFailure(409, 'QUOTE_STALE', 'Os valores mudaram desde a revisão. Confira e confirme de novo.', undefined, { changes })
        }
        const connected = db.connections.some(
          (item) => item.sessionToken === session.token && item.walletId === quote.walletId && item.network === quote.network,
        )
        if (!connected) {
          throw new ApiFailure(409, 'WALLET_NOT_CONNECTED', 'Conecte a carteira na rede escolhida para confirmar a compra.')
        }
        const wallet = db.wallets.find((item) => item.id === quote.walletId)!
        const now = nowIso()
        const record: OrderRecord = {
          id: newId('ord'),
          status: 'pending',
          version: 1,
          items: quote.items,
          coupon: quote.coupon,
          summary: quote.summary,
          wallet: { id: wallet.id, walletType: wallet.walletType, address: wallet.address, network: quote.network },
          transactionHash: null,
          explorerUrl: null,
          rejectionReason: null,
          createdAt: now,
          updatedAt: now,
          userId: user.id,
          quoteId,
          idempotencyKey: key,
          settleAt: new Date(Date.now() + SETTLE_DELAY_MS).toISOString(),
          outcome: getScenario() === 'payment-rejected' ? 'rejected' : 'confirmed',
        }
        db.orders.push(record)
        return record
      })

      setTimeout(() => settleOrder(order.id), SETTLE_DELAY_MS)
      if (getScenario() === 'order-timeout') await delay(TIMEOUT_DELAY_MS)
      return HttpResponse.json<Order>(toOrder(order), { status: 201 })
    }),
  ),

  http.get(
    `${API}/orders/:id`,
    route(({ request, params }) => {
      const { user } = requireSession(request)
      const id = param(params, 'id')
      ownOrder(user.id, id)
      settleIfDue(id)
      return HttpResponse.json<Order>(toOrder(ownOrder(user.id, id)))
    }),
  ),
]

