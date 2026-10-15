import { http, HttpResponse } from 'msw'
import type { CurrentSession, Session } from '@/api/contracts'
import { loginRequestSchema, registerRequestSchema } from '@/api/schemas'
import { read, write, type SessionRecord, type UserRecord } from '../db'
import { ApiFailure, API, fieldConflict, newId, noContent, nowIso, readJson, requireSession, route } from '../http'
import { toSessionUser } from '../mappers'
import { hashPassword, verifyPassword } from '../passwords'
import { getScenario } from '../scenarios'

const SESSION_TTL_MS = 2 * 60 * 60 * 1000
const SHORT_SESSION_TTL_MS = 60 * 1000

function openSession(user: UserRecord): Session {
  const ttl = getScenario() === 'short-session' ? SHORT_SESSION_TTL_MS : SESSION_TTL_MS
  const session: SessionRecord = {
    token: crypto.randomUUID(),
    userId: user.id,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + ttl).toISOString(),
  }
  write((db) => db.sessions.push(session))
  return { token: session.token, expiresAt: session.expiresAt, user: toSessionUser(user) }
}

export const authHandlers = [
  http.post(
    `${API}/auth/register`,
    route(async ({ request }) => {
      const input = await readJson(request, registerRequestSchema)
      const existing = read((db) => db.users)
      if (existing.some((user) => user.email === input.email)) {
        throw fieldConflict('EMAIL_TAKEN', 'email', 'Este e-mail já está cadastrado.')
      }
      if (existing.some((user) => user.username === input.username)) {
        throw fieldConflict('USERNAME_TAKEN', 'username', 'Este nome de usuário já está em uso.')
      }

      const now = nowIso()
      const user: UserRecord = {
        id: newId('usr'),
        username: input.username,
        displayName: input.username,
        email: input.email,
        ensName: '',
        walletNickname: '',
        avatarUrl: null,
        password: await hashPassword(input.password),
        createdAt: now,
        updatedAt: now,
      }
      write((db) => {
        db.users.push(user)
        db.favorites[user.id] = []
      })
      return HttpResponse.json<Session>(openSession(user), { status: 201 })
    }),
  ),

  http.post(
    `${API}/auth/login`,
    route(async ({ request }) => {
      const input = await readJson(request, loginRequestSchema)
      const user = read((db) => db.users.find((item) => item.email === input.email))
      // Mesma mensagem para e-mail inexistente e senha errada, para não revelar quais e-mails existem.
      if (!user || !(await verifyPassword(input.password, user.password))) {
        throw new ApiFailure(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
      }
      return HttpResponse.json<Session>(openSession(user))
    }),
  ),

  http.get(
    `${API}/auth/session`,
    route(({ request }) => {
      const { session, user } = requireSession(request)
      return HttpResponse.json<CurrentSession>({ expiresAt: session.expiresAt, user: toSessionUser(user) })
    }),
  ),

  http.post(
    `${API}/auth/logout`,
    route(({ request }) => {
      const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1]
      if (token) {
        write((db) => {
          db.sessions = db.sessions.filter((item) => item.token !== token)
          db.connections = db.connections.filter((item) => item.sessionToken !== token)
        })
      }
      return noContent()
    }),
  ),
]
