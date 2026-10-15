import { useNavigate } from '@tanstack/react-router'
import { useId, useRef, useState, type RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { focusCatalogResults } from '@/features/catalog/focus-results'
import { SEARCH_MAX_LENGTH } from '@/features/catalog/search'

interface HeaderSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Botão que abriu o diálogo: recebe o foco de volta ao fechar sem buscar. */
  returnFocusTo: RefObject<HTMLElement | null>
}

export default function HeaderSearchDialog({ open, onOpenChange, returnFocusTo }: HeaderSearchDialogProps) {
  const navigate = useNavigate()
  const inputId = useId()
  const [text, setText] = useState('')
  const submitted = useRef(false)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (next) setText('')
      }}
    >
      <DialogContent
        className="top-[20%] translate-y-0 border-line bg-surface-card text-cream sm:max-w-[520px]"
        onCloseAutoFocus={(event) => {
          // Sem o DialogTrigger do Radix (o diálogo é carregado sob demanda), o foco é devolvido aqui.
          event.preventDefault()
          if (submitted.current) {
            // Depois de uma busca o foco vai para os resultados, não de volta à lupa no topo da página.
            submitted.current = false
            focusCatalogResults()
          } else {
            returnFocusTo.current?.focus()
          }
        }}
      >
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
            submitted.current = true
            void navigate({ to: '/', search: { search: text.trim() || undefined } })
            onOpenChange(false)
            setText('')
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
