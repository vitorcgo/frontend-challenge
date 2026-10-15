import { createFileRoute } from '@tanstack/react-router'
import { nftDetailQueryOptions } from '@/features/catalog/queries'
import { NftDetailPage } from '@/features/nft-detail/components/nft-detail-page'

export const Route = createFileRoute('/nft/$id')({
  // Começa a buscar o NFT já no hover do card (preload por intenção); a tela mostra o skeleton se ainda não chegou.
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(nftDetailQueryOptions(params.id))
  },
  component: NftDetailRoute,
})

function NftDetailRoute() {
  const { id } = Route.useParams()
  // `key`: trocar de NFT (ex.: "Mais desta coleção") recomeça galeria, edição e quantidade.
  return <NftDetailPage key={id} id={id} />
}
