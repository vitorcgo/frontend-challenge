import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import { REALTIME_EVENTS, type NftUpdatedEvent, type OrderUpdatedEvent } from '@/api/contracts'
import { env } from '@/config/env'
import { read, type OrderRecord } from './db'
import type { NftRecord } from './fixtures/nfts'
import { newId, nowIso } from './http'

type AnyEvent = NftUpdatedEvent | OrderUpdatedEvent

type SocketIo = ReturnType<typeof toSocketIo>

interface Client {
  io: SocketIo
  close: () => void
  userId: string | null
}

const clients = new Set<Client>()
const history: AnyEvent[] = []

// O binding faz o handshake, mas não manda o ping do Engine.IO; sem ele o cliente desconecta em ~30 s.
const PING_INTERVAL_MS = 20_000

// O MSW tira o "/socket.io/" do caminho antes de comparar: o link é só a origem.
const link = ws.link(new URL(env.socketUrl).origin.replace(/^http/, 'ws'))

export const realtimeHandler = link.addEventListener('connection', (connection) => {
  const io = toSocketIo(connection)
  const client: Client = { io, close: () => connection.client.close(), userId: null }
  clients.add(client)

  const ping = setInterval(() => connection.client.send('2'), PING_INTERVAL_MS)
  connection.client.addEventListener('close', () => {
    clearInterval(ping)
    clients.delete(client)
  })

  io.client.on(REALTIME_EVENTS.sessionJoin, (_event, token: unknown) => {
    const session = read((db) => db.sessions.find((item) => item.token === token))
    client.userId = session && Date.parse(session.expiresAt) > Date.now() ? session.userId : null
  })
})

/** Eventos de pedido vão só para as conexões da pessoa dona do pedido. */
const recipients = new Map<string, string>()

function broadcast(event: AnyEvent) {
  const owner = recipients.get(event.id)
  for (const client of clients) {
    if (!owner || client.userId === owner) client.io.client.emit(event.type, event)
  }
}

export function publishOrderUpdated(order: OrderRecord) {
  const event: OrderUpdatedEvent = {
    id: newId('evt'),
    type: 'order.updated',
    resource: { type: 'order', id: order.id },
    version: order.version,
    occurredAt: nowIso(),
    data: { status: order.status, transactionHash: order.transactionHash, rejectionReason: order.rejectionReason },
  }
  recipients.set(event.id, order.userId)
  history.push(event)
  broadcast(event)
  return event
}

export function publishNftUpdated(nft: NftRecord) {
  const event: NftUpdatedEvent = {
    id: newId('evt'),
    type: 'nft.updated',
    resource: { type: 'nft', id: nft.id },
    version: nft.version,
    occurredAt: nowIso(),
    data: {
      price: nft.price,
      previousPrice: nft.previousPrice,
      available: nft.available,
      editions: nft.editions.map((edition) => ({ ...edition })),
    },
  }
  history.push(event)
  broadcast(event)
  return event
}

/** Reenvia um evento já publicado (repetido ou antigo), para testar a tolerância do cliente. */
export function replayEvent(index: number) {
  const event = history.at(index)
  if (event) broadcast(event)
  return event
}

export function disconnectAll() {
  const count = clients.size
  for (const client of [...clients]) client.close()
  return count
}

export const connectedClients = () => clients.size

export function resetRealtime() {
  history.length = 0
  recipients.clear()
}
