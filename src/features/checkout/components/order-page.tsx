import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import type { Network, Order } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import thankYou from '@/assets/decorations/thank-you.svg'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NETWORK_LABELS } from '@/features/catalog/labels'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { formatEth } from '@/lib/format'
import { useOrder } from '../queries'
import { WALLET_TYPE_LABELS } from '../labels'

const EXPLORER_NAMES: Record<Network, string> = { ethereum: 'Etherscan', polygon: 'Polygonscan', solana: 'Solscan' }

const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const shortHash = (hash: string) => `${hash.slice(0, 6)}...${hash.slice(-4)}`

function CloseLink() {
  return (
    <Link to="/" aria-label="Fechar e voltar ao início" className="absolute top-4 right-4 grid size-8 place-items-center rounded-sm text-accent-text hover:text-cream">
      <Icon name="close" />
    </Link>
  )
}

function Card({ children, labelledBy }: { children: React.ReactNode; labelledBy: string }) {
  return (
    <section
      aria-labelledby={labelledBy}
      className="relative mx-auto flex w-full max-w-[576px] flex-col border-b-8 border-brand bg-surface-card text-cream"
    >
      <CloseLink />
      {children}
    </section>
  )
}

function Receipt({ order }: { order: Order }) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headingRef.current?.focus(), [])
  const network = NETWORK_LABELS[order.wallet.network]

  return (
    <Card labelledBy="receipt-title">
      <div className="flex flex-col items-center gap-3 px-6 pt-6 pb-4">
        <img src={thankYou} alt="" width={66} height={80} />
        <h1 id="receipt-title" ref={headingRef} tabIndex={-1} className="text-center text-sm font-bold text-accent-text outline-none">
          Seus NFTs agora estão na sua carteira
        </h1>
      </div>

      <dl className="grid grid-cols-2 gap-y-3 border-y border-brand/60 px-6 py-3 text-xs leading-4 sm:flex sm:justify-between sm:gap-0 sm:divide-x sm:divide-brand/60">
        <div className="flex flex-col gap-1 sm:pr-3">
          <dt className="font-bold text-accent-text">ID da transação</dt>
          <dd className="text-subtle-text" title={order.transactionHash ?? undefined}>
            {order.transactionHash ? shortHash(order.transactionHash) : order.id}
          </dd>
        </div>
        <div className="flex flex-col gap-1 sm:px-3">
          <dt className="text-subtle-text">Data</dt>
          <dd className="text-subtle-text">
            <time dateTime={order.updatedAt}>{dateFormat.format(new Date(order.updatedAt))}</time>
          </dd>
        </div>
        <div className="flex flex-col gap-1 sm:px-3">
          <dt className="text-subtle-text">Total</dt>
          <dd className="text-subtle-text">{formatEth(order.summary.total)}</dd>
        </div>
        <div className="flex flex-col gap-1 sm:pl-3">
          <dt className="font-bold text-accent-text">Carteira</dt>
          <dd className="text-subtle-text">{WALLET_TYPE_LABELS[order.wallet.walletType]}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-3 px-6 pt-4 pb-8 sm:px-7">
        <h2 className="text-xs font-bold">Detalhes da transação</h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-brand/40 text-left">
              <th scope="col" className="pb-2 font-bold">
                NFTs
              </th>
              <th scope="col" className="hidden pb-2 text-center font-bold sm:table-cell">
                Edições
              </th>
              <th scope="col" className="pb-2 text-right font-bold">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={`${item.nftId}-${item.editionId}`}>
                <td className="pt-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <img src={item.image.small} alt="" width={40} height={40} className="size-10 shrink-0 rounded-md object-cover" />
                    <div className="flex min-w-0 flex-col leading-4">
                      <span className="font-bold break-words">{item.name}</span>
                      <span className="text-subtle-text">ID do token: {item.tokenId}</span>
                      <span className="text-subtle-text sm:hidden">Edições: {item.quantity}</span>
                    </div>
                  </div>
                </td>
                <td className="hidden px-2 pt-3 text-center whitespace-nowrap text-subtle-text sm:table-cell">(x {item.quantity})</td>
                <td className="pt-3 text-right text-sm font-bold whitespace-nowrap text-accent-text">{formatEth(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto flex w-full max-w-[200px] flex-col gap-1 pt-2 text-xs sm:max-w-[200px]">
          {order.summary.discount !== '0' && (
            <div className="flex justify-between gap-3">
              <dt>Desconto</dt>
              <dd>(-) {formatEth(order.summary.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt>Taxa de rede</dt>
            <dd className="text-sm">{formatEth(order.summary.networkFee)}</dd>
          </div>
          <div className="flex justify-between gap-3 font-bold">
            <dt>Total</dt>
            <dd className="text-sm text-accent-text">{formatEth(order.summary.total)}</dd>
          </div>
        </dl>

        <p className="border-t border-brand/40 pt-3 text-center text-xs leading-5 text-accent-text">
          Transação confirmada na {network}. A propriedade foi transferida para sua carteira conectada e registrada na rede.
        </p>

        {order.explorerUrl && (
          <Button asChild className="mx-auto h-9 rounded-[3px] px-3 text-xs font-bold">
            <a href={order.explorerUrl} target="_blank" rel="noreferrer">
              Ver no {EXPLORER_NAMES[order.wallet.network]}
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          </Button>
        )}
      </div>
    </Card>
  )
}

function Pending() {
  return (
    <Card labelledBy="pending-title">
      <div role="status" className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <span aria-hidden className="size-10 animate-spin rounded-full border-4 border-brand/30 border-t-brand motion-reduce:animate-none" />
        <h1 id="pending-title" className="text-base font-bold">
          Processando o pagamento
        </h1>
        <p className="max-w-[360px] text-sm leading-6 text-subtle-text">
          Aguardando a confirmação da rede. Você pode recarregar ou sair desta página: o pedido continua sendo processado.
        </p>
      </div>
    </Card>
  )
}

function Rejected({ order }: { order: Order }) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headingRef.current?.focus(), [])
  return (
    <Card labelledBy="rejected-title">
      <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <span aria-hidden className="grid size-12 place-items-center rounded-full border border-coral text-coral">
          <Icon name="danger-triangle" />
        </span>
        <h1 id="rejected-title" ref={headingRef} tabIndex={-1} className="text-base font-bold outline-none">
          Pagamento não concluído
        </h1>
        <p className="max-w-[380px] text-sm leading-6 text-subtle-text">{order.rejectionReason ?? 'O pagamento não foi aprovado.'}</p>
        <p className="max-w-[380px] text-sm leading-6 text-subtle-text">Os itens continuam no seu carrinho.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" className="rounded-[3px] border-line bg-transparent text-cream hover:bg-surface-raised">
            <Link to="/carrinho">Voltar ao carrinho</Link>
          </Button>
          <Button asChild className="rounded-[3px] font-bold">
            <Link to="/pagamento">Tentar de novo</Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function OrderPage({ id }: { id: string }) {
  const navigate = useNavigate()
  const order = useOrder(id)
  const notFound = isApiError(order.error) && (order.error.status === 404 || order.error.status === 403)
  useDocumentTitle(
    order.data?.status === 'confirmed'
      ? 'Pedido confirmado'
      : order.data?.status === 'rejected'
        ? 'Pagamento não concluído'
        : notFound
          ? 'Pedido não encontrado'
          : 'Pedido',
  )
  useEffect(() => {
    if (isApiError(order.error) && order.error.status === 401) void navigate({ to: '/entrar', search: { redirect: `/pedido/${id}` }, replace: true })
  }, [order.error, navigate, id])

  let content: React.ReactNode
  if (order.data?.status === 'confirmed') content = <Receipt order={order.data} />
  else if (order.data?.status === 'rejected') content = <Rejected order={order.data} />
  else if (order.data) content = <Pending />
  else if (order.isPending) content = <Skeleton role="status" aria-label="Carregando pedido" className="mx-auto h-[480px] w-full max-w-[576px]" />
  else
    content = (
      <div className="mx-auto flex max-w-[480px] flex-col items-center gap-4 py-12 text-center">
        <h1 className="text-xl font-bold text-cream">{notFound ? 'Pedido não encontrado' : 'Não foi possível carregar o pedido'}</h1>
        {!notFound && (
          <Button onClick={() => void order.refetch()} className="rounded-[3px] font-bold">
            Tentar de novo
          </Button>
        )}
        <Link to="/" className="rounded-sm text-sm text-accent-text hover:underline">
          Voltar ao início
        </Link>
      </div>
    )

  return <div className="px-4 pt-8 pb-12 md:pt-16">{content}</div>
}
