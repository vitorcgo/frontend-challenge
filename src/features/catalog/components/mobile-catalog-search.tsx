import { useEffect, useId, useState } from 'react'
import { Icon } from '@/components/icon'
import { SEARCH_MAX_LENGTH } from '../search'
import { useCatalogSearch, useUpdateCatalogSearch } from '../use-catalog-search'
import { CatalogFiltersSheet } from './catalog-filters-sheet'

const DEBOUNCE_MS = 350

/** Barra do topo do mobile (Figma "Search Bar"): busca enquanto digita e abre a gaveta de filtros. */
export function MobileCatalogSearch() {
  const search = useCatalogSearch()
  const update = useUpdateCatalogSearch()
  const inputId = useId()
  const [text, setText] = useState(search.search ?? '')
  const [syncedSearch, setSyncedSearch] = useState(search.search)

  // A busca mudou por fora (ex.: "Limpar filtros"): o campo acompanha, sem desfazer o que está sendo digitado.
  if (search.search !== syncedSearch) {
    setSyncedSearch(search.search)
    if ((search.search ?? '') !== text.trim()) setText(search.search ?? '')
  }

  // Espera a pessoa parar de digitar; `replace` evita uma entrada no histórico por letra.
  useEffect(() => {
    const value = text.trim() || undefined
    if (value === search.search) return
    const timer = setTimeout(() => update({ search: value }, { replace: true }), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [text, search.search, update])

  return (
    <div className="flex h-[45px] gap-2">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          update({ search: text.trim() || undefined })
        }}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-surface-card px-3 text-muted-text focus-within:outline-2 focus-within:outline-accent-text"
      >
        <label htmlFor={inputId} className="sr-only">
          Buscar NFTs
        </label>
        <Icon name="search-mobile" />
        <input
          id={inputId}
          type="search"
          maxLength={SEARCH_MAX_LENGTH}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Explorar coleções"
          className="min-w-0 flex-1 bg-transparent text-sm leading-4 font-bold text-cream outline-none placeholder:text-muted-text"
        />
      </form>
      <CatalogFiltersSheet
        trigger={
          <button
            type="button"
            aria-label="Abrir filtros"
            className="grid size-[45px] shrink-0 place-items-center rounded-[14px] bg-[linear-gradient(137deg,rgb(210_138_76/0.45)_24.6%,#d28a4c_100%)] text-ink"
          >
            <Icon name="filter" />
          </button>
        }
      />
    </div>
  )
}
