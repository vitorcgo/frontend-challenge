import { cloneElement, Suspense, useRef, useState, type ReactElement, type Ref } from 'react'
import { lazyWithPreload } from '@/lib/lazy'

const SheetContent = lazyWithPreload(() => import('./catalog-filters-sheet-content'))

interface TriggerProps {
  ref?: Ref<HTMLElement>
  onClick?: () => void
  onPointerEnter?: () => void
  onFocus?: () => void
  'aria-haspopup'?: 'dialog'
  'aria-expanded'?: boolean
}

export function CatalogFiltersSheet({ trigger }: { trigger: ReactElement<TriggerProps> }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLElement>(null)

  return (
    <>
      {cloneElement(trigger, {
        ref: triggerRef,
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
        onPointerEnter: SheetContent.preload,
        onFocus: SheetContent.preload,
        onClick: () => {
          setMounted(true)
          setOpen(true)
        },
      })}
      {mounted && (
        <Suspense fallback={null}>
          <SheetContent open={open} onOpenChange={setOpen} returnFocusTo={triggerRef} />
        </Suspense>
      )}
    </>
  )
}
