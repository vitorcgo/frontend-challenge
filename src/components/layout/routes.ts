/** Rotas das telas do enunciado. As que ainda não existem levam à página de "não encontrado". */
export const paths = {
  home: '/',
  login: '/entrar',
  cart: '/carrinho',
  profile: '/perfil',
} as const

const MARKET_PREFIXES = ['/nft/', '/carrinho', '/pagamento', '/pedido/']

/** No Figma, "Mercado" fica ativo nas telas do fluxo de compra e "Início" nas demais. */
export function isMarketPath(pathname: string): boolean {
  return MARKET_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}
