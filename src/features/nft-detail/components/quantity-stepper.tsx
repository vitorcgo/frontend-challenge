import { useId } from 'react'
import { Icon } from '@/components/icon'
import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  value: number
  max: number
  onChange: (value: number) => void
  size?: 'lg' | 'sm'
  label?: string
  hideLabel?: boolean
  showLimitHint?: boolean
  className?: string
}

const buttonSize = {
  lg: 'h-[49.5px] w-[33px] [&>span]:size-[26px]',
  sm: 'h-[30px] w-5',
}

export function QuantityStepper({
  value,
  max,
  onChange,
  size = 'lg',
  label,
  hideLabel = false,
  showLimitHint = true,
  className,
}: QuantityStepperProps) {
  const labelId = useId()
  const hintId = useId()
  const disabled = max === 0
  const atLimit = !disabled && value >= max

  const button = (direction: 'minus' | 'plus') => {
    const isMinus = direction === 'minus'
    return (
      <button
        type="button"
        aria-label={isMinus ? 'Diminuir quantidade' : 'Aumentar quantidade'}
        aria-describedby={isMinus || !showLimitHint ? undefined : hintId}
        disabled={disabled || (isMinus ? value <= 1 : value >= max)}
        onClick={() => onChange(isMinus ? value - 1 : value + 1)}
        className={cn(
          'grid shrink-0 place-items-center rounded-full border border-ink bg-brand text-ink drop-shadow-[0_6.6px_9.9px_rgb(20_13_10/0.15)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40',
          buttonSize[size],
        )}
      >
        <Icon name={direction} />
      </button>
    )
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div role="group" aria-labelledby={labelId} className="flex items-center gap-2">
        <span id={labelId} className={cn('text-body leading-4 font-medium text-subtle-text', (!label || hideLabel) && 'sr-only')}>
          {label ?? 'Quantidade'}
        </span>
        <div className="flex items-center gap-3">
          {button('minus')}
          <output
            aria-live="polite"
            className={cn('min-w-4 text-center text-cream', size === 'lg' ? 'text-xl leading-7' : 'text-lg leading-[25px] font-medium')}
          >
            {value}
          </output>
          {button('plus')}
        </div>
      </div>
      {showLimitHint && (
        <p id={hintId} role="status" className={cn('text-caption leading-4 text-muted-text', !atLimit && 'sr-only')}>
          {atLimit ? `Limite de ${max} ${max === 1 ? 'unidade' : 'unidades'} nesta compra.` : ''}
        </p>
      )}
    </div>
  )
}
