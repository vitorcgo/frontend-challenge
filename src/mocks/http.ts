import { HttpResponse } from 'msw'
import type { z } from 'zod'
import type { ApiErrorBody, ApiErrorCode, FieldErrors } from '@/api/contracts'
import { env } from '@/config/env'
import { read, write, type SessionRecord, type UserRecord } from './db'
import { simulateNetwork } from './network'

export const API = env.apiUrl.replace(/\/$/, '')

export class ApiFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly fieldErrors?: FieldErrors,
    readonly details?: unknown,
  ) {
    super(message)
  }
}

export const notFound = (message = 'Recurso não encontrado.') => new ApiFailure(404, 'NOT_FOUND', message)

export function fieldConflict(code: ApiErrorCode, field: string, message: string): ApiFailure {
  return new ApiFailure(409, code, message, { [field]: [message] })
}

function errorResponse(failure: ApiFailure): Response {
  const body: ApiErrorBody = {
    error: {
      code: failure.code,
      message: failure.message,
      ...(failure.fieldErrors && { fieldErrors: failure.fieldErrors }),
      ...(failure.details !== undefined && { details: failure.details }),
    },
  }
  return HttpResponse.json(body, { status: failure.status })
}

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root'
    ;(fieldErrors[key] ??= []).push(issue.message)
  }
  return fieldErrors
}

export function validate<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw new ApiFailure(422, 'VALIDATION_ERROR', 'Revise os campos destacados.', toFieldErrors(result.error))
  }
  return result.data
}

export async function readJson<S extends z.ZodType>(request: Request, schema: S): Promise<z.output<S>> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new ApiFailure(422, 'VALIDATION_ERROR', 'O corpo da requisição precisa ser um JSON válido.')
  }
  return validate(schema, body)
}

export function requireSession(request: Request): { session: SessionRecord; user: UserRecord } {
  const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1]
  if (!token) throw new ApiFailure(401, 'UNAUTHENTICATED', 'Entre na sua conta para continuar.')

  const session = read((db) => db.sessions.find((item) => item.token === token))
  if (!session) throw new ApiFailure(401, 'UNAUTHENTICATED', 'Sua sessão não é mais válida. Entre novamente.')

  if (Date.parse(session.expiresAt) <= Date.now()) {
    write((db) => {
      db.sessions = db.sessions.filter((item) => item.token !== token)
      db.connections = db.connections.filter((item) => item.sessionToken !== token)
    })
    throw new ApiFailure(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente para continuar.')
  }

  const user = read((db) => db.users.find((item) => item.id === session.userId))
  if (!user) throw new ApiFailure(401, 'UNAUTHENTICATED', 'Sua sessão não é mais válida. Entre novamente.')
  return { session, user }
}

export function param(params: Record<string, string | readonly string[] | undefined>, name: string): string {
  const value = params[name]
  return typeof value === 'string' ? value : ''
}

interface RouteInfo {
  request: Request
  params: Record<string, string | readonly string[] | undefined>
}

/** Envolve um handler REST: aplica o cenário de rede e converte falhas no envelope de erro da API. */
export function route(resolver: (info: RouteInfo) => Response | Promise<Response>) {
  return async (info: RouteInfo): Promise<Response> => {
    const simulated = await simulateNetwork(info.request)
    if (simulated) return simulated
    try {
      return await resolver(info)
    } catch (error) {
      if (error instanceof ApiFailure) return errorResponse(error)
      console.error('[mocks] unexpected error', error)
      return errorResponse(new ApiFailure(500, 'INTERNAL_ERROR', 'Erro inesperado no servidor simulado.'))
    }
  }
}

/** Rotas de controle dos testes: sem latência nem falhas simuladas. */
export function controlRoute(resolver: (info: RouteInfo) => Response | Promise<Response>) {
  return async (info: RouteInfo): Promise<Response> => {
    try {
      return await resolver(info)
    } catch (error) {
      if (error instanceof ApiFailure) return errorResponse(error)
      throw error
    }
  }
}

export const noContent = () => new HttpResponse(null, { status: 204 })

export const nowIso = () => new Date().toISOString()

export const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
