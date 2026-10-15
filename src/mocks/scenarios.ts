export const SCENARIOS = {
  default: 'Sucesso com latência realista (150 a 450 ms).',
  fast: 'Sucesso sem latência, para testes.',
  slow: 'Todas as respostas levam 2,5 s.',
  'variable-latency': 'Latência de 100 ms a 2 s por URL: buscas seguidas podem responder fora de ordem.',
  'empty-catalog': 'O catálogo não tem nenhum NFT.',
  timeout: 'Toda chamada à API leva 30 s, mais que o limite do cliente.',
  offline: 'Sem conexão: toda chamada à API falha na rede.',
  'server-error': 'Toda chamada à API responde 500.',
  flaky: 'A primeira chamada de cada rota responde 503; a nova tentativa funciona.',
  'short-session': 'A sessão expira 60 s depois do login.',
  'wallet-rejected': 'A carteira recusa toda tentativa de conexão.',
  'payment-rejected': 'O pagamento de todo pedido é recusado pela rede.',
  'order-timeout': 'O pedido é criado, mas a resposta só chega depois do limite do cliente (recuperação pela chave de idempotência).',
} as const satisfies Record<string, string>

export type ScenarioId = keyof typeof SCENARIOS

const STORAGE_KEY = 'kurio.mocks.scenario'
const URL_PARAM = 'scenario'

let active: ScenarioId = 'default'

export function isScenarioId(value: unknown): value is ScenarioId {
  return typeof value === 'string' && Object.hasOwn(SCENARIOS, value)
}

export function getScenario(): ScenarioId {
  return active
}

export function setScenario(id: ScenarioId): void {
  active = id
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // Sem armazenamento: o cenário vale só até o próximo refresh.
  }
}

export function initScenario(): void {
  const fromUrl = new URL(window.location.href).searchParams.get(URL_PARAM)
  if (isScenarioId(fromUrl)) {
    setScenario(fromUrl)
    return
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    active = isScenarioId(stored) ? stored : 'default'
  } catch {
    active = 'default'
  }
}
