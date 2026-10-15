import { Link, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import notch from '@/assets/decorations/tab-bar-notch.svg'
import { Icon, type IconName } from '@/components/icon'
import { safeRedirect } from '@/features/auth/redirect'
import { useSession } from '@/features/auth/session'
import { EXACT_PATH } from '@/lib/link-options'
import { cn } from '@/lib/utils'
import { useMobileBuyBarActive } from './mobile-buy-bar-store'
import { paths } from './routes'

const itemClass =
  'absolute top-[59px] flex size-11 -translate-x-1/2 flex-col items-center justify-center gap-1 rounded-full'

const ActiveDot = ({ active }: { active: boolean }) => (
  <span aria-hidden className={cn('size-1 rounded-full', active ? 'bg-accent-text' : 'bg-transparent')} />
)

type TabTarget = { to: '/' } | { to: '/carrinho' } | { to: '/entrar'; redirect?: string } | { href: string }

function TabItem({ icon, label, target, active, left }: { icon: IconName; label: string; target: TabTarget; active: boolean; left: string }) {
  const props = {
    'aria-current': active ? ('page' as const) : undefined,
    className: cn(itemClass, active ? 'text-accent-text' : 'text-subtle-text'),
    style: { left },
  }
  const content: ReactNode = (
    <>
      <span aria-hidden className="size-1" />
      <Icon name={icon} label={label} />
      <ActiveDot active={active} />
    </>
  )
  if ('href' in target) {
    return (
      <a href={target.href} {...props}>
        {content}
      </a>
    )
  }
  if (target.to === '/entrar') {
    return (
      <Link to="/entrar" search={target.redirect ? { redirect: target.redirect } : {}} activeOptions={EXACT_PATH} {...props}>
        {content}
      </Link>
    )
  }
  return (
    <Link to={target.to} activeOptions={EXACT_PATH} {...props}>
      {content}
    </Link>
  )
}

export function MobileTabBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const href = useRouterState({ select: (state) => state.location.href })
  const buyBarActive = useMobileBuyBarActive()
  const { user } = useSession()
  if (buyBarActive) return null

  const profileTarget: TabTarget = user ? { href: paths.profile } : { to: '/entrar', redirect: safeRedirect(href) }
  const onAccountPage = [paths.profile, paths.login, paths.register].some((path) => pathname.startsWith(path))

  return (
    <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-40 h-[126px] md:hidden">
      <div aria-hidden className="absolute inset-x-0 bottom-0 flex h-[95px] drop-shadow-[0_-10px_15px_rgb(10_6_4/0.45)]">
        <div className="flex-1 rounded-tl-[29px] bg-surface-card" />
        <img src={notch} alt="" width={151.7} height={95} className="h-[95px] w-[151.7px] shrink-0" />
        <div className="flex-1 rounded-tr-[29px] bg-surface-card" />
      </div>

      <span
        role="button"
        aria-disabled="true"
        title="Disponível em breve"
        className="absolute top-0 left-1/2 grid size-[65px] -translate-x-1/2 place-items-center rounded-full bg-[linear-gradient(180deg,rgb(210_138_76/0.4)_-17%,#d28a4c_109%)] text-cream"
      >
        <Icon name="scan" label="Escanear NFT (disponível em breve)" />
      </span>

      <TabItem icon="home" label="Início" target={{ to: '/' }} active={pathname === paths.home} left="11.1%" />
      <span
        role="button"
        aria-disabled="true"
        title="Disponível em breve"
        className={cn(itemClass, 'text-subtle-text')}
        style={{ left: '28.5%' }}
      >
        <Icon name="heart-filled" label="Lista de interesse (disponível em breve)" />
      </span>
      <TabItem icon="shop" label="Carrinho" target={{ to: '/carrinho' }} active={pathname.startsWith(paths.cart)} left="72.95%" />
      <TabItem icon="user-nav" label="Perfil" target={profileTarget} active={onAccountPage} left="87.9%" />
    </nav>
  )
}
