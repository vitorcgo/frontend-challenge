import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState, type FormEvent } from 'react'
import type { Wallet, WalletInput, WalletSlot, WalletsResponse } from '@/api/contracts'
import { createWallet, updateWallet } from '@/api/endpoints/wallets'
import { walletInputSchema } from '@/api/schemas'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { focusFirstError, fromApi, fromZod } from '@/features/auth/form-errors'
import { useSession } from '@/features/auth/session'
import { CollectorForm, type CollectorErrors, type CollectorField } from '@/features/checkout/components/collector-form'
import { useWallets, walletKeys } from '@/features/checkout/queries'
import { emptyWalletValues, walletValues } from '@/features/checkout/wallet-values'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { cn } from '@/lib/utils'

const FIELDS = ['displayName', 'alias', 'network', 'profileName', 'address', 'secondaryAddress', 'walletType', 'referralCode', 'email', 'ensName'] as const satisfies readonly CollectorField[]

const TITLES: Record<WalletSlot, string> = { primary: 'Carteira principal', secondary: 'Carteira secundária' }

interface WalletSectionProps {
  slot: WalletSlot
  wallet: Wallet | null
  primary: Wallet | null
  email: string
}

function WalletSection({ slot, wallet, primary, email }: WalletSectionProps) {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(Boolean(wallet))
  const [values, setValues] = useState<WalletInput>(wallet ? walletValues(wallet) : emptyWalletValues(email))
  const [sameAsPrimary, setSameAsPrimary] = useState(false)
  const [errors, setErrors] = useState<CollectorErrors>({})
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string }>()
  const titleId = `wallet-${slot}-title`

  const save = useMutation({
    mutationFn: (input: WalletInput) => (wallet ? updateWallet(wallet.id, input) : createWallet({ ...input, slot })),
    onSuccess: (saved) => {
      queryClient.setQueryData<WalletsResponse>(walletKeys.list(user?.id), (current) => current && { ...current, [slot]: saved })
      void queryClient.invalidateQueries({ queryKey: walletKeys.list(user?.id) })
      const text = wallet ? `${TITLES[slot]} atualizada.` : `${TITLES[slot]} adicionada.`
      setStatus({ kind: 'success', text })
    },
    onError: (failure) => {
      const result = fromApi(failure, FIELDS)
      setErrors(result.fields)
      focusFirstError(formRef.current, FIELDS, result.fields)
      if (result.message) setStatus({ kind: 'error', text: result.message })
    },
  })

  const change = (field: CollectorField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setStatus(undefined)
  }

  const copyPrimary = (checked: boolean) => {
    setSameAsPrimary(checked)
    if (checked && primary) {
      setValues(walletValues(primary))
      setErrors({})
      setOpen(true)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setStatus(undefined)
    const parsed = walletInputSchema.safeParse(values)
    if (!parsed.success) {
      const next = fromZod<CollectorField>(parsed.error)
      setErrors(next)
      focusFirstError(formRef.current, FIELDS, next)
      return
    }
    save.mutate(parsed.data)
  }

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex flex-col gap-1">
          <h2 id={titleId} className="text-body font-bold text-cream">
            {TITLES[slot]}
          </h2>
          <p className="text-xs leading-4 text-subtle-text">
            {slot === 'primary'
              ? 'Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.'
              : !wallet && !open
                ? 'Você ainda não adicionou uma carteira secundária.'
                : 'Usada como alternativa no pagamento.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {slot === 'secondary' && primary && !wallet && (
            <label className="flex cursor-pointer items-center gap-2 text-xs text-cream">
              <input
                type="checkbox"
                checked={sameAsPrimary}
                onChange={(event) => copyPrimary(event.target.checked)}
                className="size-4 accent-[var(--color-brand)]"
              />
              Igual à carteira principal
            </label>
          )}
          {!open && (
            <button type="button" onClick={() => setOpen(true)} className="rounded-sm text-sm font-bold text-accent-text hover:text-cream">
              Adicionar
            </button>
          )}
        </div>
      </div>

      {slot === 'primary' && !wallet && !open && <p className="text-sm text-subtle-text">Você ainda não adicionou uma carteira principal.</p>}

      {open && (
        <form ref={formRef} onSubmit={submit} noValidate aria-labelledby={titleId} className="flex flex-col gap-6">
          <CollectorForm values={values} errors={errors} onChange={change} aliasLabel="Apelido da carteira" />
          {status && (
            <p role={status.kind === 'error' ? 'alert' : 'status'} className={cn('text-sm', status.kind === 'error' ? 'text-coral' : 'text-accent-text')}>
              {status.text}
            </p>
          )}
          <Button type="submit" disabled={save.isPending} className="h-[30px] w-fit rounded-[3px] px-4 text-xs font-bold">
            {save.isPending ? 'Salvando...' : 'Salvar carteira'}
          </Button>
        </form>
      )}
    </section>
  )
}

export function WalletsPage() {
  useDocumentTitle('Carteiras')
  const { user } = useSession()
  const wallets = useWallets()

  if (wallets.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 text-sm text-coral">
        <h1 className="text-body font-bold text-cream">Carteiras</h1>
        Não foi possível carregar suas carteiras.
        <Button onClick={() => void wallets.refetch()} className="rounded-[3px] font-bold">
          Tentar de novo
        </Button>
      </div>
    )
  }
  if (!wallets.data || !user) return <Skeleton role="status" aria-label="Carregando carteiras" className="h-[420px] w-full" />

  return (
    <div className="flex flex-col gap-10">
      <h1 className="sr-only">Carteiras</h1>
      <WalletSection key={`${user.id}-primary`} slot="primary" wallet={wallets.data.primary} primary={null} email={user.email} />
      <WalletSection
        key={`${user.id}-secondary`}
        slot="secondary"
        wallet={wallets.data.secondary}
        primary={wallets.data.primary}
        email={user.email}
      />
    </div>
  )
}
