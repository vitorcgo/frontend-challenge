import { NETWORKS, WALLET_TYPES, type Network, type WalletInput, type WalletType } from '@/api/contracts'
import { FormField } from '@/components/form-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NETWORK_LABELS } from '@/features/catalog/labels'
import { fieldInputClass as inputClass } from '@/lib/form-styles'
import { cn } from '@/lib/utils'
import { WALLET_TYPE_LABELS } from '../labels'

export type CollectorField = keyof WalletInput
export type CollectorErrors = Partial<Record<CollectorField, string>>

interface CollectorFormProps {
  values: WalletInput
  errors: CollectorErrors
  onChange: (field: CollectorField, value: string) => void
  /** Na tela de carteiras o campo `alias` é o apelido da carteira; no pagamento, o nome de usuário. */
  aliasLabel?: string
  note?: { value: string; onChange: (note: string) => void }
  otherWallet?: { checked: boolean; onChange: (value: boolean) => void }
}

export function CollectorForm({ values, errors, onChange, aliasLabel = 'Nome de usuário', note, otherWallet }: CollectorFormProps) {
  const text = (field: CollectorField, label: string, options: { placeholder?: string; type?: string; autoComplete?: string; hideLabel?: boolean } = {}) => (
    <FormField label={label} required={!options.hideLabel} error={errors[field]} hideLabel={options.hideLabel}>
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
    </FormField>
  )

  const select = <T extends string>(field: CollectorField, label: string, options: readonly T[], labels: Record<T, string>, placeholder: string) => (
    <FormField label={label} required error={errors[field]}>
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
    </FormField>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {text('displayName', 'Nome de exibição', { autoComplete: 'name' })}
        {text('alias', aliasLabel, { autoComplete: aliasLabel === 'Nome de usuário' ? 'username' : 'off' })}
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
        <FormField label="Nome ENS" required error={errors.ensName}>
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
        </FormField>
      </div>

      {otherWallet && (
        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-cream">
          <input
            type="checkbox"
            checked={otherWallet.checked}
            onChange={(event) => otherWallet.onChange(event.target.checked)}
            className="size-4 rounded-full accent-[var(--color-brand)]"
          />
          Usar outra carteira?
        </label>
      )}

      {note && (
        <FormField label="Observação do colecionador (opcional)">
          {(props) => (
            <textarea
              {...props}
              value={note.value}
              maxLength={280}
              onChange={(event) => note.onChange(event.target.value)}
              className="h-[150px] w-full max-w-[350px] resize-none rounded-[3px] border border-line bg-transparent p-3 text-sm text-cream outline-none focus:border-brand"
            />
          )}
        </FormField>
      )}
    </div>
  )
}
