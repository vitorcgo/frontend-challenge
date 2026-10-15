import type { NftListResponse } from '@/api/contracts'
import type { CatalogSearch } from '../search'
import { CatalogFilters } from './catalog-filters'
import { FeaturedNft } from './featured-nft'

interface CatalogSidebarProps {
  search: CatalogSearch
  facets: NftListResponse['facets'] | undefined
}

export default function CatalogSidebar({ search, facets }: CatalogSidebarProps) {
  return (
    <>
      <CatalogFilters search={search} facets={facets} className="bg-surface-card p-5" />
      <FeaturedNft />
    </>
  )
}
