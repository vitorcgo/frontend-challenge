import { Link } from '@tanstack/react-router'
import { Suspense, useId, type ReactNode } from 'react'
import { NFT_PAGE_SIZE, NFT_TABS, type NftSort, type NftTab } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDelayedFlag } from '@/hooks/use-delayed-flag'
import { useMediaQuery } from '@/hooks/use-media-query'
import { pluralize } from '@/lib/format'
import { lazyWithPreload } from '@/lib/lazy'
import { cn } from '@/lib/utils'
import { SORT_LABELS, TAB_LABELS } from '../labels'
import { CATALOG_SECTION_ID } from '../focus-results'
import { hasActiveFilters, type CatalogSearch } from '../search'
import { useCatalogQuery, useUpdateCatalogSearch } from '../use-catalog-search'
import { CatalogFiltersSheet } from './catalog-filters-sheet'
import { CatalogPagination } from './catalog-pagination'
import { NftCard, NftCardSkeleton } from './nft-card'
import { EXACT_LOCATION } from '@/lib/link-options'

const SLOW_REQUEST_MS = 4000

const SortSelect = lazyWithPreload(() => import('./sort-select'))
const CatalogSidebar = lazyWithPreload(() => import('./catalog-sidebar'))

function SortSelectPlaceholder({ value }: { value: NftSort }) {
  return (
    <div aria-hidden className="flex items-center gap-3 text-body whitespace-nowrap text-cream">
      <span>Ordenar por:</span>
      <span className="flex items-center gap-3">
        {SORT_LABELS[value]}
        <Icon name="arrow-down-2" />
      </span>
    </div>
  )
}
function StateMessage({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-line px-6 py-16 text-center">
      <p className="text-lg leading-6 font-bold text-cream">{title}</p>
      <p className="max-w-[420px] text-sm leading-6 text-subtle-text">{text}</p>
      {action}
    </div>
  )
}

