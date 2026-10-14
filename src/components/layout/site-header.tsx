import { Link, useRouterState } from '@tanstack/react-router'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isMarketPath, paths } from './routes'

type NavItem = { label: string } & ({ to: '/'; hash?: string; active: boolean } | { to?: undefined })

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
        aria-current={item.active ? 'page' : undefined}
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

export function SiteHeader({ cartCount = 0 }: { cartCount?: number }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const market = isMarketPath(pathname)

  const items: NavItem[] = [
    { label: 'Início', to: '/', active: !market && pathname === paths.home },
    { label: 'Mercado', to: '/', hash: 'mercado', active: market },
    { label: 'Criadores' },
    { label: 'Aprenda' },
  ]

  return (
    <header className="mx-auto hidden w-full max-w-[1200px] px-6 pt-6 md:block xl:px-0">
      <div className="flex items-start justify-between gap-6">
        <Link to="/" className="mt-2 w-[160px] shrink-0 rounded-sm text-sm font-bold tracking-logo text-cream">
          KURIO
        </Link>

        <nav aria-label="Principal">
          <ul className="flex items-start gap-6 lg:gap-10">
            {items.map((item) => (
              <NavLink key={item.label} item={item} />
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-7">
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
          <Button asChild className="h-[35px] w-[100px] gap-1 rounded-lg text-base">
            <a href={paths.login}>
              <Icon name="logout" />
              Entrar
            </a>
          </Button>
        </div>
      </div>
      {/* Linha de 0,3 px do Figma; abaixo de 1 px o navegador não desenha, então 1 px com 30% de opacidade. */}
      <div aria-hidden className={cn('h-px bg-brand/30', market && 'invisible')} />
    </header>
  )
}
