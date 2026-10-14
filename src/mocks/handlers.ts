import { ws, type RequestHandler, type WebSocketHandler } from 'msw'
import { env } from '@/config/env'

const realtime = ws.link(`${env.socketUrl.replace(/^http/, 'ws')}/socket.io/`)

export const handlers: Array<RequestHandler | WebSocketHandler> = [
  realtime.addEventListener('connection', () => {}),
]
