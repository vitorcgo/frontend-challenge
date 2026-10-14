import type { Wallet } from '@/api/contracts'

/** Credenciais fictícias documentadas no README. */
export const DEMO_PASSWORD = 'Kurio2026!'

export interface UserFixture {
  id: string
  username: string
  displayName: string
  email: string
  ensName: string
  walletNickname: string
  favorites: string[]
  wallets: Array<Omit<Wallet, 'createdAt' | 'updatedAt'>>
}

export const USER_FIXTURES: UserFixture[] = [
  {
    id: 'usr_ana',
    username: 'ana.lima',
    displayName: 'Ana Lima',
    email: 'ana@kurio.dev',
    ensName: 'analima',
    walletNickname: 'Principal',
    favorites: ['emerald-ape-042', 'ivory-baron-088'],
    wallets: [
      {
        id: 'wal_ana_primary',
        slot: 'primary',
        displayName: 'Ana Lima',
        alias: 'Principal',
        network: 'ethereum',
        profileName: 'ana.lima',
        address: '0xA91F3C5D7E9B1A2C4D6E8F0A1B3C5D7E9F1AE82C',
        secondaryAddress: '',
        walletType: 'metamask',
        referralCode: 'KURIO42',
        email: 'ana@kurio.dev',
        ensName: 'analima',
      },
      {
        id: 'wal_ana_secondary',
        slot: 'secondary',
        displayName: 'Ana Lima',
        alias: 'Reserva',
        network: 'polygon',
        profileName: 'ana.lima',
        address: '0x4B7E2D9A1C6F3E8B5A0D7C2F9E4B1A6D3C8F5E20',
        secondaryAddress: 'nova.kurio.eth',
        walletType: 'coinbase',
        referralCode: 'KURIO42',
        email: 'ana@kurio.dev',
        ensName: 'analima',
      },
    ],
  },
  {
    id: 'usr_bruno',
    username: 'bruno.costa',
    displayName: 'Bruno Costa',
    email: 'bruno@kurio.dev',
    ensName: 'brunocosta',
    walletNickname: 'Cofre',
    favorites: [],
    wallets: [
      {
        id: 'wal_bruno_primary',
        slot: 'primary',
        displayName: 'Bruno Costa',
        alias: 'Cofre',
        network: 'ethereum',
        profileName: 'bruno.costa',
        address: '0x9C1E5A3F7B2D8E4C6A0F1B9D3E7C5A2F8B4D6E13',
        secondaryAddress: '',
        walletType: 'walletconnect',
        referralCode: 'BRUNO7',
        email: 'bruno@kurio.dev',
        ensName: 'brunocosta',
      },
    ],
  },
]

export const FIXTURES_CREATED_AT = '2026-09-01T12:00:00.000Z'
