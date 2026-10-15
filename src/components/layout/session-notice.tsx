import { Link, useRouterState } from '@tanstack/react-router'
import { useSyncExternalStore } from 'react'
import { Icon } from '@/components/icon'
import { safeRedirect } from '@/features/auth/redirect'
import { useExpiredNotice } from '@/features/auth/session'
import { getAnnouncement, subscribeAnnouncements } from '@/lib/announce'

/** Aviso visível de sessão expirada, com atalho para entrar de novo e voltar a esta tela (§3). */
export function SessionExpiredNotice() {
  const { visible, dismiss } = useExpiredNotice()
  const href = useRouterState({ select: (state) => state.location.href })
  if (!visible) return null
  const redirect = safeRedirect(href)
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 pt-4 xl:px-0">
      <div className="flex items-center justify-between gap-4 rounded-md border border-brand/60 bg-surface-card px-4 py-3 text-sm leading-5 text-cream">
        <p>Sua sessão expirou. Entre novamente para continuar.</p>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            to="/entrar"
            search={redirect ? { redirect } : {}}
            className="rounded-sm font-bold text-accent-text underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
          <button type="button" onClick={dismiss} aria-label="Fechar aviso" className="grid size-8 place-items-center rounded-sm text-subtle-text hover:text-cream">
            <Icon name="close" />
          </button>
        </div>
      </div>
    </div>
  )
}

/** Região única de anúncios para leitores de tela (ver `announce`). */
export function Announcer() {
  const message = useSyncExternalStore(subscribeAnnouncements, getAnnouncement)
  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  )
}
