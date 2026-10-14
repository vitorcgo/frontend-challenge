import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { CatalogSection } from '@/features/catalog/components/catalog-section'
import { HomeHero } from '@/features/catalog/components/home-hero'
import { CATALOG_DEFAULTS, catalogSearchSchema } from '@/features/catalog/search'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  search: { middlewares: [stripSearchParams(CATALOG_DEFAULTS)] },
  component: HomePage,
})

function HomePage() {
  const search = Route.useSearch()
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-6 pt-6 md:gap-24 md:pt-8 xl:px-0">
      <HomeHero />
      <CatalogSection search={search} />
    </div>
  )
}