export function CatalogSection({ search }: { search: CatalogSearch }) {
  const update = useUpdateCatalogSearch()
  const query = useCatalogQuery(search)
  const { data, isPending, isError, error, isFetching, isPlaceholderData, refetch } = query
  const isSlow = useDelayedFlag(isFetching, SLOW_REQUEST_MS)
  const hasSidebar = useMediaQuery('(min-width: 1280px)')
  const hasToolbarSort = useMediaQuery('(min-width: 768px)')
  const panelHeadingId = useId()

  const filtered = hasActiveFilters(search) || search.tab !== 'all'
  // Com dados de outra busca ainda na tela (placeholder), o total de páginas não vale para a página pedida.
  const pageOutOfRange = data !== undefined && !isPlaceholderData && data.total > 0 && search.page > data.totalPages

  let content: ReactNode
  if (isPending) {
    content = (
      <ul aria-label="Carregando NFTs" className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 md:gap-x-6 md:gap-y-10 xl:gap-x-[34px] xl:gap-y-[72px]">
        {Array.from({ length: NFT_PAGE_SIZE }, (_, index) => (
          <li key={index}>
            <NftCardSkeleton />
          </li>
        ))}
      </ul>
    )
  } else if (isError) {
    content = (
      <div role="alert">
        <StateMessage
          title="Não foi possível carregar os NFTs"
          text={isApiError(error) ? error.message : 'Algo deu errado. Tente novamente.'}
          action={
            <Button onClick={() => void refetch()} className="rounded-sm font-bold">
              Tentar novamente
            </Button>
          }
        />
      </div>
    )
  } else if (pageOutOfRange) {
    content = (
      <StateMessage
        title="Esta página não existe"
        text={`A busca atual tem ${pluralize(data.totalPages, 'página', 'páginas')}.`}
        action={
          <Button asChild className="rounded-sm font-bold">
            <Link to="/" search={(prev) => ({ ...prev, page: 1 })} hash="mercado" activeOptions={EXACT_LOCATION}>
              Ir para a primeira página
            </Link>
          </Button>
        }
      />
    )
  } else if (data.items.length === 0) {
    content = (
      <StateMessage
        title="Nenhum NFT encontrado"
        text={
          filtered
            ? 'Nenhum NFT corresponde à busca e aos filtros escolhidos. Tente ampliar a busca.'
            : 'O catálogo está vazio no momento. Volte mais tarde para ver novos lançamentos.'
        }
        action={
          filtered && (
            <Button asChild className="rounded-sm font-bold">
              <Link to="/" search={(prev) => ({ tab: prev.tab, sort: prev.sort })} hash="mercado" activeOptions={EXACT_LOCATION}>
                Limpar busca e filtros
              </Link>
            </Button>
          )
        }
      />
    )
  } else {
    content = (
      <>
        <ul
          aria-busy={isPlaceholderData}
          className={cn(
            'grid grid-cols-2 gap-x-4 gap-y-6 pb-8 transition-opacity md:grid-cols-3 md:gap-x-6 md:gap-y-10 md:pb-0 xl:gap-x-[34px] xl:gap-y-[72px]',
            'max-md:[&>li:nth-child(even)]:translate-y-8',
            isPlaceholderData && 'opacity-60',
          )}
        >
          {data.items.map((nft, index) => (
            <li key={nft.id}>
              <NftCard nft={nft} priority={index < 3} />
            </li>
          ))}
        </ul>
        <div className="mt-10 md:mt-[88px]">
          <CatalogPagination page={search.page} totalPages={data.totalPages} />
        </div>
      </>
    )
  }

  return (
    <section
      id={CATALOG_SECTION_ID}
      tabIndex={-1}
      aria-labelledby={panelHeadingId}
      className="flex scroll-mt-6 flex-col outline-none gap-6 md:gap-8 xl:grid xl:grid-cols-[310px_1fr] xl:items-start xl:gap-12"
    >
      <h2 id={panelHeadingId} className="sr-only">
        Mercado de NFTs
      </h2>
      {hasSidebar && (
        <section aria-label="Filtros do catálogo" className="flex flex-col gap-6">
          <Suspense fallback={<div className="h-[640px] bg-surface-card" />}>
            <CatalogSidebar search={search} facets={data?.facets} />
          </Suspense>
        </section>
      )}
      <Tabs value={search.tab} onValueChange={(tab) => update({ tab: tab as NftTab })} className="min-w-0 gap-6 md:gap-8">
        {search.search && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle-text">
            <span>
              Resultados para <strong className="font-bold text-cream">"{search.search}"</strong>
            </span>
            <button
              type="button"
              onClick={() => update({ search: undefined })}
              className="rounded-sm text-accent-text underline-offset-4 hover:underline"
            >
              Limpar busca
            </button>
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-4">
          <TabsList
            variant="line"
            aria-label="Filtrar por lançamento"
            className="max-w-full flex-wrap group-data-[orientation=horizontal]/tabs:h-auto justify-start gap-x-1 gap-y-3 p-0 md:gap-x-5"
          >
            {NFT_TABS.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className={cn(tab === 'trending' && 'max-md:ml-3', "h-auto flex-none rounded-none border-0 p-0 pb-1 text-sm leading-4 font-normal text-cream after:bottom-0 after:bg-brand hover:text-accent-text data-[state=active]:font-bold data-[state=active]:text-accent-text md:pb-[7px] md:text-body md:font-medium md:data-[state=active]:font-medium")}
              >
                {TAB_LABELS[tab]}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="hidden items-center gap-6 md:flex">
            {hasToolbarSort && (
              <Suspense fallback={<SortSelectPlaceholder value={search.sort} />}>
                <SortSelect value={search.sort} onChange={(sort) => update({ sort })} />
              </Suspense>
            )}
            <div className="xl:hidden">
              <CatalogFiltersSheet
                trigger={
                  <Button variant="outline" className="h-9 gap-2 rounded-lg border-line bg-transparent text-cream hover:bg-surface-raised hover:text-accent-text">
                    <Icon name="filter" className="scale-75" />
                    Filtros
                  </Button>
                }
              />
            </div>
          </div>
        </div>

        <TabsContent value={search.tab} tabIndex={-1}>
          <div role="status" className="sr-only">
            {data && !isPlaceholderData ? `${pluralize(data.total, 'NFT encontrado', 'NFTs encontrados')}.` : ''}
          </div>
          {isSlow ? (
            <p role="status" className="mb-4 text-sm text-subtle-text">
              A conexão está mais lenta que o normal. Continuamos tentando...
            </p>
          ) : (
            isFetching &&
            !isPending && (
              <p role="status" className="mb-4 text-sm text-subtle-text">
                Atualizando catálogo...
              </p>
            )
          )}
          {content}
        </TabsContent>
      </Tabs>
    </section>
  )
}
