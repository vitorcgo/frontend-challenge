import type { RefObject } from 'react'
import type { NftImage } from '@/api/contracts'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

interface ZoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  image: NftImage
  returnFocusTo: RefObject<HTMLElement | null>
}

export default function ZoomDialog({ open, onOpenChange, name, image, returnFocusTo }: ZoomDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[min(92vw,720px)] max-w-none border-line bg-surface-card p-4 text-cream sm:max-w-none"
        onCloseAutoFocus={(event) => {
          // Sem o DialogTrigger do Radix (o diálogo é carregado sob demanda), o foco é devolvido aqui.
          event.preventDefault()
          returnFocusTo.current?.focus()
        }}
      >
        <DialogTitle className="pr-8 text-lg font-bold">{name}</DialogTitle>
        <DialogDescription className="sr-only">{image.alt}</DialogDescription>
        <img
          src={image.large}
          alt={image.alt}
          width={960}
          height={960}
          className="aspect-square max-h-[75vh] w-full rounded-2xl object-contain"
        />
      </DialogContent>
    </Dialog>
  )
}
