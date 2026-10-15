import type { Quote, QuoteChange, Wallet } from '@/api/contracts'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { NETWORK_LABELS } from '@/features/catalog/labels'
import { formatEth } from '@/lib/format'
import { WALLET_TYPE_LABELS } from '../labels'

const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

function describeChange(change: QuoteChange) {
  return change.kind === 'price'
    ? `${change.name}: o preço mudou de ${formatEth(change.from)} para ${formatEth(change.to)}.`
    : `${change.name}: ${change.to === '0' ? 'a edição esgotou' : `restam ${change.to} unidades`}.`
}

interface ReviewDialogProps {
  quote: Quote
  wallet: Wallet
  stale: boolean
  changes: QuoteChange[]
  message?: string
  canRetry: boolean
  submitting: boolean
  onConfirm: () => void
  onRefresh: () => void
  onDisconnect: () => void
  onClose: () => void
}

export function ReviewDialog(props: ReviewDialogProps) {
  const { quote, wallet, stale, changes, message, canRetry, submitting } = props
  const outdated = stale || changes.length > 0

  return (
    <Dialog open onOpenChange={(open) => !open && !submitting && props.onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[min(560px,calc(100%-2rem))] gap-5 overflow-y-auto border-line bg-surface-card p-6 text-cream sm:max-w-[560px]">
        <div className="flex flex-col gap-1.5">
          <DialogTitle className="text-lg font-bold">Revise seu pedido</DialogTitle>
          <DialogDescription className="text-sm text-subtle-text">
            Confira os valores antes de pagar. Eles foram conferidos agora com o mercado.
          </DialogDescription>
        </div>

        {outdated && (
          <div role="alert" className="flex flex-col gap-3 rounded-md border border-coral/60 p-4 text-sm">
            <p className="font-bold text-coral">Os valores mudaram desde a revisão.</p>
            {changes.length > 0 && (
              <ul className="flex list-disc flex-col gap-1 pl-5 text-subtle-text">
                {changes.map((change) => (
                  <li key={`${change.nftId}-${change.kind}`}>{describeChange(change)}</li>
                ))}
              </ul>
            )}
            <Button onClick={props.onRefresh} variant="outline" className="w-fit border-brand bg-transparent text-accent-text hover:bg-brand/10">
              Atualizar revisão
            </Button>
          </div>
        )}

        <ul aria-label="Itens do pedido" className="flex flex-col gap-3">
          {quote.items.map((item) => (
            <li key={`${item.nftId}-${item.editionId}`} className="flex items-center gap-3">
              <img src={item.image.small} alt="" width={45} height={45} className="size-[45px] shrink-0 rounded-md object-cover" />
              <div className="flex min-w-0 flex-1 flex-col text-sm leading-5">
                <span className="truncate font-bold">{item.name}</span>
                <span className="text-muted-text">
                  Edição {item.editionLabel} · {item.quantity} {item.quantity === 1 ? 'unidade' : 'unidades'}
                </span>
              </div>
              <span className="text-sm font-bold whitespace-nowrap text-accent-text">{formatEth(item.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <dl className="flex flex-col gap-2 border-t border-brand/30 pt-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt>Subtotal</dt>
            <dd>{formatEth(quote.summary.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>{quote.coupon?.description ?? 'Desconto do lançamento'}</dt>
            <dd>(-) {formatEth(quote.summary.discount)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Taxa de rede</dt>
            <dd>{formatEth(quote.summary.networkFee)}</dd>
          </div>
          <div className="flex justify-between gap-3 pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="text-accent-text">{formatEth(quote.summary.total)}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line p-4 text-sm">
          <div className="flex flex-col gap-1">
            <span className="font-bold">
              {WALLET_TYPE_LABELS[wallet.walletType]} conectada · {NETWORK_LABELS[quote.network]}
            </span>
            <span className="text-muted-text">{shortAddress(wallet.address)}</span>
          </div>
          <button type="button" onClick={props.onDisconnect} disabled={submitting} className="rounded-sm text-subtle-text underline-offset-4 hover:text-coral hover:underline">
            Desconectar carteira
          </button>
        </div>

        {message && !outdated && (
          <p role="alert" className="rounded-md border border-coral/60 px-4 py-3 text-sm text-coral">
            {message}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={props.onClose} disabled={submitting} className="border-line bg-transparent text-cream hover:bg-surface-raised">
            Voltar
          </Button>
          <Button onClick={props.onConfirm} disabled={submitting || outdated} className="font-bold">
            {submitting ? 'Enviando pedido...' : canRetry ? 'Tentar de novo' : 'Confirmar e pagar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
