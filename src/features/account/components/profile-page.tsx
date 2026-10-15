import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { MAX_AVATAR_BYTES, type Profile, type ProfileUpdate } from '@/api/contracts'
import { changePassword, removeAvatar, updateAvatar, updateProfile } from '@/api/endpoints/profile'
import { isApiError } from '@/api/errors'
import { passwordChangeSchema, profileUpdateSchema } from '@/api/schemas'
import { FormField } from '@/components/form-field'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { focusFirstError, fromApi, fromZod, type FormErrors } from '@/features/auth/form-errors'
import { useSession } from '@/features/auth/session'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { announce } from '@/lib/announce'
import { fieldInputClass } from '@/lib/form-styles'
import { cn } from '@/lib/utils'
import { profileKeys, useProfile } from '../queries'

const PROFILE_FIELDS = ['displayName', 'username', 'email', 'ensName', 'walletNickname'] as const
const PASSWORD_FIELDS = ['currentPassword', 'newPassword', 'confirmPassword'] as const
type Field = (typeof PROFILE_FIELDS)[number] | (typeof PASSWORD_FIELDS)[number]

const emptyPasswords = { currentPassword: '', newPassword: '', confirmPassword: '' }

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function PasswordInput({ name, label, value, error, onChange, autoComplete }: { name: Field; label: string; value: string; error?: string; onChange: (value: string) => void; autoComplete: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <FormField label={label} error={error}>
      {(props) => (
        <div className="relative">
          <input
            {...props}
            name={name}
            type={visible ? 'text' : 'password'}
            autoComplete={autoComplete}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={cn(fieldInputClass, 'pr-11')}
          />
          <button
            type="button"
            aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
            aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}
            className={cn('absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-sm', visible ? 'text-accent-text' : 'text-muted-text')}
          >
            <Icon name="hide" className="scale-90" />
          </button>
        </div>
      )}
    </FormField>
  )
}

