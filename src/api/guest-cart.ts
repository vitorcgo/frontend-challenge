const STORAGE_KEY = 'kurio.cart.guest'

export function getGuestCartId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored
    const id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
    return id
  } catch {
    return 'sem-armazenamento'
  }
}

export function peekGuestCartId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearGuestCartId(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Sem armazenamento, não há o que limpar.
  }
}
