import type { EthAmount } from './eth'

/** "1.19" vira "1.19 ETH" e "3.1" vira "3.10 ETH": pelo menos duas casas, como no Figma, sem arredondar. */
export function formatEth(amount: EthAmount): string {
  const [whole = '0', fraction = ''] = amount.split('.')
  return `${whole}.${fraction.padEnd(2, '0')} ETH`
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}
