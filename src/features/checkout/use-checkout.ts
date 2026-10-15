import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { Cart, Order, Quote, QuoteChange, Wallet, WalletInput, WalletSlot } from '@/api/contracts'
import { createOrder, createQuote } from '@/api/endpoints/checkout'
import { connectWallet, createWallet, disconnectWallet, updateWallet } from '@/api/endpoints/wallets'
import { isApiError } from '@/api/errors'
import { walletInputSchema } from '@/api/schemas'
import { useSession } from '@/features/auth/session'
import { cartKeys } from '@/features/cart/keys'
import { fromApi, fromZod } from '@/features/auth/form-errors'
import { announce } from '@/lib/announce'
import { compareEth } from '@/lib/eth'
import type { CollectorErrors, CollectorField } from './components/collector-form'
import { clearDraft } from './draft'
import { orderKeys, walletKeys } from './queries'

const COLLECTOR_FIELDS = [
  'displayName',
  'alias',
  'network',
  'profileName',
  'address',
  'secondaryAddress',
  'walletType',
  'referralCode',
  'email',
  'ensName',
] as const satisfies readonly CollectorField[]

/** Uma chave por cotação: reenviar a mesma cotação (clique repetido ou timeout) recupera o mesmo pedido. */
function idempotencyKeyFor(quoteId: string) {
  const storageKey = `kurio.order-key:${quoteId}`
  try {
    const stored = sessionStorage.getItem(storageKey)
    if (stored) return stored
    const key = crypto.randomUUID()
    sessionStorage.setItem(storageKey, key)
    return key
  } catch {
    return `${quoteId}-sem-armazenamento`
  }
}

function forgetIdempotencyKey(quoteId: string) {
  try {
    sessionStorage.removeItem(`kurio.order-key:${quoteId}`)
  } catch {
    // Sem armazenamento, não há chave salva.
  }
}

const sameValues = (a: WalletInput, b: WalletInput) => COLLECTOR_FIELDS.every((field) => a[field] === b[field])

/** A cotação ficou velha se o carrinho (atualizado pelo socket) não bate mais com ela. */
export function isQuoteStale(quote: Quote, cart: Cart | undefined) {
  if (!cart) return false
  return quote.items.some((item) => {
    const current = cart.items.find((candidate) => candidate.nftId === item.nftId && candidate.editionId === item.editionId)
    return !current || current.issue !== null || compareEth(current.unitPrice, item.unitPrice) !== 0
  })
}

export type CheckoutStep = 'form' | 'preparing' | 'review' | 'submitting'

export function useCheckout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useSession()
  const [step, setStep] = useState<CheckoutStep>('form')
  const [errors, setErrors] = useState<CollectorErrors>({})
  const [message, setMessage] = useState<string>()
  const [quote, setQuote] = useState<Quote>()
  const [wallet, setWallet] = useState<Wallet>()
  const [changes, setChanges] = useState<QuoteChange[]>([])
  const [quoteRejected, setQuoteRejected] = useState(false)
  const [canRetryOrder, setCanRetryOrder] = useState(false)

  const fail = (error: unknown, fallback: string) => {
    const text = isApiError(error) ? error.message : fallback
    setMessage(text)
    announce(text)
  }

  /** Valida, salva a carteira, conecta na rede escolhida e pede a cotação para a revisão. */
  const prepare = async (values: WalletInput, slot: WalletSlot, saved: Wallet | undefined) => {
    setMessage(undefined)
    const parsed = walletInputSchema.safeParse(values)
    if (!parsed.success) {
      const next = fromZod<CollectorField>(parsed.error)
      setErrors(next)
      document.querySelector<HTMLElement>(`[name="${COLLECTOR_FIELDS.find((field) => next[field])}"]`)?.focus()
      return
    }
    setErrors({})
    setStep('preparing')
    try {
      let current = saved
      if (!current) current = await createWallet({ ...parsed.data, slot })
      else if (!sameValues(current, parsed.data)) current = await updateWallet(current.id, parsed.data)
      void queryClient.invalidateQueries({ queryKey: walletKeys.list(user?.id) })
      await connectWallet(current.id, parsed.data.network)
      const fresh = await createQuote({ walletId: current.id, network: parsed.data.network })
      setWallet(current)
      setQuote(fresh)
      setChanges([])
      setQuoteRejected(false)
      setCanRetryOrder(false)
      setStep('review')
    } catch (error) {
      setStep('form')
      const result = fromApi(error, COLLECTOR_FIELDS)
      if (Object.keys(result.fields).length) setErrors(result.fields)
      if (isApiError(error) && error.code === 'WALLET_REJECTED') fail(error, '')
      else if (result.message) fail(error, 'Não foi possível preparar o pedido.')
    }
  }

  const refreshQuote = async () => {
    if (!wallet || !quote) return
    setMessage(undefined)
    try {
      const [fresh] = await Promise.all([
        createQuote({ walletId: wallet.id, network: quote.network }),
        queryClient.invalidateQueries({ queryKey: cartKeys.all }),
      ])
      setQuote(fresh)
      setChanges([])
      setQuoteRejected(false)
      setCanRetryOrder(false)
      announce('Revisão atualizada com os valores atuais. Confira e confirme de novo.')
    } catch (error) {
      fail(error, 'Não foi possível atualizar a revisão.')
    }
  }

  const submit = async () => {
    if (!quote) return
    setMessage(undefined)
    setStep('submitting')
    try {
      const order: Order = await createOrder(quote.id, idempotencyKeyFor(quote.id))
      queryClient.setQueryData(orderKeys.detail(order.id), order)
      forgetIdempotencyKey(quote.id)
      clearDraft()
      void navigate({ to: '/pedido/$id', params: { id: order.id } })
    } catch (error) {
      setStep('review')
      if (!isApiError(error)) return fail(error, 'Não foi possível enviar o pedido.')
      if (error.code === 'QUOTE_STALE' || error.code === 'QUOTE_EXPIRED') {
        const details = error.details as { changes?: QuoteChange[] } | undefined
        setChanges(details?.changes ?? [])
        setQuoteRejected(true)
        forgetIdempotencyKey(quote.id)
        void queryClient.invalidateQueries({ queryKey: cartKeys.all })
        return fail(error, '')
      }
      if (error.code === 'IDEMPOTENCY_CONFLICT') {
        forgetIdempotencyKey(quote.id)
        return fail(error, '')
      }
      if (error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR' || error.status >= 500) {
        // A chave continua salva: tentar de novo recupera o pedido se ele já tiver sido criado.
        setCanRetryOrder(true)
        const text = 'Não recebemos a resposta do pedido. Tentar de novo não cria outra compra.'
        setMessage(text)
        announce(text)
        return
      }
      fail(error, 'Não foi possível enviar o pedido.')
    }
  }

  const disconnect = async () => {
    if (!wallet) return
    try {
      await disconnectWallet(wallet.id)
      announce('Carteira desconectada.')
    } finally {
      setQuote(undefined)
      setStep('form')
    }
  }

  const closeReview = () => {
    setQuote(undefined)
    setChanges([])
    setQuoteRejected(false)
    setMessage(undefined)
    setStep('form')
  }

  return { step, errors, setErrors, message, quote, wallet, changes, quoteRejected, canRetryOrder, prepare, refreshQuote, submit, disconnect, closeReview }
}
