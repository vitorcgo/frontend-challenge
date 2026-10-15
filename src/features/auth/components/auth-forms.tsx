import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { loginRequestSchema, registerRequestSchema } from '@/api/schemas'
import { announce } from '@/lib/announce'
import { cn } from '@/lib/utils'
import { focusFirstError, fromApi, fromZod, type FormErrors } from '../form-errors'
import { useLogin, useRegister } from '../session'
import { AuthField, PasswordField } from './auth-field'

const submitClass =
  'h-[60px] w-full rounded-[10px] bg-brand md:h-[45px] md:rounded-[5px] text-base leading-4 font-bold text-ink transition-opacity hover:bg-brand/90 disabled:opacity-60'

function FormAlert({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-[5px] border border-coral/60 px-4 py-3 text-sm leading-5 text-coral">
      {message}
    </p>
  )
}

interface FormProps {
  onSuccess: (name: string) => void
  beforeSubmit?: ReactNode
  className?: string
}

const LOGIN_FIELDS = ['email', 'password'] as const
type LoginField = (typeof LOGIN_FIELDS)[number]

export function LoginForm({ onSuccess, beforeSubmit, className }: FormProps) {
  const login = useLogin()
  const formRef = useRef<HTMLFormElement>(null)
  const [values, setValues] = useState<Record<LoginField, string>>({ email: '', password: '' })
  const [errors, setErrors] = useState<FormErrors<LoginField>>({})
  const [formError, setFormError] = useState<string>()

  const change = (field: LoginField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setFormError(undefined)
    const parsed = loginRequestSchema.safeParse(values)
    if (!parsed.success) {
      const next = fromZod<LoginField>(parsed.error)
      setErrors(next)
      focusFirstError(formRef.current, LOGIN_FIELDS, next)
      return
    }
    login.mutate(parsed.data, {
      onSuccess: (session) => onSuccess(session.user.displayName),
      onError: (error) => {
        const result = fromApi(error, LOGIN_FIELDS)
        setErrors(result.fields)
        setFormError(result.message)
        focusFirstError(formRef.current, LOGIN_FIELDS, result.fields)
        if (result.message) announce(result.message)
      },
    })
  }

  return (
    <form ref={formRef} noValidate onSubmit={submit} className={cn('flex flex-col gap-3', className)}>
      <FormAlert message={formError} />
      <AuthField
        name="email"
        type="email"
        autoComplete="email"
        label="E-mail"
        placeholder="contato@email.com"
        value={values.email}
        error={errors.email}
        onChange={(event) => change('email', event.target.value)}
      />
      <PasswordField
        name="password"
        autoComplete="current-password"
        label="Senha"
        value={values.password}
        error={errors.password}
        onChange={(event) => change('password', event.target.value)}
      />
      {beforeSubmit}
      <button type="submit" disabled={login.isPending} className={cn(submitClass, 'mt-6')}>
        {login.isPending ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}

const REGISTER_FIELDS = ['username', 'email', 'password', 'confirmPassword'] as const
type RegisterField = (typeof REGISTER_FIELDS)[number]

export function RegisterForm({ onSuccess, submitLabel, className }: FormProps & { submitLabel: string }) {
  const register = useRegister()
  const formRef = useRef<HTMLFormElement>(null)
  const [values, setValues] = useState<Record<RegisterField, string>>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FormErrors<RegisterField>>({})
  const [formError, setFormError] = useState<string>()

  const change = (field: RegisterField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setFormError(undefined)
    const parsed = registerRequestSchema.safeParse(values)
    const next: FormErrors<RegisterField> = parsed.success ? {} : fromZod<RegisterField>(parsed.error)
    if (!values.confirmPassword) next.confirmPassword = 'Confirme a senha.'
    else if (values.confirmPassword !== values.password) next.confirmPassword = 'As senhas não conferem.'
    if (!parsed.success || next.confirmPassword) {
      setErrors(next)
      focusFirstError(formRef.current, REGISTER_FIELDS, next)
      return
    }
    register.mutate(parsed.data, {
      onSuccess: (session) => onSuccess(session.user.displayName),
      onError: (error) => {
        const result = fromApi(error, REGISTER_FIELDS)
        setErrors(result.fields)
        setFormError(result.message)
        focusFirstError(formRef.current, REGISTER_FIELDS, result.fields)
        if (result.message) announce(result.message)
      },
    })
  }

  return (
    <form ref={formRef} noValidate onSubmit={submit} className={cn('flex flex-col gap-3', className)}>
      <FormAlert message={formError} />
      <AuthField
        name="username"
        autoComplete="username"
        label="Nome de usuário"
        value={values.username}
        error={errors.username}
        onChange={(event) => change('username', event.target.value)}
      />
      <AuthField
        name="email"
        type="email"
        autoComplete="email"
        label="Digite seu e-mail"
        value={values.email}
        error={errors.email}
        onChange={(event) => change('email', event.target.value)}
      />
      <PasswordField
        name="password"
        autoComplete="new-password"
        label="Senha"
        value={values.password}
        error={errors.password}
        onChange={(event) => change('password', event.target.value)}
      />
      <PasswordField
        name="confirmPassword"
        autoComplete="new-password"
        label="Confirmar senha"
        value={values.confirmPassword}
        error={errors.confirmPassword}
        onChange={(event) => change('confirmPassword', event.target.value)}
      />
      <button type="submit" disabled={register.isPending} className={cn(submitClass, 'mt-6')}>
        {register.isPending ? 'Criando...' : submitLabel}
      </button>
    </form>
  )
}
