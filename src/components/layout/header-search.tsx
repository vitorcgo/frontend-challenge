import { useNavigate } from '@tanstack/react-router'
import { useId, useState } from 'react'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { SEARCH_MAX_LENGTH } from '@/features/catalog/search'

/** Lupa do cabeçalho: abre a busca e leva ao catálogo com o termo na URL. */
export function HeaderSearch() {
  const navigate = useNavigate()
  const inputId = useId()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setText('')
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Buscar NFTs"
          className="grid size-8 place-items-center rounded-sm text-cream transition-colors hover:text-accent-text"
        >
          <Icon name="search" />
        </button>
      </DialogTrigger>
      <DialogContent className="top-[20%] translate-y-0 border-line bg-surface-card text-cream sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Buscar NFTs</DialogTitle>
          <DialogDescription className="text-sm text-subtle-text">
            Procure por nome do NFT, coleção ou criador.
          </DialogDescription>
        </DialogHeader>
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            setOpen(false)
            void navigate({ to: '/', search: { search: text.trim() || undefined }, hash: 'mercado' })
          }}
          className="flex gap-3"
        >
          <label htmlFor={inputId} className="sr-only">
            Termo da busca
          </label>
          <Input
            id={inputId}
            type="search"
            maxLength={SEARCH_MAX_LENGTH}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Ex.: Golden, Kurio Apes"
            className="h-10 border-line bg-surface-dark text-cream placeholder:text-muted-text"
          />
          <Button type="submit" className="h-10 rounded-lg px-5 font-bold">
            Buscar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
