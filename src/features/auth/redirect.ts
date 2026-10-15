export interface AuthSearch {
  redirect?: string
}

const AUTH_PATHS = ['/entrar', '/cadastro']

/** Só caminhos internos: "//site.com", "/\site.com" ou "https://..." viraria redirecionamento aberto para fora do app. */
export function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return undefined
  // O navegador lê "\" como "/", e caracteres de controle podem esconder um "//".
  if ([...value].some((char) => char === '\\' || char.charCodeAt(0) < 32)) return undefined
  if (AUTH_PATHS.some((path) => value === path || value.startsWith(`${path}?`))) return undefined
  return value
}

export function validateAuthSearch(search: Record<string, unknown>): AuthSearch {
  // Sempre devolve a chave: o roteador junta a busca da rota raiz (não validada) com esta, e um
  // `redirect` inválido omitido aqui voltaria pela junção.
  return { redirect: safeRedirect(search.redirect) }
}
