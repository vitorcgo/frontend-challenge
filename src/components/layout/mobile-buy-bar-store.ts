import { useEffect, useSyncExternalStore } from 'react'

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

export function useRegisterMobileBuyBar() {
  useEffect(() => {
    setMounted(1)
    return () => setMounted(-1)
  }, [])
}
