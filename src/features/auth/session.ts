import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect, useSyncExternalStore } from 'react'
import type { LoginRequest, RegisterRequest, Session } from '@/api/contracts'
import { getSession, login, logout, register } from '@/api/endpoints/auth'
import { getSessionToken, onInvalidSession, setSessionToken, subscribeSessionToken } from '@/api/session-token'
import { announce } from '@/lib/announce'

export const sessionKeys = {
  // O token entra na chave: trocar de usuário nunca reaproveita a sessão em cache do anterior.
  current: (token: string | null) => ['session', token] as const,
}

function useSessionToken() {
  return useSyncExternalStore(subscribeSessionToken, getSessionToken)
}

/** Dados públicos (catálogo) ficam; tudo que pertence ao usuário sai do cache no logout ou na troca de conta (§3). */
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
  })
  const user = token ? query.data?.user : undefined
  return {
    user,
    expiresAt: token ? query.data?.expiresAt : undefined,
    // Com token salvo e a sessão ainda sendo conferida, a tela não mostra "Entrar" por engano.
    isLoading: token !== null && query.isPending,
  }
}

function startSession(queryClient: QueryClient, session: Session) {
  clearPrivateData(queryClient)
  queryClient.setQueryData(sessionKeys.current(session.token), { expiresAt: session.expiresAt, user: session.user })
  setSessionToken(session.token)
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

/* Aviso de sessão expirada, mostrado no topo da página até a pessoa entrar de novo ou fechar. */
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

/** Encerra a sessão quando ela expira (pelo relógio ou por resposta da API) e limpa os dados privados. */
export function useSessionLifecycle() {
  const queryClient = useQueryClient()
  const { expiresAt } = useSession()

  useEffect(() => onInvalidSession((reason) => endSession(queryClient, reason)), [queryClient])

  useEffect(() => {
    if (!expiresAt) return
    const timer = setTimeout(() => endSession(queryClient, 'expired'), Math.max(0, Date.parse(expiresAt) - Date.now()))
    return () => clearTimeout(timer)
  }, [expiresAt, queryClient])

  // Entrou de novo: o aviso de expiração não faz mais sentido.
  useEffect(() => {
    if (expiresAt) setExpiredNotice(false)
  }, [expiresAt])
}
