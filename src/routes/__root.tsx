import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, Outlet, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { hasMobileBuyBar } from '@/components/layout/routes'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { NotFound } from '@/components/not-found'
import { cn } from '@/lib/utils'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-sm bg-brand px-4 py-2 font-bold text-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      {/* Espaço inferior no mobile para o conteúdo não ficar atrás da barra fixa (navegação ou compra). */}
      <main
        id="conteudo"
        tabIndex={-1}
        className={cn('flex-1 outline-none md:pb-0', hasMobileBuyBar(pathname) ? 'pb-[190px]' : 'pb-[140px]')}
      >
        <Outlet />
      </main>
      <SiteFooter />
      <MobileTabBar />
      <ReactQueryDevtools buttonPosition="bottom-left" />
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  )
}
