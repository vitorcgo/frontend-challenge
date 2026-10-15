import { delay, HttpResponse } from 'msw'
import type { ApiErrorBody, ApiErrorCode } from '@/api/contracts'
import { getScenario } from './scenarios'

const failedOnce = new Set<string>()

/** Hash estável (FNV-1a): a mesma URL sempre recebe a mesma latência. */
function hash(text: string): number {
  let value = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i)
    value = Math.imul(value, 0x01000193)
  }
  return value >>> 0
}

function latencyFor(request: Request): number {
  const url = new URL(request.url)
  const key = `${request.method} ${url.pathname}${url.search}`
  switch (getScenario()) {
    case 'fast':
      return 0
    case 'slow':
      return 2500
    case 'timeout':
      return 30_000
    case 'variable-latency':
      return 100 + (hash(key) % 1900)
    default:
      return 150 + (hash(key) % 300)
  }
}

function failure(status: number, code: ApiErrorCode, message: string) {
  return HttpResponse.json<ApiErrorBody>({ error: { code, message } }, { status })
}

export function resetNetworkState(): void {
  failedOnce.clear()
}

export async function simulateNetwork(request: Request): Promise<Response | undefined> {
  await delay(latencyFor(request))

  switch (getScenario()) {
    case 'offline':
      return HttpResponse.error()
    case 'server-error':
      return failure(500, 'INTERNAL_ERROR', 'Erro interno no servidor. Tente novamente em instantes.')
    case 'flaky': {
      const key = `${request.method} ${new URL(request.url).pathname}`
      if (failedOnce.has(key)) return undefined
      failedOnce.add(key)
      return failure(503, 'SERVICE_UNAVAILABLE', 'Serviço temporariamente indisponível. Tente novamente.')
    }
    default:
      return undefined
  }
}
