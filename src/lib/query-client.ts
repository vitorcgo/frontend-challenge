import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/api/errors'

const MAX_RETRIES = 2

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Só repete falhas temporárias (rede, timeout, 5xx). Erro 4xx não muda numa nova tentativa.
      retry: (failureCount, error) => failureCount < MAX_RETRIES && isApiError(error) && error.isTransient,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Sem retry automático: repetir pedido depende da chave de idempotência.
      retry: false,
    },
  },
})
