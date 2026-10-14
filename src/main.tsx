import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { env } from '@/config/env'
import { queryClient } from '@/lib/query-client'
import { router } from './router'
import './index.css'

async function enableMocking() {
  if (!env.enableMocks) return

  const { worker } = await import('./mocks/browser')
  const apiPath = new URL(env.apiUrl, window.location.origin).pathname

  await worker.start({
    // Só avisa sobre chamadas da API sem handler; assets e fontes passam direto.
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith(apiPath)) print.warning()
    },
  })
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

await enableMocking()

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
