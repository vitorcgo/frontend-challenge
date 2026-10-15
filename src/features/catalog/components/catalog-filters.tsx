import { useId, useState } from 'react'
import { NETWORKS, NFT_CATEGORIES, NFT_SORTS, type NftListResponse, type NftSort } from '@/api/contracts'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { pluralize } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CATEGORY_LABELS, NETWORK_LABELS, SORT_LABELS } from '../labels'
import { hasActiveFilters, type CatalogSearch } from '../search'
import { useUpdateCatalogSearch } from '../use-catalog-search'

type Facets = NftListResponse['facets']

function toggle<T>(list: T[] | undefined, value: T): T[] | undefined {
  const next = list?.includes(value) ? list.filter((item) => item !== value) : [...(list ?? []), value]
  return next.length ? next : undefined
}

function OptionList<T extends string>({
  title,
  options,
  selected,
  counts,
  labels,
  boldCount,
  onToggle,
}: {
  title: string
  options: readonly T[]
  selected: T[] | undefined
  counts: Record<T, number> | undefined
  labels: Record<T, string>
  boldCount?: boolean
  onToggle: (value: T) => void
}) {
  const headingId = useId()
  return (
    <div role="group" aria-labelledby={headingId} className="flex flex-col gap-3">
      <h3 id={headingId} className="text-lg leading-4 font-bold text-cream">
        {title}
      </h3>
      <ul className="px-3">
        {options.map((option) => {
          const active = selected?.includes(option) ?? false
          return (
            <li key={option}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onToggle(option)}
                className={cn(
                  'flex w-full items-center justify-between rounded-sm text-body leading-10 transition-colors hover:text-accent-text',
                  active ? 'text-accent-text' : 'text-subtle-text',
                )}
              >
                <span>{labels[option]}</span>
                {counts && (
                  <span className={cn('text-right', boldCount && 'font-bold')}>
                    <span aria-hidden>({counts[option]})</span>
                    <span className="sr-only">{pluralize(counts[option], 'NFT', 'NFTs')}</span>
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const toNumber = (value: string | undefined, fallback: number) => (value ? Number(value) : fallback)

function PriceFilter({ search, range }: { search: CatalogSearch; range: Facets['priceRange'] | undefined }) {
  const update = useUpdateCatalogSearch()
  const headingId = useId()
  const min = toNumber(range?.min, 0)
  const max = toNumber(range?.max, 0)
  const [value, setValue] = useState<[number, number]>([toNumber(search.priceMin, min), toNumber(search.priceMax, max)])

  const apply = () => {
    const [low, high] = value
    update({ priceMin: low > min ? low.toFixed(2) : undefined, priceMax: high < max ? high.toFixed(2) : undefined })
  }

  return (
    <div role="group" aria-labelledby={headingId} className="flex flex-col gap-3">
      <h3 id={headingId} className="text-lg leading-4 font-bold text-cream">
        Faixa de preço
      </h3>
      <div className="flex flex-col gap-3 pl-3">
        <Slider
          min={min}
          max={max}
          step={0.01}
          minStepsBetweenThumbs={1}
          value={value}
          disabled={!range || min === max}
          onValueChange={(next) => setValue([next[0] ?? min, next[1] ?? max])}
          thumbLabels={['Preço mínimo', 'Preço máximo']}
        />
        <p className="text-body text-cream">
          Preço: {value[0].toFixed(2)} a {value[1].toFixed(2)} ETH
        </p>
        <Button onClick={apply} disabled={!range} className="h-9 w-fit rounded-lg px-3 py-2 text-base leading-5 font-bold">
          Aplicar
        </Button>
      </div>
    </div>
  )
}

interface CatalogFiltersProps {
  search: CatalogSearch
  facets: Facets | undefined
  showSort?: boolean
  className?: string
}

export function CatalogFilters({ search, facets, showSort = false, className }: CatalogFiltersProps) {
  const update = useUpdateCatalogSearch()
  const sortLabelId = useId()

  return (
    <div className={cn('flex flex-col gap-10', className)}>
      {showSort && (
        <div className="flex flex-col gap-3">
          <h3 id={sortLabelId} className="text-lg leading-4 font-bold text-cream">
            Ordenar por
          </h3>
          <Select value={search.sort} onValueChange={(sort) => update({ sort: sort as NftSort })}>
            <SelectTrigger aria-labelledby={sortLabelId} className="h-10 w-full border-line text-body text-cream">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-line bg-surface-raised text-cream">
              {NFT_SORTS.map((sort) => (
                <SelectItem key={sort} value={sort} className="text-body focus:bg-surface-dark focus:text-accent-text">
                  {SORT_LABELS[sort]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <OptionList
        title="Coleções"
        options={NFT_CATEGORIES}
        selected={search.category}
        counts={facets?.categories}
        labels={CATEGORY_LABELS}
        boldCount
        onToggle={(category) => update({ category: toggle(search.category, category) })}
      />

      <PriceFilter
        key={`${search.priceMin}|${search.priceMax}|${facets?.priceRange.min}|${facets?.priceRange.max}`}
        search={search}
        range={facets?.priceRange}
      />

      <OptionList
        title="Rede"
        options={NETWORKS}
        selected={search.network}
        counts={facets?.networks}
        labels={NETWORK_LABELS}
        onToggle={(network) => update({ network: toggle(search.network, network) })}
      />

      {hasActiveFilters(search) && (
        <Button
          variant="outline"
          onClick={() =>
            update({ search: undefined, category: undefined, network: undefined, priceMin: undefined, priceMax: undefined })
          }
          className="w-fit rounded-lg border-line bg-transparent text-cream hover:bg-surface-raised hover:text-accent-text"
        >
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
