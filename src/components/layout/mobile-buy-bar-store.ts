import { useEffect, useSyncExternalStore } from 'react'

/**
 * No mobile, a barra de compra do detalhe ocupa o lugar da barra de navegação.
 * A navegação some só enquanto a barra de compra está montada: no carregamento, no erro
 * e no "NFT não encontrado" ela continua lá.
 */
let mounted = 0
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const setMounted = (delta: number) => {
  mounted += delta
  listeners.forEach((listener) => listener())
}

export function useMobileBuyBarActive(): boolean {
  return useSyncExternalStore(subscribe, () => mounted > 0)
}

/** Chamado pela barra de compra enquanto ela está na tela. */
export function useRegisterMobileBuyBar() {
  useEffect(() => {
    setMounted(1)
    return () => setMounted(-1)
  }, [])
}
