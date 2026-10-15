import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { HomePage } from '@/features/catalog/components/home-page'
import { CATALOG_DEFAULTS, catalogSearchValidator } from '@/features/catalog/search'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchValidator,
  search: { middlewares: [stripSearchParams(CATALOG_DEFAULTS)] },
  component: HomeRoute,
})

function HomeRoute() {
  return <HomePage search={Route.useSearch()} />
}
