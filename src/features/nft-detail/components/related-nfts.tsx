import { useQuery } from '@tanstack/react-query'
import type { Nft } from '@/api/contracts'
import { NftShelf } from '@/features/catalog/components/nft-shelf'
import { nftListQueryOptions } from '@/features/catalog/queries'

const RELATED_COUNT = 5

export function RelatedNfts({ nft }: { nft: Nft }) {
  const { data, isPending, isError } = useQuery(
    nftListQueryOptions({ collection: nft.collection.id, pageSize: RELATED_COUNT + 1 }),
  )
  if (isError) return null
  const items = data?.items.filter((item) => item.id !== nft.id)
  return <NftShelf title="Mais desta coleção" nfts={items} isPending={isPending} size={RELATED_COUNT} />
}
