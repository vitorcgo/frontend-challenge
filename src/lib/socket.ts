import { io, type Socket } from 'socket.io-client'
import { env } from '@/config/env'

// Um socket por sessão, para um novo login não herdar as inscrições do usuário anterior.
export function createSocket(): Socket {
  return io(env.socketUrl, {
    // O MSW intercepta WebSocket, mas não o long-polling HTTP do Engine.IO.
    transports: ['websocket'],
    autoConnect: false,
  })
}
