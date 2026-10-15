import { z } from 'zod'
import type { LoginRequest, RegisterRequest } from '../contracts'

export const emailSchema = z.email('Informe um e-mail válido.').trim().toLowerCase()

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Use pelo menos 3 caracteres.')
  .max(30, 'Use no máximo 30 caracteres.')
  .regex(/^[a-z0-9._]+$/, 'Use letras minúsculas, números, ponto ou sublinhado.')

export const passwordSchema = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .max(72, 'A senha pode ter no máximo 72 caracteres.')
  .regex(/[A-Za-z]/, 'A senha precisa ter pelo menos uma letra.')
  .regex(/\d/, 'A senha precisa ter pelo menos um número.')

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha.'),
}) satisfies z.ZodType<LoginRequest>

export const registerRequestSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
}) satisfies z.ZodType<RegisterRequest>
