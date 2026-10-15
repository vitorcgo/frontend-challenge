import { useQuery } from '@tanstack/react-query'
import { Link, useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import type { Cart, CartItem } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { Icon } from '@/components/icon'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NftShelf } from '@/features/catalog/components/nft-shelf'
import { nftListQueryOptions } from '@/features/catalog/queries'
import { QuantityStepper } from '@/features/nft-detail/components/quantity-stepper'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useMediaQuery } from '@/hooks/use-media-query'
import { announce } from '@/lib/announce'
import { compareEth } from '@/lib/eth'
import { formatEth } from '@/lib/format'
import { EXACT_LOCATION } from '@/lib/link-options'
import { cn } from '@/lib/utils'
import { useCart, useRemoveCartItem, useUpdateCartItem } from '../use-cart'
import { CartSummary, CartSummarySkeleton } from './cart-summary'

function ItemNotice({ item }: { item: CartItem }) {
  if (item.issue === 'sold-out') {
    return <p className="text-caption leading-4 font-bold text-coral">Esgotado: remova o item para continuar.</p>
  }
  if (item.issue === 'insufficient') {
    return (
      <p className="text-caption leading-4 font-bold text-coral">
        {item.maxQuantity === 1 ? 'Só resta 1 unidade' : `Só restam ${item.maxQuantity} unidades`}: diminua a quantidade.
      </p>
    )
  }
  if (compareEth(item.unitPrice, item.addedPrice) !== 0) {
    return <p className="text-caption leading-4 text-accent-text">Preço atualizado: era {formatEth(item.addedPrice)}.</p>
  }
  return null
}

interface ItemActions {
  onQuantity: (item: CartItem, quantity: number) => void
  onRemove: (item: CartItem) => void
}

function RemoveButton({ item, onRemove, className }: { item: CartItem; onRemove: ItemActions['onRemove']; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => onRemove(item)}
      aria-label={`Remover ${item.name} (edição ${item.editionLabel}) do carrinho`}
      className={cn('grid size-8 shrink-0 place-items-center rounded-sm text-subtle-text transition-colors hover:text-coral', className)}
    >
      <Icon name="delete" />
    </button>
  )
}

const columns = 'grid grid-cols-[minmax(0,1fr)_88px_88px_96px_32px] items-center gap-4 lg:grid-cols-[minmax(0,250px)_77px_75px_87px_24px] lg:justify-between'

