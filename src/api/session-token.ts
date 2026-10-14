// Token da sessão no localStorage para a sessão sobreviver ao refresh (§3 do enunciado).
const STORAGE_KEY = 'kurio.session.token'

export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function setSessionToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Sem armazenamento: a sessão vale só até o refresh.
  }
}
