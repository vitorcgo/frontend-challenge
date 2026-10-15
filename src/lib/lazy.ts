import { lazy, type ComponentType } from 'react'

/**
 * `React.lazy` com pré-carga: o componente sai do carregamento inicial, e `preload()` (ao passar o mouse ou focar
 * o botão que o abre) baixa o código antes do clique.
 */
export function lazyWithPreload<P extends object>(factory: () => Promise<{ default: ComponentType<P> }>) {
  let promise: Promise<{ default: ComponentType<P> }> | undefined
  const load = () => (promise ??= factory())
  return Object.assign(lazy(load), { preload: () => void load() })
}
