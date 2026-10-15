import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { isApiError } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { featuredNftQueryOptions } from '../queries'

const frame =
  'relative flex flex-col gap-4 overflow-hidden bg-[linear-gradient(180deg,rgb(210_138_76/0.1),rgb(210_138_76/0.03))] pt-6 pb-1'

/** Bloco "NFT em destaque" da barra lateral; o NFT vem da API (curadoria), nunca fixo na interface. */
export function FeaturedNft() {
  const { data, isPending, isError, error, refetch } = useQuery(featuredNftQueryOptions())

  // Sem destaque no momento é estado vazio, não erro: o bloco simplesmente não aparece.
  if (isError && isApiError(error) && error.code === 'NOT_FOUND') return null

  if (isPending) {
    return (
      <div className={frame} aria-hidden>
        <Skeleton className="mx-5 h-8 w-2/3" />
        <Skeleton className="mx-5 h-4 w-1/2" />
        <Skeleton className="h-[368px] w-full rounded-[22px]" />
      </div>
    )
  }

  if (isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 bg-surface-card p-5 text-sm text-subtle-text">
        Não foi possível carregar o NFT em destaque.
        <Button size="sm" onClick={() => void refetch()} className="rounded-sm font-bold">
          Tentar novamente
        </Button>
      </div>
    )
  }

  const { nft, headline, subtitle } = data
  return (
    <section aria-labelledby="featured-nft-title" className={frame}>
      <div className="flex flex-col items-center gap-4 px-5">
        <h2 id="featured-nft-title" className="w-full text-2xl leading-8 font-bold text-accent-text">
          {headline}
        </h2>
        <p className="w-full text-center text-title leading-4 font-bold text-cream">{subtitle}</p>
      </div>
      <Link to="/nft/$id" params={{ id: nft.id }} className="block rounded-[22px]">
        <img
          src={nft.image.large}
          srcSet={`${nft.image.small} 480w, ${nft.image.large} 960w`}
          sizes="310px"
          alt={`${nft.name}: ${nft.image.alt}`}
          width={310}
          height={368}
          loading="lazy"
          decoding="async"
          className="h-[368px] w-full rounded-[22px] object-cover"
        />
      </Link>
      {/* Formas decorativas do Figma. */}
      <span aria-hidden className="absolute top-[299px] left-4 size-[22px] rounded-[7px] border-2 border-[#46a358] opacity-20" />
      <span
        aria-hidden
        className="absolute top-[343px] left-[248px] size-[45px] rounded-[29px] bg-[linear-gradient(145deg,rgb(210_138_76/0.3)_46%,rgb(210_138_76/0)_103%)]"
      />
      <span
        aria-hidden
        className="absolute top-[105px] left-[38px] size-[15px] rounded-[29px] bg-[linear-gradient(145deg,rgb(210_138_76/0.3)_46%,rgb(210_138_76/0)_103%)]"
      />
    </section>
  )
}
