import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Icon } from '@/components/icon'
import { safeRedirect } from '@/features/auth/redirect'
import { useSession } from '@/features/auth/session'
import { cn } from '@/lib/utils'
import { useFavoriteStatus, useToggleFavorite } from './use-favorites'

function useFavoriteToggle(nftId: string) {
  const { user, isLoading } = useSession()
  const navigate = useNavigate()
  const href = useRouterState({ select: (state) => state.location.href })
  const favorites = useFavoriteStatus(nftId)
  const toggle = useToggleFavorite()

  const onClick = () => {
    if (!user) {
      void navigate({ to: '/entrar', search: { redirect: safeRedirect(href) } })
      return
    }
    toggle.toggle(nftId)
  }

  // Até a lista chegar não dá para saber se o NFT já é favorito; um clique aí poderia desfavoritar por engano.
  const disabled = isLoading || (Boolean(user) && favorites.isLoading)
  return { active: Boolean(user) && favorites.isFavorite, onClick, disabled, failed: toggle.isError }
}

function FailureMessage({ className }: { className?: string }) {
  return (
    <p role="alert" className={cn('text-caption leading-4 text-coral', className)}>
      Não foi possível atualizar seus favoritos. Tente novamente.
    </p>
  )
}

export function FavoriteButton({ nftId }: { nftId: string }) {
  const { active, onClick, disabled, failed } = useFavoriteToggle(nftId)
  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        aria-pressed={active}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'flex h-10 w-[130px] items-center justify-center gap-2 rounded-md border border-brand text-sm leading-5 font-medium text-accent-text transition-colors hover:bg-brand/10',
          active && 'bg-brand/15',
        )}
      >
        <Icon name={active ? 'heart-filled' : 'heart'} className={active ? 'h-[17.8px] w-5' : undefined} />
        Favoritar
      </button>
      {failed && <FailureMessage className="max-w-[268px] text-right" />}
    </div>
  )
}

export function FavoriteIconButton({ nftId }: { nftId: string }) {
  const { active, onClick, disabled, failed } = useFavoriteToggle(nftId)
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Favoritar"
        aria-pressed={active}
        disabled={disabled}
        onClick={onClick}
        className="grid size-[35px] place-items-center rounded-full border border-line bg-surface-raised text-accent-text"
      >
        <Icon name={active ? 'heart-filled' : 'heart-sm'} className={active ? 'h-[14.2px] w-4' : undefined} />
      </button>
      {failed && <FailureMessage className="absolute top-full right-0 mt-2 w-56 rounded-md bg-surface-card p-2 text-right" />}
    </div>
  )
}
