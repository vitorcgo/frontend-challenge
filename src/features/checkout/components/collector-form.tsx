import { useId, type ReactNode } from 'react'
import { NETWORKS, WALLET_TYPES, type Network, type WalletInput, type WalletType } from '@/api/contracts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NETWORK_LABELS } from '@/features/catalog/labels'
import { cn } from '@/lib/utils'
import { WALLET_TYPE_LABELS } from '../labels'

export type CollectorField = keyof WalletInput
export type CollectorErrors = Partial<Record<CollectorField, string>>

const inputClass =
  'h-10 w-full min-w-0 rounded-[3px] border border-line bg-transparent px-3 text-sm leading-4 text-cream outline-none placeholder:text-muted-text focus:border-brand aria-invalid:border-coral'

interface FieldProps {
  label: string
  required?: boolean
  error?: string
  hideLabel?: boolean
  children: (props: { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string }) => ReactNode
  className?: string
}

function Field({ label, required, error, hideLabel, children, className }: FieldProps) {
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

interface CollectorFormProps {
  values: WalletInput
  errors: CollectorErrors
  onChange: (field: CollectorField, value: string) => void
  note: string
  onNoteChange: (note: string) => void
  useOther: boolean
  onUseOtherChange: (value: boolean) => void
}

export function CollectorForm({ values, errors, onChange, note, onNoteChange, useOther, onUseOtherChange }: CollectorFormProps) {
  const text = (field: CollectorField, label: string, options: { placeholder?: string; type?: string; autoComplete?: string; hideLabel?: boolean } = {}) => (
    <Field label={label} required={!options.hideLabel} error={errors[field]} hideLabel={options.hideLabel}>
      {(props) => (
        <input
          {...props}
          name={field}
          type={options.type ?? 'text'}
          autoComplete={options.autoComplete ?? 'off'}
          placeholder={options.placeholder}
          value={values[field]}
          onChange={(event) => onChange(field, event.target.value)}
          className={inputClass}
        />
      )}
    </Field>
  )

  const select = <T extends string>(field: CollectorField, label: string, options: readonly T[], labels: Record<T, string>, placeholder: string) => (
    <Field label={label} required error={errors[field]}>
      {(props) => (
        <Select value={values[field] || undefined} onValueChange={(value) => onChange(field, value)}>
          <SelectTrigger {...props} name={field} className={cn(inputClass, 'h-10 data-[size=default]:h-10')}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="border-line bg-surface-raised text-cream">
            {options.map((option) => (
              <SelectItem key={option} value={option} className="text-sm focus:bg-surface-dark focus:text-accent-text">
                {labels[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </Field>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {text('displayName', 'Nome de exibição', { autoComplete: 'name' })}
        {text('alias', 'Nome de usuário', { autoComplete: 'username' })}
        {select<Network>('network', 'Rede', NETWORKS, NETWORK_LABELS, 'Selecione uma rede')}
        {text('profileName', 'Nome do perfil')}
        {text('address', 'Endereço da carteira', { placeholder: 'Endereço 0x da carteira' })}
        {text('secondaryAddress', 'ENS ou carteira secundária (opcional)', {
          placeholder: 'ENS ou carteira secundária (opcional)',
          hideLabel: true,
        })}
        {select<WalletType>('walletType', 'Tipo de carteira', WALLET_TYPES, WALLET_TYPE_LABELS, 'Selecione uma carteira')}
        {text('referralCode', 'Código de indicação')}
        {text('email', 'E-mail', { type: 'email', autoComplete: 'email' })}
        <Field label="Nome ENS" required error={errors.ensName}>
          {(props) => (
            <div className="flex items-center gap-2">
              <input
                {...props}
                name="ensName"
                value={values.ensName}
                onChange={(event) => onChange('ensName', event.target.value)}
                className={cn(inputClass, 'flex-1')}
              />
              <span className="grid h-10 shrink-0 place-items-center rounded-[3px] border border-line px-3 text-sm text-cream">.eth</span>
            </div>
          )}
        </Field>
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-cream">
        <input
          type="checkbox"
          checked={useOther}
          onChange={(event) => onUseOtherChange(event.target.checked)}
          className="size-4 rounded-full accent-[var(--color-brand)]"
        />
        Usar outra carteira?
      </label>

      <Field label="Observação do colecionador (opcional)">
        {(props) => (
          <textarea
            {...props}
            value={note}
            maxLength={280}
            onChange={(event) => onNoteChange(event.target.value)}
            className="h-[150px] w-full max-w-[350px] resize-none rounded-[3px] border border-line bg-transparent p-3 text-sm text-cream outline-none focus:border-brand"
          />
        )}
      </Field>
    </div>
  )
}
