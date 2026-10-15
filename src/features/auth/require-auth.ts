import { redirect, type ParsedLocation } from '@tanstack/react-router'
import { getSessionToken } from '@/api/session-token'
import { safeRedirect } from './redirect'

/** Para o `beforeLoad` das rotas privadas: sem sessão, vai ao login e volta para cá depois. */
export function requireAuth({ location }: { location: ParsedLocation }) {
  if (!getSessionToken()) {
    throw redirect({ to: '/entrar', search: { redirect: safeRedirect(location.href) } })
  }
}
