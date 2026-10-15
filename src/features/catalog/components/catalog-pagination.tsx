import { Link } from '@tanstack/react-router'
import { Icon } from '@/components/icon'
import { cn } from '@/lib/utils'
import { EXACT_LOCATION } from '@/lib/link-options'

/** Páginas visíveis: sempre a primeira, a última e as vizinhas da atual. */
function pageItems(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total))
  const sorted = [...pages].sort((a, b) => a - b)
  return sorted.flatMap((page, index) => (index > 0 && page - sorted[index - 1]! > 1 ? ['gap' as const, page] : [page]))
}

const box = 'grid size-[35px] place-items-center rounded-[4px] text-lg leading-4'

export function CatalogPagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null

  const arrow = (target: number, direction: 'prev' | 'next') => (
    <Link
      to="/"
      search={(prev) => ({ ...prev, page: target })}
      hash="mercado"
      activeOptions={EXACT_LOCATION}
      aria-label={direction === 'prev' ? 'Página anterior' : 'Próxima página'}
      className={cn(box, 'border border-line text-cream hover:border-brand')}
    >
      <Icon name={direction === 'prev' ? 'arrow-left-2' : 'arrow-right-2'} />
    </Link>
  )

  return (
    <nav aria-label="Paginação do catálogo" className="flex justify-center md:justify-end">
      <ul className="flex items-center gap-2">
        {page > 1 && <li>{arrow(page - 1, 'prev')}</li>}
        {pageItems(page, totalPages).map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden className={cn(box, 'text-muted-text')}>
              ...
            </li>
          ) : (
            <li key={item}>
              <Link
                to="/"
                search={(prev) => ({ ...prev, page: item })}
                hash="mercado"
                activeOptions={EXACT_LOCATION}
                aria-label={`Página ${item}`}
                aria-current={item === page ? 'page' : undefined}
                className={cn(
                  box,
                  item === page ? 'bg-brand font-bold text-ink' : 'border border-line text-cream hover:border-brand',
                )}
              >
                {item}
              </Link>
            </li>
          ),
        )}
        {page < totalPages && <li>{arrow(page + 1, 'next')}</li>}
      </ul>
    </nav>
  )
}
