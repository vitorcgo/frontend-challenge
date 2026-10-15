import { useId } from 'react'
import type { NftSummary } from '@/api/contracts'
import { NftCard, NftCardSkeleton } from './nft-card'

interface NftShelfProps {
  title: string
  nfts: NftSummary[] | undefined
  isPending: boolean
  size?: number
}

export function NftShelf({ title, nfts, isPending, size = 5 }: NftShelfProps) {
  const titleId = useId()
  if (!isPending && !nfts?.length) return null

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-8">
      <h2 id={titleId} className="border-b border-brand/30 pb-3 text-md leading-4 font-bold text-accent-text">
        {title}
      </h2>
      {/* `relative`: textos só para leitor de tela (posição absoluta) ficam presos na rolagem da lista, sem esticar a página. */}
      <ul className="relative -mx-6 grid snap-x auto-cols-[minmax(160px,219px)] grid-flow-col justify-between gap-6 overflow-x-auto px-6 pb-2 xl:mx-0 xl:px-0">
        {isPending
          ? Array.from({ length: size }, (_, index) => (
              <li key={index} className="snap-start">
                <NftCardSkeleton />
              </li>
            ))
          : nfts?.slice(0, size).map((nft) => (
              <li key={nft.id} className="snap-start">
                <NftCard nft={nft} />
              </li>
            ))}
      </ul>
    </section>
  )
}
