import { useQuery } from '@tanstack/react-query'
import type { Nft } from '@/api/contracts'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { nftListQueryOptions } from '@/features/catalog/queries'

const RELATED_COUNT = 5

/** "Mais desta coleção": outros NFTs da mesma coleção, vindos da mesma listagem do catálogo. */
export function RelatedNfts({ nft }: { nft: Nft }) {
  const { data, isPending, isError } = useQuery(
    nftListQueryOptions({ collection: nft.collection.id, pageSize: RELATED_COUNT + 1 }),
  )
  const items = data?.items.filter((item) => item.id !== nft.id).slice(0, RELATED_COUNT)

  // Bloco complementar: sem itens ou com falha, ele some em vez de competir com o conteúdo principal.
  if (isError || items?.length === 0) return null

  return (
    <section aria-labelledby="related-title" className="flex flex-col gap-8">
      <h2 id="related-title" className="border-b border-brand/30 pb-3 text-md leading-4 font-bold text-accent-text">
        Mais desta coleção
      </h2>
      <ul className="-mx-6 grid snap-x auto-cols-[minmax(160px,219px)] grid-flow-col justify-between gap-6 overflow-x-auto px-6 pb-2 xl:mx-0 xl:px-0">
        {isPending
          ? Array.from({ length: RELATED_COUNT }, (_, index) => (
              <li key={index} className="snap-start">
                <NftCardSkeleton />
              </li>
            ))
          : items?.map((item) => (
              <li key={item.id} className="snap-start">
                <NftCard nft={item} />
              </li>
            ))}
      </ul>
    </section>
  )
}