function DesktopItems({ cart, onQuantity, onRemove }: { cart: Cart } & ItemActions) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 lg:max-w-[782px]">
      <div className={cn(columns, 'pr-6 text-base leading-4 text-cream')} aria-hidden>
        <span className="font-bold">NFTs</span>
        <span className="font-medium">Preço</span>
        <span className="font-bold">Edições</span>
        <span className="font-medium">Total</span>
        <span />
      </div>
      <hr className="border-0 border-t border-brand/30" />
      <ul aria-label="Itens do carrinho" className="flex flex-col gap-3">
        {cart.items.map((item) => (
          <li key={item.id} className="flex flex-col gap-1 bg-surface-card pr-6">
            <div className={columns}>
              <div className="flex min-w-0 items-center gap-4">
                <img src={item.image.small} alt="" width={70} height={70} className="size-[70px] shrink-0 rounded-md object-cover" />
                <div className="flex min-w-0 flex-col gap-1.5 text-sm leading-4">
                  <Link
                    to="/nft/$id"
                    params={{ id: item.nftId }}
                    className="truncate rounded-sm text-base font-bold text-cream hover:text-accent-text"
                  >
                    {item.name}
                  </Link>
                  <span className="text-muted-text">ID do token: {item.tokenId}</span>
                  <span className="text-muted-text">Edição: {item.editionLabel}</span>
                </div>
              </div>
              <p className="text-base leading-4 font-bold text-subtle-text">{formatEth(item.unitPrice)}</p>
              <QuantityStepper
                value={item.quantity}
                max={Math.max(item.maxQuantity, item.issue === 'insufficient' ? item.quantity : 0)}
                onChange={(quantity) => onQuantity(item, quantity)}
                size="sm"
                label={`Quantidade de ${item.name}`}
                hideLabel
                showLimitHint={false}
              />
              <p className="text-base leading-4 font-bold text-accent-text">
                <span className="sr-only">Total do item: </span>
                {formatEth(item.lineTotal)}
              </p>
              <RemoveButton item={item} onRemove={onRemove} className="-ml-1" />
            </div>
            <div className="pb-2 pl-[86px] empty:hidden">
              <ItemNotice item={item} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MobileItems({ cart, onQuantity, onRemove }: { cart: Cart } & ItemActions) {
  return (
    <ul aria-label="Itens do carrinho" className="flex flex-col gap-4 px-6">
      {cart.items.map((item) => (
        <li key={item.id} className="flex overflow-hidden rounded-[10px] bg-surface-card">
          <img src={item.image.small} alt="" width={100} height={110} className="w-[100px] shrink-0 object-cover" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2.5">
            <div className="flex items-start justify-between gap-2">
              <Link to="/nft/$id" params={{ id: item.nftId }} className="min-w-0 truncate rounded-sm text-base font-bold text-cream">
                {item.name}
              </Link>
              <RemoveButton item={item} onRemove={onRemove} className="-mt-1 -mr-1 size-7" />
            </div>
            <p className="text-sm leading-4 text-muted-text">Edição: {item.editionLabel}</p>
            <ItemNotice item={item} />
            <div className="mt-auto flex items-center justify-between gap-2">
              <p className="text-lg leading-6 font-bold text-accent-text">
                <span className="sr-only">Total do item: </span>
                {formatEth(item.lineTotal)}
              </p>
              <QuantityStepper
                value={item.quantity}
                max={Math.max(item.maxQuantity, item.issue === 'insufficient' ? item.quantity : 0)}
                onChange={(quantity) => onQuantity(item, quantity)}
                size="sm"
                label={`Quantidade de ${item.name}`}
                hideLabel
                showLimitHint={false}
              />
            </div>
          </div>
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
      onClick={() => (canGoBack ? router.history.back() : void navigate({ to: '/' }))}
      className="grid size-[35px] place-items-center rounded-full border border-line bg-surface-raised text-cream"
    >
      <Icon name="arrow-left-2" />
    </button>
  )
}

function useItemActions(): ItemActions & { error?: string } {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const [error, setError] = useState<string>()
  const fail = (failure: unknown) => {
    const message = isApiError(failure) ? failure.message : 'Não foi possível atualizar o carrinho.'
    setError(message)
    announce(message)
  }
  return {
    error,
    onQuantity: (item, quantity) => {
      setError(undefined)
      update.mutate({ itemId: item.id, quantity }, { onError: fail })
    },
    onRemove: (item) => {
      setError(undefined)
      remove.mutate(item.id, { onSuccess: () => announce(`${item.name} removido do carrinho.`), onError: fail })
    },
  }
}

function CollectorsAlsoViewed({ cart }: { cart: Cart | undefined }) {
  const { data, isPending } = useQuery(nftListQueryOptions({ tab: 'trending', pageSize: 10 }))
  const inCart = new Set(cart?.items.map((item) => item.nftId))
  return <NftShelf title="Colecionadores também viram" nfts={data?.items.filter((nft) => !inCart.has(nft.id))} isPending={isPending} />
}

function CartSkeleton({ mobile }: { mobile: boolean }) {
  return (
    <div role="status" aria-label="Carregando carrinho" className={cn('flex gap-12', mobile ? 'flex-col px-6' : 'flex-col lg:flex-row lg:justify-between')}>
      <div className="flex flex-1 flex-col gap-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className={mobile ? 'h-[110px] w-full rounded-[10px]' : 'h-[70px] w-full'} />
        ))}
      </div>
      <CartSummarySkeleton />
    </div>
  )
}

export function CartPage() {
  const mobile = !useMediaQuery('(min-width: 768px)')
  const { data: cart, isPending, isError, error, refetch, isFetching } = useCart()
  const actions = useItemActions()
  useDocumentTitle('Carrinho')

  const blocked = Boolean(cart?.items.some((item) => item.issue !== null))
  let body
  if (isPending) body = <CartSkeleton mobile={mobile} />
  else if (isError) {
    body = (
      <div role="alert" className="flex flex-col items-center gap-4 rounded-lg border border-line px-6 py-16 text-center">
        <p className="text-lg font-bold text-cream">Não foi possível carregar o carrinho</p>
        <p className="text-sm text-subtle-text">{isApiError(error) ? error.message : 'Algo deu errado. Tente novamente.'}</p>
        <Button onClick={() => void refetch()} disabled={isFetching} className="rounded-sm font-bold">
          {isFetching ? 'Tentando...' : 'Tentar novamente'}
        </Button>
      </div>
    )
  } else if (cart.items.length === 0) {
    body = (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-line px-6 py-16 text-center">
        <p className="text-lg font-bold text-cream">Seu carrinho está vazio</p>
        <p className="max-w-[420px] text-sm leading-6 text-subtle-text">Explore o mercado e adicione os NFTs que quiser colecionar.</p>
        <Button asChild className="rounded-sm font-bold">
          <Link to="/" hash="mercado" activeOptions={EXACT_LOCATION}>
            Explorar NFTs
          </Link>
        </Button>
      </div>
    )
  } else if (mobile) {
    body = (
      <div className="flex flex-col gap-6">
        <MobileItems cart={cart} {...actions} />
        <CartSummary cart={cart} mobile blocked={blocked} />
      </div>
    )
  } else {
    body = (
      <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
        <DesktopItems cart={cart} {...actions} />
        <CartSummary cart={cart} mobile={false} blocked={blocked} />
      </div>
    )
  }

  return (
    <div className={cn('mx-auto flex w-full max-w-[1200px] flex-col gap-24 xl:px-0', mobile ? 'pt-6' : 'px-6 pt-8')}>
      <div className="flex flex-col gap-3">
        {mobile ? (
          <div className="relative flex items-center justify-center px-6 pb-4">
            <div className="absolute left-6">
              <BackButton />
            </div>
            <h1 className="text-xl leading-6 font-bold text-cream">Carrinho de NFTs</h1>
          </div>
        ) : (
          <>
            <Breadcrumb current="Carrinho" />
            <h1 className="sr-only">Carrinho de NFTs</h1>
          </>
        )}
        {actions.error && (
          <p role="alert" className={cn('rounded-md border border-coral/60 px-4 py-3 text-sm text-coral', mobile && 'mx-6')}>
            {actions.error}
          </p>
        )}
        {body}
      </div>
      <div className={mobile ? 'px-6' : undefined}>
        <CollectorsAlsoViewed cart={cart} />
      </div>
    </div>
  )
}
