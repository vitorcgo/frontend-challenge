import { useQuery } from '@tanstack/react-query'
import { Link, useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import type { EditionId, Nft } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { nftDetailQueryOptions } from '@/features/catalog/queries'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useMediaQuery } from '@/hooks/use-media-query'
import { multiplyEth } from '@/lib/eth'
import { formatEth } from '@/lib/format'
import { EXACT_LOCATION, EXACT_PATH } from '@/lib/link-options'
import { maxQuantity, pickEdition } from '../edition'
import { EditionPicker } from './edition-picker'
import { DesktopGallery, MobileGallery } from './nft-gallery'
import { NftDetailSkeleton } from './nft-detail-skeleton'
import { NftDetailTabs } from './nft-detail-tabs'
import { QuantityStepper } from './quantity-stepper'
import { RatingStars } from './rating-stars'
import { RelatedNfts } from './related-nfts'
import { ShareLinks } from './share-links'

// Carrinho e favoritos entram nas próximas fatias; até lá os botões aparecem, mas não fingem funcionar.
const SOON = 'Disponível em breve'

function Breadcrumb() {
  return (
    <nav aria-label="Trilha de navegação">
      <ol className="flex items-center gap-1 text-body leading-4 font-bold text-cream">
        <li>
          <Link to="/" activeOptions={EXACT_PATH} className="rounded-sm hover:text-accent-text">
            Início
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li>
          <Link to="/" hash="mercado" activeOptions={EXACT_LOCATION} className="rounded-sm hover:text-accent-text">
            Mercado
          </Link>
        </li>
      </ol>
    </nav>
  )
}

function TokenInfo({ nft }: { nft: Nft }) {
  return (
    <dl className="flex flex-col gap-3 text-body leading-4 text-muted-text">
      <div className="flex gap-1">
        <dt>ID do token:</dt>
        <dd>{nft.tokenId}</dd>
      </div>
      <div className="flex gap-1">
        <dt>Coleção:</dt>
        <dd>{nft.collection.name}</dd>
      </div>
      <div className="flex gap-1">
        <dt>Atributos:</dt>
        <dd>{nft.attributes.join(', ')}</dd>
      </div>
    </dl>
  )
}

function SoldOutNotice() {
  return (
    <p role="status" className="text-sm font-bold text-coral">
      Esgotado: todas as edições deste NFT já foram vendidas.
    </p>
  )
}

interface ViewProps {
  nft: Nft
  edition: ReturnType<typeof pickEdition>
  onSelectEdition: (edition: EditionId) => void
  quantity: number
  max: number
  onQuantityChange: (quantity: number) => void
}

