import { http, HttpResponse } from 'msw'
import { avatarUpdateSchema, passwordChangeSchema, profileUpdateSchema, type Profile } from '@/api/contracts'
import { read, write, type UserRecord } from '../db'
import { ApiFailure, API, fieldConflict, noContent, nowIso, readJson, requireSession, route } from '../http'
import { toProfile } from '../mappers'
import { hashPassword, verifyPassword } from '../passwords'

function updateUser(userId: string, changes: Partial<UserRecord>): UserRecord {
  return write((db) => {
    const user = db.users.find((item) => item.id === userId)!
    Object.assign(user, changes, { updatedAt: nowIso() })
    return user
  })
}

export const profileHandlers = [
  http.get(
    `${API}/profile`,
    route(({ request }) => {
      const { user } = requireSession(request)
      return HttpResponse.json<Profile>(toProfile(user))
    }),
  ),

  http.put(
    `${API}/profile`,
    route(async ({ request }) => {
      const { user } = requireSession(request)
      const input = await readJson(request, profileUpdateSchema)
      const others = read((db) => db.users.filter((item) => item.id !== user.id))
      if (others.some((item) => item.email === input.email)) {
        throw fieldConflict('EMAIL_TAKEN', 'email', 'Este e-mail já está cadastrado.')
      }
      if (others.some((item) => item.username === input.username)) {
        throw fieldConflict('USERNAME_TAKEN', 'username', 'Este nome de usuário já está em uso.')
      }
      return HttpResponse.json<Profile>(toProfile(updateUser(user.id, input)))
    }),
  ),

  http.put(
    `${API}/profile/avatar`,
    route(async ({ request }) => {
      const { user } = requireSession(request)
      const { dataUrl } = await readJson(request, avatarUpdateSchema)
      return HttpResponse.json<Profile>(toProfile(updateUser(user.id, { avatarUrl: dataUrl })))
    }),
  ),

  http.delete(
    `${API}/profile/avatar`,
    route(({ request }) => {
      const { user } = requireSession(request)
      return HttpResponse.json<Profile>(toProfile(updateUser(user.id, { avatarUrl: null })))
    }),
  ),

  http.put(
    `${API}/profile/password`,
    route(async ({ request }) => {
      const { user, session } = requireSession(request)
      const input = await readJson(request, passwordChangeSchema)
      if (!(await verifyPassword(input.currentPassword, user.password))) {
        throw new ApiFailure(422, 'VALIDATION_ERROR', 'Revise os campos destacados.', {
          currentPassword: ['A senha atual está incorreta.'],
        })
      }
      const password = await hashPassword(input.newPassword)
      updateUser(user.id, { password })
      // Trocar a senha encerra as outras sessões do usuário, mantendo só a atual.
      write((db) => {
        db.sessions = db.sessions.filter((item) => item.userId !== user.id || item.token === session.token)
      })
      return noContent()
    }),
  ),
]
