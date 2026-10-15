import { Link, useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { type Cart, type Wallet, type WalletSlot, type WalletType } from '@/api/contracts'
import { Icon } from '@/components/icon'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/features/auth/session'
import { useCart } from '@/features/cart/use-cart'
import { NETWORK_LABELS } from '@/features/catalog/labels'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useMediaQuery } from '@/hooks/use-media-query'
import { formatEth } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useWallets } from '../queries'
import { readDraft, saveDraft, type CheckoutDraft as Draft } from '../draft'
import { WALLET_TYPE_LABELS } from '../labels'
import { isQuoteStale, useCheckout } from '../use-checkout'
import { emptyWalletValues as emptyValues, walletValues as toValues } from '../wallet-values'
import { CollectorForm, type CollectorField } from './collector-form'
import { ReviewDialog } from './review-dialog'

const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

function OrderItems({ cart }: { cart: Cart }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between border-b border-brand/30 pb-2 text-sm font-bold text-cream" aria-hidden>
        <span>NFTs</span>
        <span>Subtotal</span>
      </div>
      <ul aria-label="Itens do pedido" className="flex flex-col gap-2">
        {cart.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 bg-surface-card p-1 pr-3">
            <img src={item.image.small} alt="" width={45} height={45} className="size-[45px] shrink-0 rounded-md object-cover" />
            <div className="flex min-w-0 flex-1 flex-col text-xs leading-4">
              <span className="truncate text-[13px] font-bold text-cream">{item.name}</span>
              <span className="text-muted-text">ID do token: {item.tokenId}</span>
            </div>
            <span className="text-xs text-subtle-text">(x {item.quantity})</span>
            <span className="text-sm font-bold whitespace-nowrap text-accent-text">{formatEth(item.lineTotal)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Summary({ cart, large }: { cart: Cart; large?: boolean }) {
  const { summary } = cart
  return (
    <dl className="flex flex-col gap-2 text-sm text-cream">
      <div className="flex justify-between gap-3">
        <dt>Subtotal</dt>
        <dd className="text-base">{formatEth(summary.subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt>{cart.coupon?.description ?? 'Desconto do lançamento'}</dt>
        <dd>(-) {formatEth(summary.discount)}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt>Taxa de rede</dt>
        <dd className="text-base">{formatEth(summary.networkFee)}</dd>
      </div>
      <p className="text-center text-xs text-accent-text">Taxa estimada</p>
      <div className={cn('flex justify-between gap-3 border-t border-brand/30 pt-3 font-bold', large && 'text-lg')}>
        <dt>Total</dt>
        <dd className="text-accent-text">{formatEth(summary.total)}</dd>
      </div>
    </dl>
  )
}

const TYPE_ORDER: WalletType[] = ['walletconnect', 'metamask', 'coinbase']

function TypeMark({ type }: { type: WalletType }) {
  return (
    <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-sm font-bold text-accent-text">
      {type === 'coinbase' ? <Icon name="wallet" className="size-5" /> : type === 'metamask' ? 'M' : 'W'}
    </span>
  )
}

function WalletTypeOptions({ value, onChange, mobile }: { value: WalletType; onChange: (type: WalletType) => void; mobile: boolean }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className={cn('mb-3 font-bold text-cream', mobile ? 'text-base' : 'w-full text-center text-base')}>Carteira e rede</legend>
      {TYPE_ORDER.map((type) => (
        <label
          key={type}
          className={cn(
            'flex cursor-pointer items-center gap-3 border text-sm text-cream transition-colors',
            mobile ? 'rounded-[15px] border-transparent bg-surface-card p-3' : 'h-10 rounded-[3px] px-3',
            value === type ? 'border-brand' : mobile ? '' : 'border-line',
          )}
        >
          {mobile && <TypeMark type={type} />}
          <input
            type="radio"
            name="walletType"
            value={type}
            checked={value === type}
            onChange={() => onChange(type)}
            className={cn('size-4 accent-[var(--color-brand)]', mobile && 'order-last')}
          />
          <span className={cn(mobile && 'flex-1')}>{WALLET_TYPE_LABELS[type]}</span>
        </label>
      ))}
    </fieldset>
  )
}

function SavedWallets({ wallets, slot, onSelect }: { wallets: Wallet[]; slot: WalletSlot; onSelect: (slot: WalletSlot) => void }) {
  return (
    <ul className="flex flex-col gap-5">
      {wallets.map((wallet) => (
        <li key={wallet.id}>
          <label className={cn('flex cursor-pointer items-start gap-4 rounded-[15px] border bg-surface-card p-4', wallet.slot === slot ? 'border-brand' : 'border-transparent')}>
            <input
              type="radio"
              name="savedWallet"
              checked={wallet.slot === slot}
              onChange={() => onSelect(wallet.slot)}
              className="mt-1 size-4 accent-[var(--color-brand)]"
            />
            <span className="flex flex-col gap-1 text-sm leading-5">
              <span className="text-base font-bold text-cream">{wallet.alias}</span>
              <span className="text-subtle-text">{wallet.secondaryAddress.endsWith('.eth') ? wallet.secondaryAddress : shortAddress(wallet.address)}</span>
              <span className="text-subtle-text">
                {wallet.slot === 'primary' ? 'Rede principal' : 'Rede'} {NETWORK_LABELS[wallet.network]}
              </span>
            </span>
          </label>
        </li>
      ))}
    </ul>
  )
}

function BackButton() {
  const router = useRouter()
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()
  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={() => (canGoBack ? router.history.back() : void navigate({ to: '/carrinho' }))}
      className="grid size-[35px] place-items-center rounded-full border border-line bg-surface-raised text-cream"
    >
      <Icon name="arrow-left-2" />
    </button>
  )
}

export function CheckoutPage() {
  const mobile = !useMediaQuery('(min-width: 768px)')
  const navigate = useNavigate()
  const { user, isLoading: sessionLoading } = useSession()
  const cart = useCart()
  const wallets = useWallets()
  const checkout = useCheckout()
  useDocumentTitle('Pagamento')

  const [stored, setStored] = useState<Draft | undefined>(readDraft)
  const [showForm, setShowForm] = useState(false)

  // Sessão expirou no meio da compra: volta ao login e retoma daqui, com o rascunho preservado.
  useEffect(() => {
    if (!sessionLoading && !user) void navigate({ to: '/entrar', search: { redirect: '/pagamento' }, replace: true })
  }, [sessionLoading, user, navigate])

  const saved = [wallets.data?.primary, wallets.data?.secondary].filter((wallet): wallet is Wallet => Boolean(wallet))
  // Sem rascunho, o formulário começa com a carteira salva (ou vazio, para cadastrar a primeira).
  const draft: Draft | undefined =
    stored && stored.userId === user?.id
      ? stored
      : wallets.data && user
        ? { userId: user.id, slot: 'primary', values: wallets.data.primary ? toValues(wallets.data.primary) : emptyValues(user.email), note: '' }
        : undefined
  const slot: WalletSlot = draft?.slot ?? 'primary'
  const savedForSlot = saved.find((wallet) => wallet.slot === slot)

  if (cart.isPending || wallets.isPending || !draft) {
    return (
      <div role="status" aria-label="Carregando pagamento" className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 pt-8 lg:flex-row xl:px-0">
        <Skeleton className="h-[420px] flex-1" />
        <Skeleton className="h-[420px] w-full lg:w-[406px]" />
      </div>
    )
  }

  // Com a revisão aberta, o carrinho pode esvaziar porque o próprio pedido foi confirmado: a revisão continua na tela.
  if (!cart.data || (!checkout.quote && (!cart.data.items.length || cart.data.items.some((item) => item.issue)))) {
    const empty = !cart.data?.items.length
    return (
      <div className="mx-auto flex max-w-[480px] flex-col items-center gap-4 px-6 py-24 text-center">
        <h1 className="text-xl font-bold text-cream">{empty ? 'Seu carrinho está vazio' : 'Revise o seu carrinho'}</h1>
        <p className="text-sm leading-6 text-subtle-text">
          {empty ? 'Adicione NFTs ao carrinho para finalizar a compra.' : 'Alguns itens não estão mais disponíveis na quantidade escolhida.'}
        </p>
        <Button asChild className="rounded-sm font-bold">
          <Link to="/carrinho">Ir para o carrinho</Link>
        </Button>
      </div>
    )
  }

  const update = (next: Partial<Draft>) => {
    const merged = { ...draft, ...next }
    setStored(merged)
    saveDraft(merged)
  }
  const changeField = (field: CollectorField, value: string) => {
    update({ values: { ...draft.values, [field]: value } })
    checkout.setErrors((current) => ({ ...current, [field]: undefined }))
  }
  const selectSlot = (next: WalletSlot) => {
    const wallet = saved.find((item) => item.slot === next)
    update({ slot: next, values: wallet ? toValues(wallet) : emptyValues(user?.email) })
    checkout.setErrors({})
  }
  const confirm = () => void checkout.prepare(draft.values, slot, savedForSlot)
  const busy = checkout.step === 'preparing'

  const form = (
    <CollectorForm
      values={draft.values}
      errors={checkout.errors}
      onChange={changeField}
      note={{ value: draft.note, onChange: (note) => update({ note }) }}
      otherWallet={{ checked: slot === 'secondary', onChange: (other) => selectSlot(other ? 'secondary' : 'primary') }}
    />
  )

  const feedback = checkout.message && checkout.step === 'form' && (
    <p role="alert" className="rounded-md border border-coral/60 px-4 py-3 text-sm text-coral">
      {checkout.message}
    </p>
  )

  const review = checkout.quote && checkout.wallet && (
    <ReviewDialog
      quote={checkout.quote}
      wallet={checkout.wallet}
      stale={checkout.step !== 'submitting' && !checkout.canRetryOrder && isQuoteStale(checkout.quote, cart.data)}
      rejected={checkout.quoteRejected}
      changes={checkout.changes}
      message={checkout.message}
      canRetry={checkout.canRetryOrder}
      submitting={checkout.step === 'submitting'}
      onConfirm={() => void checkout.submit()}
      onRefresh={() => void checkout.refreshQuote()}
      onDisconnect={() => void checkout.disconnect()}
      onClose={checkout.closeReview}
    />
  )

  if (mobile) {
    return (
      <div className="flex flex-col gap-6 px-6 pt-6">
        <div className="grid grid-cols-[35px_1fr_35px] items-center gap-2 pb-2">
          <BackButton />
          <h1 className="text-center text-lg leading-6 font-bold text-cream min-[400px]:text-xl">Pagamento com carteira</h1>
        </div>
        {saved.length > 0 && !showForm ? (
          <section aria-labelledby="saved-wallets-title" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 id="saved-wallets-title" className="text-base font-bold text-cream">
                Carteira conectada
              </h2>
              <button type="button" onClick={() => setShowForm(true)} className="rounded-sm text-sm font-bold text-accent-text">
                Trocar carteira
              </button>
            </div>
            <SavedWallets wallets={saved} slot={slot} onSelect={selectSlot} />
          </section>
        ) : (
          form
        )}
        <WalletTypeOptions value={draft.values.walletType} onChange={(type) => changeField('walletType', type)} mobile />
        <p className="flex items-center justify-end gap-6 text-lg font-bold text-cream">
          Total: <span className="text-xl text-accent-text">{formatEth(cart.data.summary.total)}</span>
        </p>
        {feedback}
        <button
          type="button"
          onClick={confirm}
          disabled={busy}
          className="h-[60px] w-full rounded-[40px] bg-[linear-gradient(100deg,#d28a4c_4%,rgb(210_138_76/0.8)_122%)] text-base font-bold text-ink disabled:opacity-60"
        >
          {busy ? 'Conectando carteira...' : 'Confirmar compra'}
        </button>
        {review}
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-6 pt-8 xl:px-0">
      <Breadcrumb current="Pagamento" />
      <h1 className="sr-only">Pagamento</h1>
      <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
        <section aria-labelledby="collector-title" className="flex min-w-0 flex-1 flex-col gap-4 lg:max-w-[760px]">
          <h2 id="collector-title" className="text-body font-bold text-cream">
            Perfil do colecionador
          </h2>
          {form}
        </section>
        <aside aria-label="Resumo do pedido" className="flex w-full flex-col gap-4 lg:w-[406px] lg:shrink-0">
          <h2 className="text-body font-bold text-cream">Seus NFTs</h2>
          <OrderItems cart={cart.data} />
          <p className="text-center text-xs text-cream">
            Tem um código promocional?{' '}
            <Link to="/carrinho" className="rounded-sm text-accent-text underline-offset-4 hover:underline">
              Aplique aqui
            </Link>
          </p>
          <Summary cart={cart.data} />
          <WalletTypeOptions value={draft.values.walletType} onChange={(type) => changeField('walletType', type)} mobile={false} />
          {feedback}
          <Button onClick={confirm} disabled={busy} className="h-10 rounded-[3px] text-body font-bold">
            {busy ? 'Conectando carteira...' : 'Confirmar compra'}
          </Button>
        </aside>
      </div>
      {review}
    </div>
  )
}
