import { apiClient } from '../client'
import type { Nft, NftListQuery, NftListResponse } from '../contracts'

export async function listNfts(query: NftListQuery, signal?: AbortSignal): Promise<NftListResponse> {
  const { data } = await apiClient.get<NftListResponse>('/nfts', { params: query, signal })
  return data
}

export async function getNft(id: string, signal?: AbortSignal): Promise<Nft> {
  const { data } = await apiClient.get<Nft>(`/nfts/${encodeURIComponent(id)}`, { signal })
  return data
}
