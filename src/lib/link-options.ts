/**
 * O TanStack Router marca `aria-current="page"` em todo link que considera ativo, e por padrão a comparação é
 * frouxa: um link para "/" ficaria "atual" em qualquer página.
 */

/** Link para uma página: atual só no caminho exato. */
export const EXACT_PATH = { exact: true, includeSearch: false } as const

/** Link que leva a uma seção ou a um filtro (#mercado, ?category=): atual só no endereço idêntico. */
export const EXACT_LOCATION = { exact: true, includeSearch: true, includeHash: true } as const
