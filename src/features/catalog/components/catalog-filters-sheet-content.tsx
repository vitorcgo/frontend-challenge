import type { RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { pluralize } from '@/lib/format'
import { useCatalogQuery, useCatalogSearch } from '../use-catalog-search'
import { CatalogFilters } from './catalog-filters'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  returnFocusTo: RefObject<HTMLElement | null>
}

export default function CatalogFiltersSheetContent({ open, onOpenChange, returnFocusTo }: Props) {
  const search = useCatalogSearch()
  const { data } = useCatalogQuery(search)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[min(360px,100%)] gap-0 border-line bg-surface-card text-cream"
        onCloseAutoFocus={(event) => {
          // Sem o SheetTrigger do Radix (a gaveta é carregada sob demanda), o foco é devolvido aqui.
          event.preventDefault()
          returnFocusTo.current?.focus()
        }}
      >
        <SheetHeader className="border-b border-line px-5 py-4">
          <SheetTitle className="text-lg font-bold text-cream">Filtros</SheetTitle>
          <SheetDescription className="text-sm text-subtle-text">
            Os resultados são atualizados a cada escolha.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-5">
          <CatalogFilters search={search} facets={data?.facets} showSort />
        </div>
        <div className="border-t border-line p-5">
          <Button onClick={() => onOpenChange(false)} className="h-11 w-full rounded-lg text-base font-bold">
            {data ? `Ver ${pluralize(data.total, 'resultado', 'resultados')}` : 'Ver resultados'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
