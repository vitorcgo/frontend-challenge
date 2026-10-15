import { Link } from '@tanstack/react-router'
import { useId, useState, type FormEvent } from 'react'
import type { Cart } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { Skeleton } from '@/components/ui/skeleton'
import { announce } from '@/lib/announce'
import { formatEth } from '@/lib/format'
import { EXACT_LOCATION } from '@/lib/link-options'
import { cn } from '@/lib/utils'
import { useApplyCoupon, useRemoveCoupon } from '../use-cart'

function CouponForm({ cart, mobile }: { cart: Cart; mobile: boolean }) {
  const inputId = useId()
  const errorId = useId()
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!code.trim()) {
      setError('Informe o código.')
      return
    }
    setError(undefined)
    apply.mutate(code, {
      onSuccess: (updated) => {
        setCode('')
        announce(`Cupom ${updated.coupon?.code ?? ''} aplicado. O total foi atualizado.`)
      },
      onError: (failure) => {
        const message = isApiError(failure) ? (failure.fieldErrors.code?.[0] ?? failure.message) : 'Não foi possível aplicar o cupom.'
        setError(message)
        announce(message)
      },
    })
  }

  if (cart.coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[3px] border border-line px-3 py-2.5 text-sm">
        <p className="text-cream">
          <span className="font-bold text-accent-text">{cart.coupon.code}</span> aplicado
        </p>
        <button
          type="button"
          onClick={() => remove.mutate(undefined, { onSuccess: () => announce('Cupom removido. O total foi atualizado.') })}
          disabled={remove.isPending}
          className="rounded-sm text-subtle-text underline-offset-4 hover:text-accent-text hover:underline"
        >
          Remover
        </button>
      </div>
    )
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor={inputId} className={cn('text-sm leading-4 font-bold text-cream', mobile && 'sr-only')}>
        Código promocional
      </label>
      <div
        className={cn(
          'flex items-center overflow-hidden',
          mobile ? 'h-[50px] rounded-[30px] border border-line bg-surface-dark pl-4' : 'h-10 rounded-[3px] border border-brand pl-2',
          error && 'border-coral',
        )}
      >
        <input
          id={inputId}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent text-xs leading-4 text-cream uppercase outline-none placeholder:text-muted-text placeholder:normal-case"
        />
        <button
          type="submit"
          disabled={apply.isPending}
          className={cn(
            'h-full shrink-0 font-bold text-ink disabled:opacity-60',
            mobile
              ? 'w-[97px] rounded-[30px] bg-[linear-gradient(100deg,#d28a4c_4%,rgb(210_138_76/0.8)_122%)] text-[15px]'
              : 'w-[102px] bg-brand text-body',
          )}
        >
          Aplicar
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-caption leading-4 text-coral">
          {error}
        </p>
      )}
    </form>
  )
}

function Row({ label, value, strong, small }: { label: string; value: string; strong?: boolean; small?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className={cn('text-body', strong ? 'leading-4 font-bold text-cream' : 'text-cream')}>{label}</dt>
      <dd
        className={cn(
          'text-right whitespace-nowrap',
          strong ? 'text-lg leading-4 font-bold text-accent-text' : small ? 'text-body text-cream' : 'text-lg leading-4 text-cream',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

interface CartSummaryProps {
  cart: Cart
  mobile: boolean
  /** Itens esgotados ou acima do estoque impedem seguir para o pagamento. */
  blocked: boolean
}

export function CartSummary({ cart, mobile, blocked }: CartSummaryProps) {
  const ctaClass = cn(
    'w-full font-bold text-ink',
    mobile
      ? 'h-[60px] rounded-[40px] bg-[linear-gradient(100deg,#d28a4c_4%,rgb(210_138_76/0.8)_122%)] text-base'
      : 'h-10 rounded-[3px] bg-brand text-body',
  )
  const { summary } = cart
  return (
    <section
      aria-labelledby="cart-summary-title"
      className={cn('flex flex-col gap-6', mobile ? 'rounded-t-[30px] bg-surface-card px-6 pt-6 pb-8' : 'w-full lg:w-[332px] lg:shrink-0')}
    >
      <div className={cn('flex flex-col gap-3', mobile && 'sr-only')}>
        <h2 id="cart-summary-title" className="text-lg leading-4 font-bold text-cream">
          Resumo da carteira
        </h2>
        <hr className="border-0 border-t border-brand/30" />
      </div>

      <CouponForm cart={cart} mobile={mobile} />

      <dl className="flex flex-col gap-3" aria-live="polite">
        <Row label="Subtotal" value={formatEth(summary.subtotal)} />
        <Row label={cart.coupon ? cart.coupon.description : 'Desconto do lançamento'} value={`(-) ${formatEth(summary.discount)}`} small />
        <div className="flex flex-col items-end gap-3">
          <div className="w-full">
            <Row label="Taxa de rede" value={formatEth(summary.networkFee)} />
          </div>
          <p className="text-xs leading-4 text-accent-text">Taxa estimada</p>
        </div>
        <div className="pt-3">
          <Row label="Total" value={formatEth(summary.total)} strong />
        </div>
      </dl>

      <div className="flex flex-col items-center gap-3">
        {blocked ? (
          <button type="button" disabled className={cn(ctaClass, 'opacity-60')}>
            Conectar e finalizar
          </button>
        ) : (
          <Link to="/pagamento" className={cn(ctaClass, 'grid place-items-center')}>
            Conectar e finalizar
          </Link>
        )}
        {blocked && (
          <p role="status" className="text-center text-caption leading-4 text-coral">
            Ajuste os itens marcados para continuar.
          </p>
        )}
        <Link to="/" hash="mercado" activeOptions={EXACT_LOCATION} className="rounded-sm text-body text-accent-text hover:underline">
          Continuar explorando
        </Link>
      </div>
    </section>
  )
}

export function CartSummarySkeleton() {
  return (
    <div aria-hidden className="flex w-full flex-col gap-6 lg:w-[332px] lg:shrink-0">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}
