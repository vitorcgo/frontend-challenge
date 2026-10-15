export const paths = {
  home: '/',
  login: '/entrar',
  register: '/cadastro',
  cart: '/carrinho',
  profile: '/perfil',
} as const

const MARKET_PREFIXES = ['/nft/', '/carrinho', '/pagamento', '/pedido/']

export function isMarketPath(pathname: string): boolean {
  return MARKET_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}
