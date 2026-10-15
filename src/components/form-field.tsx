import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface FieldControlProps {
  id: string
  'aria-invalid'?: true
  'aria-describedby'?: string
}

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  hideLabel?: boolean
  children: (props: FieldControlProps) => ReactNode
  className?: string
}

export function FormField({ label, required, error, hideLabel, children, className }: FormFieldProps) {
  const id = useId()
  const errorId = `${id}-erro`
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className={cn('text-sm leading-4 text-cream', hideLabel && 'sr-only md:not-sr-only md:invisible')}>
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-coral">
            *
          </span>
        )}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? errorId : undefined })}
      {error && (
        <p id={errorId} className="text-caption leading-4 text-coral">
          {error}
        </p>
      )}
    </div>
  )
}
