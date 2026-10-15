import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect, useSyncExternalStore } from 'react'
import type { LoginRequest, RegisterRequest, Session } from '@/api/contracts'
import { getSession, login, logout, register } from '@/api/endpoints/auth'
import { mergeGuestCart } from '@/api/endpoints/cart'
import { clearGuestCartId, peekGuestCartId } from '@/api/guest-cart'
import { cartKeys } from '@/features/cart/keys'
import { getSessionToken, onInvalidSession, setSessionToken, subscribeSessionToken } from '@/api/session-token'
import { announce } from '@/lib/announce'

export const sessionKeys = {
  // O token entra na chave: trocar de usuário nunca reaproveita a sessão em cache do anterior.
  current: (token: string | null) => ['session', token] as const,
}

function useSessionToken() {
  return useSyncExternalStore(subscribeSessionToken, getSessionToken)
}

export function clearPrivateData(queryClient: QueryClient) {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'nfts' })
}

export function useSession() {
  const token = useSessionToken()
  const query = useQuery({
    queryKey: sessionKeys.current(token),
    queryFn: ({ signal }) => getSession(signal),
    enabled: token !== null,
    staleTime: Infinity,
    refetchOnReconnect: 'always',
    refetchOnWindowFocus: (query) => query.state.status === 'error',
  })
  const user = token ? query.data?.user : undefined
  return {
    user,
    expiresAt: token ? query.data?.expiresAt : undefined,
    isLoading: token !== null && query.isPending,
  }
}

async function startSession(queryClient: QueryClient, session: Session) {
  clearPrivateData(queryClient)
  queryClient.setQueryData(sessionKeys.current(session.token), { expiresAt: session.expiresAt, user: session.user })
  setSessionToken(session.token)

  // Itens que a pessoa juntou antes de entrar passam para o carrinho da conta.
  const guestCartId = peekGuestCartId()
  if (!guestCartId) return
  try {
    queryClient.setQueryData(cartKeys.detail(session.user.id), await mergeGuestCart({ guestCartId }))
    clearGuestCartId()
    // Uma leitura do carrinho iniciada antes da união terminaria com os itens antigos.
    void queryClient.invalidateQueries({ queryKey: cartKeys.detail(session.user.id) })
  } catch {
    // Se a união falhar, o carrinho do visitante continua salvo e a próxima entrada tenta de novo.
  }
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginRequest) => login(input),
    onSuccess: (session) => startSession(queryClient, session),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RegisterRequest) => register(input),
    onSuccess: (session) => startSession(queryClient, session),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    // Mesmo se a API falhar, a sessão local termina: sair nunca pode deixar dados de outra pessoa na tela.
    mutationFn: () => logout().catch(() => undefined),
    onSettled: () => {
      setSessionToken(null)
      clearPrivateData(queryClient)
      announce('Você saiu da sua conta.')
    },
  })
}

let expiredNotice = false
const noticeListeners = new Set<() => void>()
const setExpiredNotice = (value: boolean) => {
  expiredNotice = value
  noticeListeners.forEach((listener) => listener())
}

export function useExpiredNotice() {
  const visible = useSyncExternalStore(
    (listener) => {
      noticeListeners.add(listener)
      return () => noticeListeners.delete(listener)
    },
    () => expiredNotice,
  )
  return { visible, dismiss: () => setExpiredNotice(false) }
}

function endSession(queryClient: QueryClient, reason: 'expired' | 'invalid') {
  if (!getSessionToken()) return
  setSessionToken(null)
  clearPrivateData(queryClient)
  if (reason === 'expired') {
    setExpiredNotice(true)
    announce('Sua sessão expirou. Entre novamente para continuar.')
  }
}

export function useSessionLifecycle() {
  const queryClient = useQueryClient()
  const { expiresAt } = useSession()

  useEffect(() => onInvalidSession((reason) => endSession(queryClient, reason)), [queryClient])

  useEffect(() => {
    if (!expiresAt) return
    const timer = setTimeout(() => endSession(queryClient, 'expired'), Math.max(0, Date.parse(expiresAt) - Date.now()))
    return () => clearTimeout(timer)
  }, [expiresAt, queryClient])

  useEffect(() => {
    if (expiresAt) setExpiredNotice(false)
  }, [expiresAt])
}
