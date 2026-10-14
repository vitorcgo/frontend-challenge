import { http, HttpResponse } from 'msw'
import {
  walletConnectSchema,
  walletCreateSchema,
  walletInputSchema,
  type Wallet,
  type WalletConnection,
  type WalletsResponse,
} from '@/api/contracts'
import { read, write, type WalletRecord } from '../db'
import { ApiFailure, API, newId, noContent, notFound, nowIso, param, readJson, requireSession, route } from '../http'
import { toWallet } from '../mappers'
import { getScenario } from '../scenarios'

function walletsOf(userId: string, sessionToken: string): WalletsResponse {
  return read((db) => {
    const own = db.wallets.filter((wallet) => wallet.userId === userId)
    const primary = own.find((wallet) => wallet.slot === 'primary')
    const secondary = own.find((wallet) => wallet.slot === 'secondary')
    const connection = db.connections.find((item) => item.sessionToken === sessionToken)
    return {
      primary: primary ? toWallet(primary) : null,
      secondary: secondary ? toWallet(secondary) : null,
      connection: connection
        ? { walletId: connection.walletId, network: connection.network, connectedAt: connection.connectedAt }
        : null,
    }
  })
}

function ownWallet(userId: string, walletId: string): WalletRecord {
  const wallet = read((db) => db.wallets.find((item) => item.id === walletId))
  if (!wallet) throw notFound('Carteira não encontrada.')
  if (wallet.userId !== userId) {
    throw new ApiFailure(403, 'FORBIDDEN', 'Você não tem permissão para acessar esta carteira.')
  }
  return wallet
}

export const walletHandlers = [
  http.get(
    `${API}/wallets`,
    route(({ request }) => {
      const { user, session } = requireSession(request)
      return HttpResponse.json<WalletsResponse>(walletsOf(user.id, session.token))
    }),
  ),

  http.post(
    `${API}/wallets`,
    route(async ({ request }) => {
      const { user } = requireSession(request)
      const input = await readJson(request, walletCreateSchema)
      if (read((db) => db.wallets.some((item) => item.userId === user.id && item.slot === input.slot))) {
        throw new ApiFailure(409, 'CONFLICT', 'Você já tem uma carteira cadastrada nesta posição. Edite a existente.')
      }
      const now = nowIso()
      const wallet: WalletRecord = { ...input, id: newId('wal'), userId: user.id, createdAt: now, updatedAt: now }
      write((db) => db.wallets.push(wallet))
      return HttpResponse.json<Wallet>(toWallet(wallet), { status: 201 })
    }),
  ),

  http.put(
    `${API}/wallets/:id`,
    route(async ({ request, params }) => {
      const { user } = requireSession(request)
      const existing = ownWallet(user.id, param(params, 'id'))
      const input = await readJson(request, walletInputSchema)
      const updated = write((db) => {
        const wallet = db.wallets.find((item) => item.id === existing.id)!
        Object.assign(wallet, input, { updatedAt: nowIso() })
        return wallet
      })
      return HttpResponse.json<Wallet>(toWallet(updated))
    }),
  ),

  http.post(
    `${API}/wallets/:id/connection`,
    route(async ({ request, params }) => {
      const { user, session } = requireSession(request)
      const wallet = ownWallet(user.id, param(params, 'id'))
      const { network } = await readJson(request, walletConnectSchema)
      if (getScenario() === 'wallet-rejected') {
        throw new ApiFailure(403, 'WALLET_REJECTED', 'A conexão foi recusada na carteira. Tente novamente.')
      }
      const connection: WalletConnection = { walletId: wallet.id, network, connectedAt: nowIso() }
      write((db) => {
        db.connections = db.connections.filter((item) => item.sessionToken !== session.token)
        db.connections.push({ ...connection, sessionToken: session.token })
      })
      return HttpResponse.json<WalletConnection>(connection)
    }),
  ),

  http.delete(
    `${API}/wallets/:id/connection`,
    route(({ request, params }) => {
      const { user, session } = requireSession(request)
      const wallet = ownWallet(user.id, param(params, 'id'))
      write((db) => {
        db.connections = db.connections.filter(
          (item) => !(item.sessionToken === session.token && item.walletId === wallet.id),
        )
      })
      return noContent()
    }),
  ),
]
