import { Link, useRouterState } from '@tanstack/react-router'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { safeRedirect } from '@/features/auth/redirect'
import { useLogout, useSession } from '@/features/auth/session'
import { EXACT_LOCATION, EXACT_PATH } from '@/lib/link-options'
import { cn } from '@/lib/utils'
import { HeaderSearch } from './header-search'
import { isMarketPath, paths } from './routes'

/** `active` é o destaque visual do Figma; `current` marca a página atual para leitores de tela. */
type NavItem = { label: string } & ({ to: '/'; hash?: string; active: boolean; current: boolean } | { to?: undefined })

function NavLink({ item }: { item: NavItem }) {
  const underline = (active: boolean) => (
    <span aria-hidden className={cn('h-[3px] w-full', active ? 'bg-brand' : 'bg-transparent')} />
  )

  // Páginas fora do escopo do desafio: visíveis como no Figma, mas sem fingir que funcionam.
  if (!item.to) {
    return (
      <li className="flex flex-col gap-6">
        <span role="link" aria-disabled="true" title="Disponível em breve" className="text-base whitespace-nowrap text-cream">
          {item.label}
          <span className="sr-only"> (disponível em breve)</span>
        </span>
        {underline(false)}
      </li>
    )
  }

  return (
    <li className="flex flex-col gap-6">
      <Link
        to={item.to}
        hash={item.hash}
        activeOptions={item.hash ? EXACT_LOCATION : EXACT_PATH}
        aria-current={item.current ? 'page' : undefined}
        className={cn(
          'rounded-sm text-base whitespace-nowrap transition-colors hover:text-accent-text',
          item.active ? 'font-bold text-accent-text' : 'text-cream',
        )}
      >
        {item.label}
      </Link>
      {underline(item.active)}
    </li>
  )
}

/** "Entrar" leva ao login e volta para esta tela; logado, o mesmo botão vira "Sair" (o ícone do Figma já é o de saída). */
function AccountActions() {
  const { user, isLoading } = useSession()
  const logout = useLogout()
  const href = useRouterState({ select: (state) => state.location.href })
  const buttonClass = 'h-[35px] w-[100px] gap-1 rounded-lg text-base'

  // Conferindo a sessão salva: reserva o espaço do botão sem mostrar "Entrar" por engano.
  if (isLoading) return <span aria-hidden className="h-[35px] w-[100px]" />

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="max-w-[140px] truncate text-sm text-cream" title={user.displayName}>
          {user.displayName}
        </span>
        <Button onClick={() => logout.mutate()} disabled={logout.isPending} className={buttonClass}>
          <Icon name="logout" />
          Sair
        </Button>
      </div>
    )
  }

  const redirect = safeRedirect(href)
  return (
    <Button asChild className={buttonClass}>
      <Link to="/entrar" search={redirect ? { redirect } : {}}>
        <Icon name="logout" />
        Entrar
      </Link>
    </Button>
  )
}

export function SiteHeader({ cartCount = 0 }: { cartCount?: number }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const market = isMarketPath(pathname)

  const items: NavItem[] = [
    // No Figma, "Início" fica destacado também em Entrar, Criar conta, Perfil e Carteiras.
    { label: 'Início', to: '/', active: !market, current: pathname === paths.home },
    { label: 'Mercado', to: '/', hash: 'mercado', active: market, current: false },
    { label: 'Criadores' },
    { label: 'Aprenda' },
  ]

  return (
    <header className="mx-auto hidden w-full max-w-[1200px] px-6 pt-6 md:block xl:px-0">
      <div className="flex items-start justify-between gap-6">
        <Link to="/" activeOptions={EXACT_PATH} className="mt-2 shrink-0 rounded-sm text-sm font-bold tracking-logo text-cream xl:w-[160px]">
          KURIO
        </Link>

        <nav aria-label="Principal">
          <ul className="flex items-start gap-5 lg:gap-10">
            {items.map((item) => (
              <NavLink key={item.label} item={item} />
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4 xl:gap-7">
          <HeaderSearch />
          <a
            href={paths.cart}
            aria-label={cartCount > 0 ? `Carrinho, ${cartCount} itens` : 'Carrinho'}
            className="relative rounded-sm text-cream transition-colors hover:text-accent-text"
          >
            <Icon name="cart" />
            {cartCount > 0 && (
              <span
                aria-hidden
                className="absolute -top-0.5 left-[13px] grid size-5 place-items-center rounded-full bg-brand text-tiny font-medium text-ink ring-2 ring-ink"
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </a>
          <AccountActions />
        </div>
      </div>
      {/* Linha de 0,3 px do Figma; abaixo de 1 px o navegador não desenha, então 1 px com 30% de opacidade. */}
      <div aria-hidden className={cn('h-px bg-brand/30', market && 'invisible')} />
    </header>
  )
}
