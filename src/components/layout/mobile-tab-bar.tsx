import { Link, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import notch from '@/assets/decorations/tab-bar-notch.svg'
import { Icon, type IconName } from '@/components/icon'
import { cn } from '@/lib/utils'
import { paths } from './routes'
import { EXACT_PATH } from '@/lib/link-options'

const itemClass =
  'absolute top-[59px] flex size-11 -translate-x-1/2 flex-col items-center justify-center gap-1 rounded-full'

/** Ponto sob o item ativo: o estado não depende só da cor (§8 do enunciado). */
const ActiveDot = ({ active }: { active: boolean }) => (
  <span aria-hidden className={cn('size-1 rounded-full', active ? 'bg-accent-text' : 'bg-transparent')} />
)

function TabItem({ icon, label, href, active, left }: { icon: IconName; label: string; href: string; active: boolean; left: string }) {
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
  // Rotas que ainda não existem usam <a>; viram Link tipado quando a tela for criada.
  return href === paths.home ? (
    <Link to="/" activeOptions={EXACT_PATH} {...props}>
      {content}
    </Link>
  ) : (
    <a href={href} {...props}>
      {content}
    </a>
  )
}

/** Navegação do mobile (Figma "Tab Bar"). Telas a partir de 768 px usam o cabeçalho. */
export function MobileTabBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-40 h-[126px] md:hidden">
      {/* A curva central é o trecho original do Figma; as laterais esticam para qualquer largura. */}
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

      <TabItem icon="home" label="Início" href={paths.home} active={pathname === paths.home} left="11.1%" />
      <span
        role="button"
        aria-disabled="true"
        title="Disponível em breve"
        className={cn(itemClass, 'text-subtle-text')}
        style={{ left: '28.5%' }}
      >
        <Icon name="heart-filled" label="Lista de interesse (disponível em breve)" />
      </span>
      <TabItem icon="shop" label="Carrinho" href={paths.cart} active={pathname.startsWith(paths.cart)} left="72.95%" />
      <TabItem
        icon="user-nav"
        label="Perfil"
        href={paths.profile}
        active={pathname.startsWith(paths.profile) || pathname.startsWith(paths.login)}
        left="87.9%"
      />
    </nav>
  )
}
