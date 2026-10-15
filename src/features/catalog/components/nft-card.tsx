import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/api/contracts'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '@/lib/format'

interface NftCardProps {
  nft: NftSummary
  priority?: boolean
}

export function NftCard({ nft, priority = false }: NftCardProps) {
  return (
    <Link to="/nft/$id" params={{ id: nft.id }} className="group flex flex-col gap-2 rounded-[20px] md:gap-3 md:rounded-none">
      <div className="relative overflow-hidden rounded-[20px] bg-[linear-gradient(139.5deg,var(--color-surface-card)_12%,var(--color-surface-raised)_106.6%)] px-1 pt-3 pb-5 md:rounded-none md:bg-surface-card md:bg-none md:pt-6 md:pb-7">
        <img
          src={nft.image.small}
          srcSet={`${nft.image.small} 480w, ${nft.image.large} 960w`}
          sizes="(min-width: 768px) 258px, 50vw"
          alt={nft.image.alt}
          width={250}
          height={250}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="aspect-square w-full rounded-2xl object-cover transition-transform duration-300 group-hover:scale-[1.02] md:rounded-[15px]"
        />
        {nft.rare && (
          <span className="absolute top-4 left-0 flex h-8 w-[68px] items-center bg-brand pl-2 text-caption leading-4 font-medium text-ink md:hidden">
            RARO
          </span>
        )}
        {!nft.available && (
          <span className="absolute right-3 bottom-3 rounded-sm bg-ink/85 px-2 py-1 text-xs font-bold text-cream">
            Esgotado
          </span>
        )}
      </div>
      <div className="flex flex-col pl-2 md:gap-1.5 md:pl-0">
        <h3 className="text-body leading-normal font-normal text-cream md:text-base md:leading-4">{nft.name}</h3>
        <p className="flex flex-wrap items-baseline gap-x-3 text-base leading-4 md:text-lg">
          <span className="font-bold text-accent-text">{formatEth(nft.price)}</span>
          {nft.previousPrice && (
            <span className="text-muted-text line-through">
              <span className="sr-only">Preço anterior: </span>
              {formatEth(nft.previousPrice)}
            </span>
          )}
        </p>
      </div>
    </Link>
  )
}

export function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 md:gap-3">
      <div className="rounded-[20px] bg-surface-card px-1 pt-3 pb-5 md:rounded-none md:pt-6 md:pb-7">
        <Skeleton className="aspect-square w-full rounded-2xl md:rounded-[15px]" />
      </div>
      <div className="flex flex-col gap-1.5 pl-2 md:pl-0">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}
