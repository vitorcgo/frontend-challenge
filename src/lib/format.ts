import type { EthAmount } from './eth'

export function formatEth(amount: EthAmount): string {
  const [whole = '0', fraction = ''] = amount.split('.')
  return `${whole}.${fraction.padEnd(2, '0')} ETH`
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}
