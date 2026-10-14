export const env = {
  apiUrl: import.meta.env.VITE_API_URL || '/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL || window.location.origin,
  // Não existe backend real, então os mocks ficam ligados a menos que sejam desativados.
  enableMocks: import.meta.env.VITE_ENABLE_MOCKS !== 'false',
} as const
