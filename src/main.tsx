import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { env } from '@/config/env'
import { markApiReady } from '@/lib/api-ready'
import { queryClient } from '@/lib/query-client'
import { router } from './router'
import './index.css'

async function enableMocking() {
  if (!env.enableMocks) return
  const { startMocks } = await import('./mocks/browser')
  await startMocks()
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

// Libera a API mesmo se os mocks falharem, para a tela mostrar o erro em vez de esperar para sempre.
enableMocking()
  .catch((error: unknown) => console.error('[mocks] failed to start', error))
  .finally(markApiReady)

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
