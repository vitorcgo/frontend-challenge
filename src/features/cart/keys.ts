export const cartKeys = {
  all: ['cart'] as const,
  detail: (owner: string) => ['cart', owner] as const,
}
