import { useId } from 'react'
import type { EditionId, NftEdition } from '@/api/contracts'
import { cn } from '@/lib/utils'
import { isEditionAvailable } from '../edition'

interface EditionPickerProps {
  editions: NftEdition[]
  selected: EditionId | undefined
  onSelect: (edition: EditionId) => void
  className?: string
}

/** Edições como no Figma (elipses com borda); esgotada fica riscada e desativada, não só com outra cor. */
export function EditionPicker({ editions, selected, onSelect, className }: EditionPickerProps) {
  const headingId = useId()
  const selectedEdition = editions.find((edition) => edition.id === selected)

  return (
    <div role="group" aria-labelledby={headingId} className={cn('flex flex-col gap-2 md:gap-3', className)}>
      <p id={headingId} className="text-body leading-4 font-bold text-cream">
        Edição:
      </p>
      <ul className="flex flex-wrap items-center gap-3 md:gap-1.5">
        {editions.map((edition) => {
          const available = isEditionAvailable(edition)
          const active = edition.id === selected
          return (
            <li key={edition.id}>
              <button
                type="button"
                aria-pressed={active}
                disabled={!available}
                title={available ? undefined : 'Edição esgotada'}
                onClick={() => onSelect(edition.id)}
                className={cn(
                  'grid h-7 min-w-9 place-items-center rounded-[50%] border px-2 text-sm leading-4 transition-colors',
                  active ? 'border-brand font-medium text-accent-text' : 'border-line text-subtle-text',
                  available ? 'hover:border-brand' : 'cursor-not-allowed line-through opacity-50',
                )}
              >
                {edition.label}
                {!available && <span className="sr-only"> (esgotada)</span>}
              </button>
            </li>
          )
        })}
      </ul>
      {selectedEdition?.supply !== null && selectedEdition !== undefined && (
        <p className="text-caption text-muted-text">
          {selectedEdition.available === 1
            ? 'Resta 1 unidade nesta edição.'
            : `Restam ${selectedEdition.available} de ${selectedEdition.supply} nesta edição.`}
        </p>
      )}
    </div>
  )
}
