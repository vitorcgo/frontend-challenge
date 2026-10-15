const STORAGE_KEY = 'kurio.session.token'

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

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
  notify()
}

export function subscribeSessionToken(listener: () => void): () => void {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

type InvalidSessionListener = (reason: 'expired' | 'invalid') => void
const invalidListeners = new Set<InvalidSessionListener>()

export function onInvalidSession(listener: InvalidSessionListener): () => void {
  invalidListeners.add(listener)
  return () => invalidListeners.delete(listener)
}

export function reportInvalidSession(reason: 'expired' | 'invalid'): void {
  invalidListeners.forEach((listener) => listener(reason))
}
