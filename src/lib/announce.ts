/**
 * Anúncios para leitores de tela (§8: feedback acessível de mutations e eventos).
 * Um único `role="status"` fica no layout raiz; trocar o texto faz o leitor anunciar.
 */
let message = ''
const listeners = new Set<() => void>()

export function announce(text: string) {
  // Limpa antes para o mesmo texto ser anunciado de novo quando se repete.
  message = ''
  listeners.forEach((listener) => listener())
  setTimeout(() => {
    message = text
    listeners.forEach((listener) => listener())
  }, 50)
}

export function subscribeAnnouncements(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getAnnouncement = () => message
