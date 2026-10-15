import type { RequestHandler, WebSocketHandler } from 'msw'
import { realtimeHandler } from '../realtime'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { checkoutHandlers } from './checkout'
import { controlHandlers } from './control'
import { favoriteHandlers } from './favorites'
import { nftHandlers } from './nfts'
import { profileHandlers } from './profile'
import { walletHandlers } from './wallets'

export const handlers: Array<RequestHandler | WebSocketHandler> = [
  ...controlHandlers,
  ...authHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...checkoutHandlers,
  ...profileHandlers,
  ...walletHandlers,
  realtimeHandler,
]
