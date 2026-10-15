import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, type ReactNode } from 'react'
import { Icon, type IconName } from '@/components/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { useLogout, useSession } from '@/features/auth/session'
import { cn } from '@/lib/utils'

const SOON: Array<{ icon: IconName; label: string }> = [
  { icon: 'shopping', label: 'Atividade' },
  { icon: 'heart', label: 'Lista de interesse' },
  { icon: 'activity', label: 'Ofertas' },
  { icon: 'download', label: 'Arquivos baixados' },
  { icon: 'danger-triangle', label: 'Suporte' },
]

const itemClass = 'flex h-8 items-center gap-2 border-l-4 px-3 text-sm whitespace-nowrap'

function NavLink({ to, icon, label }: { to: '/perfil' | '/carteiras'; icon: IconName; label: string }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const current = pathname === to
  return (
    <li>
      <Link
        to={to}
        aria-current={current ? 'page' : undefined}
        className={cn(itemClass, 'rounded-r-sm text-accent-text hover:text-cream', current ? 'border-brand' : 'border-transparent')}
      >
        <Icon name={icon} />
        {label}
      </Link>
    </li>
  )
}

/** Navegação de "Meu perfil" e proteção da sessão: se ela acabar aqui, volta ao login e retorna a esta tela. */
export function AccountLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { user, isLoading } = useSession()
  const logout = useLogout()

  useEffect(() => {
    if (!isLoading && !user && !logout.isPending && !logout.isSuccess) {
      void navigate({ to: '/entrar', search: { redirect: pathname }, replace: true })
    }
  }, [isLoading, user, logout.isPending, logout.isSuccess, navigate, pathname])

  const signOut = () => logout.mutate(undefined, { onSettled: () => void navigate({ to: '/' }) })

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 pt-8 pb-12 lg:flex-row lg:gap-7 xl:px-0">
      <nav aria-labelledby="account-nav-title" className="flex shrink-0 flex-col bg-surface-card py-3 lg:w-[306px] lg:self-start">
        <h2 id="account-nav-title" className="px-3 pb-2 text-base font-bold text-cream">
          Meu perfil
        </h2>
        <ul className="flex flex-col gap-1">
          <NavLink to="/perfil" icon="user" label="Dados do perfil" />
          <NavLink to="/carteiras" icon="location" label="Carteiras" />
          {SOON.map((item) => (
            <li key={item.label} className="hidden lg:block">
              <span aria-disabled="true" title="Disponível em breve" className={cn(itemClass, 'border-transparent text-subtle-text/70')}>
                <Icon name={item.icon} />
                {item.label}
                <span className="sr-only"> (disponível em breve)</span>
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={signOut}
          disabled={logout.isPending}
          className={cn(itemClass, 'mt-2 border-t border-l-transparent border-t-line pt-3 font-bold text-accent-text hover:text-cream')}
        >
          <Icon name="logout" />
          Sair
        </button>
      </nav>
      <div className="min-w-0 flex-1">
        {user ? children : <Skeleton role="status" aria-label="Carregando" className="h-[420px] w-full" />}
      </div>
    </div>
  )
}
