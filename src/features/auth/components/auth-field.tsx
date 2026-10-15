import { useId, useState, type ComponentProps, type Ref } from 'react'
import { Icon } from '@/components/icon'
import { cn } from '@/lib/utils'

interface AuthFieldProps extends Omit<ComponentProps<'input'>, 'id'> {
  /** O Figma só mostra o placeholder; o rótulo existe para leitores de tela (§8). */
  label: string
  error?: string
  ref?: Ref<HTMLInputElement>
}

// Mobile (Figma): campos de 50 px com cantos de 10 px; no modal do desktop, 40 px e 5 px.
const inputClass =
  'h-[50px] w-full min-w-0 rounded-[10px] border md:h-10 md:rounded-[5px] border-line bg-transparent px-4 text-sm leading-4 text-cream outline-none transition-colors placeholder:text-muted-text focus:border-brand aria-invalid:border-coral'

export function AuthField({ label, error, className, ...props }: AuthFieldProps) {
  const id = useId()
  const errorId = `${id}-erro`
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        placeholder={label}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={inputClass}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-caption leading-4 text-coral">
          {error}
        </p>
      )}
    </div>
  )
}

export function PasswordField({ label, error, className, ...props }: AuthFieldProps) {
  const id = useId()
  const errorId = `${id}-erro`
  const [visible, setVisible] = useState(false)
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          placeholder={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(inputClass, 'pr-12')}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          aria-controls={id}
          onClick={() => setVisible((value) => !value)}
          className={cn(
            'absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-sm transition-colors hover:text-accent-text',
            visible ? 'text-accent-text' : 'text-muted-text',
          )}
        >
          <Icon name="hide" className="scale-90" />
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-caption leading-4 text-coral">
          {error}
        </p>
      )}
    </div>
  )
}
