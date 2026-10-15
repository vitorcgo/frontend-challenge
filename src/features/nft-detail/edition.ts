import type { EditionId, Nft, NftEdition } from '@/api/contracts'

export const isEditionAvailable = (edition: NftEdition) => edition.available > 0

/** A edição escolhida vale se ainda tiver unidades; senão, a primeira disponível. Sem nenhuma, o NFT está esgotado. */
export function pickEdition(nft: Nft, requested: EditionId | undefined): NftEdition | undefined {
  const wanted = nft.editions.find((edition) => edition.id === requested)
  if (wanted && isEditionAvailable(wanted)) return wanted
  return nft.editions.find(isEditionAvailable)
}

/** Quantidade máxima: o que resta na edição, limitado pelo máximo por pedido. */
export function maxQuantity(nft: Nft, edition: NftEdition | undefined): number {
  return edition ? Math.min(edition.available, nft.maxPerOrder) : 0
}