function DesktopDetail({ nft, edition, onSelectEdition, quantity, max, onQuantityChange }: ViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-24 px-6 pt-8 xl:px-0">
      <div className="flex flex-col gap-3">
        <Breadcrumb />
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="lg:w-[573px] lg:shrink-0">
            <DesktopGallery name={nft.name} images={nft.gallery} />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <h1 className="text-[28px] font-bold text-cream">{nft.name}</h1>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-title leading-4 font-bold text-accent-text">
                  {formatEth(nft.price)}
                  {nft.previousPrice && (
                    <span className="ml-3 text-base font-normal text-muted-text line-through">
                      <span className="sr-only">Preço anterior: </span>
                      {formatEth(nft.previousPrice)}
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-1">
                  <RatingStars average={nft.rating.average} />
                  <p className="text-body text-cream">{nft.rating.count} avaliações de colecionadores</p>
                </div>
              </div>
              <hr className="border-0 border-t border-brand/30" />
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-body leading-4 font-bold text-cream">Sobre este NFT:</h2>
              <p className="text-sm leading-6 text-subtle-text">{nft.description}</p>
            </div>

            <EditionPicker editions={nft.editions} selected={edition?.id} onSelect={onSelectEdition} />

            <div className="flex flex-wrap items-start justify-between gap-4">
              <QuantityStepper value={quantity} max={max} onChange={onQuantityChange} />
              <div className="flex gap-2">
                <Button disabled title={SOON} className="h-10 w-[130px] rounded-md text-sm leading-5 font-bold">
                  COMPRAR
                </Button>
                <Button
                  variant="outline"
                  disabled
                  title={SOON}
                  className="h-10 w-[130px] gap-2 rounded-md border-brand bg-transparent text-sm leading-5 font-medium text-accent-text"
                >
                  <Icon name="heart" />
                  Favoritar
                </Button>
              </div>
            </div>
            {!edition && <SoldOutNotice />}

            <div className="flex flex-col gap-3">
              <TokenInfo nft={nft} />
              <ShareLinks name={nft.name} path={`/nft/${nft.id}`} />
            </div>
          </div>
        </div>
      </div>

      <NftDetailTabs nft={nft} />
      <RelatedNfts nft={nft} />
    </div>
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

function MobileDetail({ nft, edition, onSelectEdition, quantity, max, onQuantityChange }: ViewProps) {
  return (
    <div>
      <div className="bg-[linear-gradient(137.6deg,var(--color-surface-card)_12%,var(--color-surface-raised)_106.6%)] px-7 pt-[23px] pb-[84px]">
        <div className="mb-2 flex items-center justify-between">
          <BackButton />
          <button
            type="button"
            disabled
            title={SOON}
            aria-label={`Favoritar (${SOON.toLowerCase()})`}
            className="grid size-[35px] place-items-center rounded-full border border-line bg-surface-raised text-accent-text disabled:opacity-60"
          >
            <Icon name="heart-sm" />
          </button>
        </div>
        <MobileGallery name={nft.name} images={nft.gallery} />
      </div>

      <div className="relative -mt-[114px] flex flex-col gap-3 rounded-t-[31px] bg-surface-card px-6 pt-8 pb-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl leading-6 font-bold text-cream">{nft.name}</h1>
          <p className="flex h-[27px] shrink-0 items-center gap-1 rounded-full border border-brand px-1.5 text-sm leading-4">
            <Icon name="star" className="size-3.5 text-brand" />
            <span className="font-medium text-cream">{nft.rating.average}</span>
            <span className="text-subtle-text">({nft.rating.count})</span>
            <span className="sr-only">avaliações de colecionadores, nota de 0 a 5</span>
          </p>
        </div>
        <p className="text-sm leading-6 text-subtle-text">{nft.description}</p>
        <EditionPicker editions={nft.editions} selected={edition?.id} onSelect={onSelectEdition} />
        {!edition && <SoldOutNotice />}
        <TokenInfo nft={nft} />
        <ShareLinks name={nft.name} path={`/nft/${nft.id}`} />
      </div>

      <div className="flex flex-col gap-12 px-6 pt-10">
        <NftDetailTabs nft={nft} />
        <RelatedNfts nft={nft} />
      </div>

      {/* Figma "Buy Bar": fica fixa no lugar da barra de navegação, que some nesta tela. */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-5 rounded-t-[40px] bg-surface-card px-6 pt-5 pb-[max(36px,env(safe-area-inset-bottom))] drop-shadow-[0_0_10px_rgb(10_6_4/0.45)]">
        <div className="flex items-start justify-between gap-3">
          <QuantityStepper value={quantity} max={max} onChange={onQuantityChange} size="sm" label="Qtd." />
          <p className="pt-1.5 text-xl leading-4 font-bold text-accent-text">
            <span className="sr-only">Total: </span>
            {formatEth(multiplyEth(nft.price, Math.max(quantity, 1)))}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            disabled
            title={SOON}
            className="h-[60px] flex-1 rounded-[40px] bg-[linear-gradient(100.4deg,#d28a4c_4%,rgb(210_138_76/0.8)_122%)] text-base leading-5 font-bold text-ink disabled:opacity-50"
          >
            Comprar NFT
          </button>
          <button
            type="button"
            disabled
            title={SOON}
            aria-label={`Adicionar ao carrinho (${SOON.toLowerCase()})`}
            className="grid size-[60px] shrink-0 place-items-center rounded-full border border-line bg-surface-raised text-accent-text disabled:opacity-60"
          >
            <Icon name="shop" />
          </button>
        </div>
      </div>
    </div>
  )
}

function StateMessage({ title, text, action }: { title: string; text: string; action: ReactNode }) {
  return (
    <section className="mx-auto flex max-w-[480px] flex-col items-center gap-6 px-6 py-24 text-center">
      <h1 className="text-xl leading-6 font-bold text-cream">{title}</h1>
      <p className="text-sm leading-6 text-subtle-text">{text}</p>
      {action}
    </section>
  )
}

export function NftDetailPage({ id }: { id: string }) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { data: nft, isPending, isError, error, refetch, isFetching } = useQuery(nftDetailQueryOptions(id))
  const [requestedEdition, setEdition] = useState<EditionId>()
  const [requestedQuantity, setQuantity] = useState(1)

  const notFound = isError && isApiError(error) && error.code === 'NOT_FOUND'
  useDocumentTitle(nft?.name ?? (notFound ? 'NFT não encontrado' : undefined))

  if (isPending) {
    return (
      <div role="status" aria-label="Carregando NFT" className={isDesktop ? 'mx-auto w-full max-w-[1200px] px-6 pt-8 xl:px-0' : ''}>
        <NftDetailSkeleton isDesktop={isDesktop} />
      </div>
    )
  }

  if (notFound) {
    return (
      <StateMessage
        title="NFT não encontrado"
        text="Este NFT não existe ou foi removido do catálogo. Veja outras obras disponíveis no mercado."
        action={
          <Button asChild size="lg" className="rounded-sm font-bold">
            <Link to="/" hash="mercado" activeOptions={EXACT_LOCATION}>
              Ver o catálogo
            </Link>
          </Button>
        }
      />
    )
  }

  if (isError) {
    return (
      <div role="alert">
        <StateMessage
          title="Não foi possível carregar este NFT"
          text={isApiError(error) ? error.message : 'Algo deu errado. Tente novamente.'}
          action={
            <Button onClick={() => void refetch()} disabled={isFetching} className="rounded-sm font-bold">
              {isFetching ? 'Tentando...' : 'Tentar novamente'}
            </Button>
          }
        />
      </div>
    )
  }

  const edition = pickEdition(nft, requestedEdition)
  const max = maxQuantity(nft, edition)
  // Trocar para uma edição com menos unidades reduz a quantidade ao novo limite.
  const quantity = max === 0 ? 0 : Math.min(Math.max(requestedQuantity, 1), max)

  const props: ViewProps = {
    nft,
    edition,
    onSelectEdition: setEdition,
    quantity,
    max,
    onQuantityChange: setQuantity,
  }
  return isDesktop ? <DesktopDetail {...props} /> : <MobileDetail {...props} />
}
