import { setupWorker } from 'msw/browser'
import { env } from '@/config/env'
import { initDatabase, resetDatabase } from './db'
import { handlers } from './handlers'
import { initScenario } from './scenarios'

export async function startMocks(): Promise<void> {
  initScenario()
  // `?mock-reset` na URL restaura os dados iniciais e sai da URL, para o próximo refresh não apagar tudo de novo.
  const url = new URL(window.location.href)
  if (url.searchParams.has('mock-reset')) {
    await resetDatabase()
    url.searchParams.delete('mock-reset')
    window.history.replaceState(window.history.state, '', url)
  } else {
    await initDatabase()
  }

  const apiPath = new URL(env.apiUrl, window.location.origin).pathname
  await setupWorker(...handlers).start({
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith(apiPath)) print.warning()
    },
  })
}
