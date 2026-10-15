import { Icon } from '@/components/icon'
import { cn } from '@/lib/utils'

export function RatingStars({ average, className }: { average: string; className?: string }) {
  const filled = Math.floor(Number(average))
  return (
    <span role="img" aria-label={`Nota ${average} de 5`} className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: 5 }, (_, index) => (
        <Icon key={index} name="star" className={index < filled ? 'text-brand' : 'text-subtle-text'} />
      ))}
    </span>
  )
}
