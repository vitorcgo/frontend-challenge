import type { Network } from '@/api/contracts'

export interface CouponFixture {
  code: string
  percent: number
  description: string
  expiresAt: string
}

export const COUPONS: CouponFixture[] = [
  { code: 'KURIO10', percent: 10, description: 'Desconto do lançamento (10%)', expiresAt: '2027-12-31T23:59:59.000Z' },
  { code: 'COLECIONADOR5', percent: 5, description: 'Desconto de colecionador (5%)', expiresAt: '2027-12-31T23:59:59.000Z' },
  { code: 'VERAO2025', percent: 15, description: 'Promoção de verão (15%)', expiresAt: '2025-03-31T23:59:59.000Z' },
]

/** Taxa estimada cobrada uma vez por rede presente no pedido. */
export const NETWORK_FEES: Record<Network, string> = {
  ethereum: '0.012',
  polygon: '0.002',
  solana: '0.002',
}
