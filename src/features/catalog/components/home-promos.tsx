import { Link } from '@tanstack/react-router'
import arcs from '@/assets/decorations/promo-arcs.svg'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import type { CatalogSearch } from '../search'
import { EXACT_LOCATION } from '@/lib/link-options'

interface Promo {
  title: [string, string]
  text: string
  image: string
  /** O "Explorar" leva ao catálogo já filtrado pelo assunto da promoção. */
  search: Partial<CatalogSearch>
}

const PROMOS: Promo[] = [
  {
    title: ['Lançamentos gênesis', 'de edição limitada'],
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: '/images/nfts/monkey-varsity-480.webp',
    search: { tab: 'new' },
  },
  {
    title: ['Arte digital selecionada', 'e muito mais'],
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: '/images/nfts/gorilla-turtleneck-480.webp',
    search: { category: ['arte-digital'] },
  },
]

export function HomePromos() {
  return (
    <section aria-label="Destaques do mercado" className="grid gap-6 lg:grid-cols-2 lg:gap-7">
      {PROMOS.map((promo) => (
        <article
          key={promo.title[0]}
          className="relative flex min-h-[250px] overflow-hidden rounded-lg bg-surface-card max-sm:flex-col"
        >
          <img
            src={promo.image}
            alt=""
            width={292}
            height={250}
            loading="lazy"
            decoding="async"
            className="aspect-[292/250] w-full shrink-0 rounded-[18px] object-cover sm:w-1/2"
          />
          <div className="relative flex flex-1 flex-col items-end gap-4 px-6 py-8 text-right sm:pr-[30px] sm:pl-4">
            <h2 className="text-lg leading-6 font-bold text-cream sm:whitespace-nowrap">
              {promo.title[0]}
              <br />
              {promo.title[1]}
            </h2>
            <p className="max-w-[263px] text-sm leading-6 text-subtle-text">{promo.text}</p>
            <Button asChild className="mt-auto h-10 w-[140px] gap-2 rounded-lg text-sm leading-5 font-medium">
              <Link to="/" search={promo.search} hash="mercado" activeOptions={EXACT_LOCATION}>
                Explorar
                <Icon name="arrow-right" />
                <span className="sr-only">: {promo.title.join(' ')}</span>
              </Link>
            </Button>
          </div>
          <img
            src={arcs}
            alt=""
            width={586}
            height={250}
            className="pointer-events-none absolute bottom-0 left-0 h-[250px] w-[586px] max-w-none"
          />
        </article>
      ))}
    </section>
  )
}
