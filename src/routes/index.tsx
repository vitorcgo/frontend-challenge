import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { CatalogSection } from '@/features/catalog/components/catalog-section'
import { HomeHero } from '@/features/catalog/components/home-hero'
import { HomePromos } from '@/features/catalog/components/home-promos'
import { MintJournal } from '@/features/catalog/components/mint-journal'
import { MobileCatalogSearch } from '@/features/catalog/components/mobile-catalog-search'
import { CATALOG_DEFAULTS, catalogSearchValidator } from '@/features/catalog/search'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchValidator,
  search: { middlewares: [stripSearchParams(CATALOG_DEFAULTS)] },
  component: HomePage,
})

function HomePage() {
  const search = Route.useSearch()
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
