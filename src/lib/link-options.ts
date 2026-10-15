/**
 * O TanStack Router marca `aria-current="page"` em todo link que considera ativo, e por padrão a comparação é
 * frouxa: um link para "/" ficaria "atual" em qualquer página.
 */

export const EXACT_PATH = { exact: true, includeSearch: false } as const

export const EXACT_LOCATION = { exact: true, includeSearch: true, includeHash: true } as const
