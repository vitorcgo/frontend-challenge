import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { useMobileBuyBarActive } from '@/components/layout/mobile-buy-bar-store'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { Announcer, SessionExpiredNotice } from '@/components/layout/session-notice'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { NotFound } from '@/components/not-found'
import { useSessionLifecycle } from '@/features/auth/session'
import { cn } from '@/lib/utils'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  const buyBarActive = useMobileBuyBarActive()
  useSessionLifecycle()
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-sm bg-brand px-4 py-2 font-bold text-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <SessionExpiredNotice />
      {/* Espaço inferior no mobile para o conteúdo não ficar atrás da barra de navegação; a de compra reserva o próprio espaço. */}
      <main id="conteudo" tabIndex={-1} className={cn('flex-1 outline-none md:pb-0', !buyBarActive && 'pb-[140px]')}>
        <Outlet />
      </main>
      <SiteFooter />
      <MobileTabBar />
      <Announcer />
      <ReactQueryDevtools buttonPosition="bottom-left" />
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  )
}
