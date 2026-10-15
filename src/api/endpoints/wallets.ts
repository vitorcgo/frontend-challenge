import { apiClient } from '../client'
import type { Network, Wallet, WalletConnection, WalletCreate, WalletInput, WalletsResponse } from '../contracts'

export async function getWallets(signal?: AbortSignal): Promise<WalletsResponse> {
  const { data } = await apiClient.get<WalletsResponse>('/wallets', { signal })
  return data
}

export async function createWallet(input: WalletCreate): Promise<Wallet> {
  const { data } = await apiClient.post<Wallet>('/wallets', input)
  return data
}

export async function updateWallet(id: string, input: WalletInput): Promise<Wallet> {
  const { data } = await apiClient.put<Wallet>(`/wallets/${encodeURIComponent(id)}`, input)
  return data
}

export async function connectWallet(id: string, network: Network): Promise<WalletConnection> {
  const { data } = await apiClient.post<WalletConnection>(`/wallets/${encodeURIComponent(id)}/connection`, { network })
  return data
}

export async function disconnectWallet(id: string): Promise<void> {
  await apiClient.delete(`/wallets/${encodeURIComponent(id)}/connection`)
}
