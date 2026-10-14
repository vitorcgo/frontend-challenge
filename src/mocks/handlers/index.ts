import { ws, type RequestHandler, type WebSocketHandler } from 'msw'
import { env } from '@/config/env'
import { authHandlers } from './auth'
import { controlHandlers } from './control'
import { favoriteHandlers } from './favorites'
import { nftHandlers } from './nfts'
import { profileHandlers } from './profile'
import { walletHandlers } from './wallets'

const realtime = ws.link(`${env.socketUrl.replace(/^http/, 'ws')}/socket.io/`)

export const handlers: Array<RequestHandler | WebSocketHandler> = [
  ...controlHandlers,
  ...authHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...profileHandlers,
  ...walletHandlers,
  realtime.addEventListener('connection', () => {}),
]
