import type { z } from 'zod'
import { isApiError } from '@/api/errors'

export type FormErrors<Field extends string> = Partial<Record<Field, string>>

/** Primeira mensagem de cada campo, no formato que os campos exibem. */
export function fromZod<Field extends string>(error: z.ZodError): FormErrors<Field> {
  const errors: FormErrors<Field> = {}
  for (const issue of error.issues) {
    const field = String(issue.path[0]) as Field
    errors[field] ??= issue.message
  }
  return errors
}

/** Erro da API: mensagens por campo (validação, e-mail já cadastrado) e uma mensagem geral para o resto. */
export function fromApi<Field extends string>(
  error: unknown,
  fields: readonly Field[],
): { fields: FormErrors<Field>; message?: string } {
  if (!isApiError(error)) return { fields: {}, message: 'Algo deu errado. Tente novamente.' }
  const fieldErrors: FormErrors<Field> = {}
  for (const field of fields) {
    const messages = error.fieldErrors[field]
    if (messages?.[0]) fieldErrors[field] = messages[0]
  }
  return { fields: fieldErrors, message: Object.keys(fieldErrors).length ? undefined : error.message }
}

/** Leva o foco ao primeiro campo com erro, na ordem do formulário. */
export function focusFirstError<Field extends string>(form: HTMLFormElement | null, fields: readonly Field[], errors: FormErrors<Field>) {
  const first = fields.find((field) => errors[field])
  if (first) form?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus()
}
