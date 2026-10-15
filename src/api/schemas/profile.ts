import { z } from 'zod'
import { MAX_AVATAR_BYTES, type AvatarUpdate, type PasswordChange, type ProfileUpdate } from '../contracts'
import { emailSchema, passwordSchema, usernameSchema } from './auth'

export const ensNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{3,40}$/, 'Use de 3 a 40 letras, números ou hífen, sem o ".eth".')

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(2, 'Use pelo menos 2 caracteres.').max(40, 'Use no máximo 40 caracteres.'),
  username: usernameSchema,
  email: emailSchema,
  ensName: ensNameSchema,
  walletNickname: z.string().trim().min(2, 'Use pelo menos 2 caracteres.').max(40, 'Use no máximo 40 caracteres.'),
}) satisfies z.ZodType<ProfileUpdate>

export const avatarUpdateSchema = z.object({
  dataUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, 'Envie uma imagem PNG, JPEG ou WebP.')
    .refine((value) => (value.length * 3) / 4 <= MAX_AVATAR_BYTES, 'A imagem pode ter no máximo 200 KB.'),
}) satisfies z.ZodType<AvatarUpdate>

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ['newPassword'],
    message: 'A nova senha precisa ser diferente da atual.',
  }) satisfies z.ZodType<PasswordChange>
