import { Suspense, useRef, useState } from 'react'
import { Icon } from '@/components/icon'
import { lazyWithPreload } from '@/lib/lazy'

const HeaderSearchDialog = lazyWithPreload(() => import('./header-search-dialog'))

export function HeaderSearch() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Buscar NFTs"
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerEnter={HeaderSearchDialog.preload}
        onFocus={HeaderSearchDialog.preload}
        onClick={() => {
          setMounted(true)
          setOpen(true)
        }}
        className="grid size-8 place-items-center rounded-sm text-cream transition-colors hover:text-accent-text"
      >
        <Icon name="search" />
      </button>
      {mounted && (
        <Suspense fallback={null}>
          <HeaderSearchDialog open={open} onOpenChange={setOpen} returnFocusTo={triggerRef} />
        </Suspense>
      )}
    </>
  )
}
