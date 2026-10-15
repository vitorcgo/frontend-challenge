import type { CatalogSearch } from '../search'
import { CatalogSection } from './catalog-section'
import { HomeHero } from './home-hero'
import { HomePromos } from './home-promos'
import { MintJournal } from './mint-journal'
import { MobileCatalogSearch } from './mobile-catalog-search'

export function HomePage({ search }: { search: CatalogSearch }) {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-6 pt-6 md:gap-24 md:pt-8 xl:px-0">
      <div className="flex flex-col gap-4 md:contents">
        <div className="md:hidden">
          <MobileCatalogSearch />
        </div>
        <HomeHero />
      </div>
      <CatalogSection search={search} />
      <HomePromos />
      <MintJournal />
    </div>
  )
}