function AvatarControl({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string>()
  const saved = (updated: Profile, text: string) => {
    queryClient.setQueryData(profileKeys.detail(updated.id), updated)
    void queryClient.invalidateQueries({ queryKey: ['session'] })
    announce(text)
  }
  const upload = useMutation({ mutationFn: updateAvatar, onSuccess: (updated) => saved(updated, 'Avatar atualizado.') })
  const remove = useMutation({ mutationFn: removeAvatar, onSuccess: (updated) => saved(updated, 'Avatar removido.') })
  const busy = upload.isPending || remove.isPending

  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(undefined)
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return setError('Envie uma imagem PNG, JPEG ou WebP.')
    if (file.size > MAX_AVATAR_BYTES) return setError('A imagem pode ter no máximo 200 KB.')
    upload.mutate(await readFile(file), {
      onError: (failure) => setError(isApiError(failure) ? (failure.fieldErrors.dataUrl?.[0] ?? failure.message) : 'Não foi possível enviar a imagem.'),
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <span id="avatar-label" className="text-sm leading-4 text-cream">
        Avatar
      </span>
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-dark text-accent-text">
          {profile.avatarUrl ? <img src={profile.avatarUrl} alt="Seu avatar" className="size-full object-cover" /> : <Icon name="image" className="scale-75" />}
        </span>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" aria-labelledby="avatar-label" onChange={(event) => void choose(event)} className="sr-only" tabIndex={-1} />
        <Button type="button" onClick={() => inputRef.current?.click()} disabled={busy} aria-describedby={error ? 'avatar-error' : undefined} className="h-[30px] rounded-[3px] px-4 text-xs font-bold">
          {upload.isPending ? 'Enviando...' : 'Alterar'}
        </Button>
        {profile.avatarUrl && (
          <button
            type="button"
            onClick={() => remove.mutate(undefined, { onError: () => setError('Não foi possível remover o avatar.') })}
            disabled={busy}
            className="rounded-sm text-xs text-cream hover:text-accent-text"
          >
            Remover
          </button>
        )}
      </div>
      <p className="text-caption leading-4 text-subtle-text">PNG, JPEG ou WebP de até 200 KB.</p>
      {error && (
        <p id="avatar-error" role="alert" className="text-caption leading-4 text-coral">
          {error}
        </p>
      )}
    </div>
  )
}

function ProfileForm({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLFormElement>(null)
  const [values, setValues] = useState<ProfileUpdate>({
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    ensName: profile.ensName,
    walletNickname: profile.walletNickname,
  })
  const [passwords, setPasswords] = useState(emptyPasswords)
  const [errors, setErrors] = useState<FormErrors<Field>>({})
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string }>()

  const save = useMutation({
    mutationFn: async ({ data, password }: { data: ProfileUpdate; password?: { currentPassword: string; newPassword: string } }) => {
      const updated = await updateProfile(data)
      queryClient.setQueryData(profileKeys.detail(updated.id), updated)
      void queryClient.invalidateQueries({ queryKey: ['session'] })
      if (password) await changePassword(password)
      return Boolean(password)
    },
  })

  const set = (field: Field, value: string) => {
    if ((PASSWORD_FIELDS as readonly string[]).includes(field)) setPasswords((current) => ({ ...current, [field]: value }))
    else setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setStatus(undefined)
    const next: FormErrors<Field> = {}
    const parsed = profileUpdateSchema.safeParse(values)
    if (!parsed.success) Object.assign(next, fromZod<Field>(parsed.error))

    const wantsPassword = Object.values(passwords).some(Boolean)
    let password: { currentPassword: string; newPassword: string } | undefined
    if (wantsPassword) {
      const parsedPassword = passwordChangeSchema.safeParse(passwords)
      if (!parsedPassword.success) Object.assign(next, fromZod<Field>(parsedPassword.error))
      else password = parsedPassword.data
      if (!next.newPassword && passwords.confirmPassword !== passwords.newPassword) next.confirmPassword = 'As senhas não conferem.'
    }

    if (Object.keys(next).length || !parsed.success) {
      setErrors(next)
      focusFirstError(formRef.current, [...PROFILE_FIELDS, ...PASSWORD_FIELDS], next)
      return
    }

    save.mutate(
      { data: parsed.data, password },
      {
        onSuccess: (changedPassword) => {
          setPasswords(emptyPasswords)
          const text = changedPassword ? 'Perfil e senha salvos.' : 'Perfil salvo.'
          setStatus({ kind: 'success', text })
        },
        onError: (failure) => {
          const result = fromApi<Field>(failure, [...PROFILE_FIELDS, 'currentPassword', 'newPassword'])
          setErrors(result.fields)
          focusFirstError(formRef.current, [...PROFILE_FIELDS, ...PASSWORD_FIELDS], result.fields)
          if (result.message) setStatus({ kind: 'error', text: result.message })
        },
      },
    )
  }

  const text = (field: (typeof PROFILE_FIELDS)[number], label: string, options: { type?: string; autoComplete?: string } = {}) => (
    <FormField label={label} required error={errors[field]}>
      {(props) => (
        <input
          {...props}
          name={field}
          type={options.type ?? 'text'}
          autoComplete={options.autoComplete ?? 'off'}
          value={values[field]}
          onChange={(event) => set(field, event.target.value)}
          className={fieldInputClass}
        />
      )}
    </FormField>
  )

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-6">
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {text('displayName', 'Nome de exibição', { autoComplete: 'name' })}
        {text('username', 'Nome de usuário', { autoComplete: 'username' })}
        {text('email', 'E-mail', { type: 'email', autoComplete: 'email' })}
        <FormField label="Nome ENS" required error={errors.ensName}>
          {(props) => (
            <div className="flex items-center gap-2">
              <input {...props} name="ensName" value={values.ensName} onChange={(event) => set('ensName', event.target.value)} className={cn(fieldInputClass, 'flex-1')} />
              <span className="grid h-10 shrink-0 place-items-center rounded-[3px] border border-line px-3 text-sm text-cream">.eth</span>
            </div>
          )}
        </FormField>
        {text('walletNickname', 'Apelido da carteira')}
        <AvatarControl profile={profile} />
      </div>

      <fieldset className="flex max-w-full flex-col gap-4 sm:max-w-[calc(50%-12px)]">
        <legend className="mb-4 text-sm font-bold text-cream">Alterar senha</legend>
        <PasswordInput name="currentPassword" label="Senha atual" value={passwords.currentPassword} error={errors.currentPassword} onChange={(value) => set('currentPassword', value)} autoComplete="current-password" />
        <PasswordInput name="newPassword" label="Nova senha" value={passwords.newPassword} error={errors.newPassword} onChange={(value) => set('newPassword', value)} autoComplete="new-password" />
        <PasswordInput name="confirmPassword" label="Confirmar nova senha" value={passwords.confirmPassword} error={errors.confirmPassword} onChange={(value) => set('confirmPassword', value)} autoComplete="new-password" />
      </fieldset>

      {status && (
        <p role={status.kind === 'error' ? 'alert' : 'status'} className={cn('text-sm', status.kind === 'error' ? 'text-coral' : 'text-accent-text')}>
          {status.text}
        </p>
      )}
      <Button type="submit" disabled={save.isPending} className="h-[30px] w-fit min-w-[93px] rounded-[3px] px-6 text-xs font-bold">
        {save.isPending ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  )
}

export function ProfilePage() {
  useDocumentTitle('Meu perfil')
  const { user } = useSession()
  const profile = useProfile()
  return (
    <section aria-labelledby="profile-title" className="flex flex-col gap-6">
      <h1 id="profile-title" className="text-body font-bold text-cream">
        Perfil do colecionador
      </h1>
      {profile.data ? (
        <ProfileForm key={user?.id} profile={profile.data} />
      ) : profile.isError ? (
        <div role="alert" className="flex flex-col items-start gap-3 text-sm text-coral">
          Não foi possível carregar o perfil.
          <Button onClick={() => void profile.refetch()} className="rounded-[3px] font-bold">
            Tentar de novo
          </Button>
        </div>
      ) : (
        <Skeleton role="status" aria-label="Carregando perfil" className="h-[420px] w-full" />
      )}
    </section>
  )
}
