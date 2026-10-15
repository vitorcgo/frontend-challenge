import { lazy, type ComponentType } from 'react'

export function lazyWithPreload<P extends object>(factory: () => Promise<{ default: ComponentType<P> }>) {
  let promise: Promise<{ default: ComponentType<P> }> | undefined
  const load = () => (promise ??= factory())
  return Object.assign(lazy(load), { preload: () => void load() })
}
