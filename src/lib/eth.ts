/**
 * Valores em ETH trafegam como strings decimais ("1.19") e são calculados em wei (bigint),
 * para nunca perder precisão com ponto flutuante.
 */

const DECIMALS = 18
const WEI_PER_ETH = 10n ** BigInt(DECIMALS)
const ETH_PATTERN = /^\d+(\.\d{1,18})?$/

export type EthAmount = string

export function isEthAmount(value: string): boolean {
  return ETH_PATTERN.test(value)
}

export function toWei(value: EthAmount): bigint {
  if (!isEthAmount(value)) throw new Error(`Invalid ETH amount: "${value}"`)
  const [whole = '0', fraction = ''] = value.split('.')
  return BigInt(whole) * WEI_PER_ETH + BigInt(fraction.padEnd(DECIMALS, '0'))
}

export function fromWei(wei: bigint): EthAmount {
  if (wei < 0n) throw new Error('Negative ETH amounts are not supported')
  const whole = wei / WEI_PER_ETH
  const fraction = (wei % WEI_PER_ETH).toString().padStart(DECIMALS, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole.toString()
}

export function addEth(...values: EthAmount[]): EthAmount {
  return fromWei(values.reduce((sum, value) => sum + toWei(value), 0n))
}

export function subtractEth(value: EthAmount, amount: EthAmount): EthAmount {
  const result = toWei(value) - toWei(amount)
  return fromWei(result > 0n ? result : 0n)
}

export function multiplyEth(value: EthAmount, quantity: number): EthAmount {
  if (!Number.isInteger(quantity) || quantity < 0) throw new Error(`Invalid quantity: ${quantity}`)
  return fromWei(toWei(value) * BigInt(quantity))
}

/** Percentual inteiro (ex.: 10 para 10%), arredondado para baixo em wei. */
export function percentOfEth(value: EthAmount, percent: number): EthAmount {
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) throw new Error(`Invalid percent: ${percent}`)
  return fromWei((toWei(value) * BigInt(percent)) / 100n)
}

export function compareEth(a: EthAmount, b: EthAmount): -1 | 0 | 1 {
  const diff = toWei(a) - toWei(b)
  return diff === 0n ? 0 : diff > 0n ? 1 : -1
}

export function minEth(a: EthAmount, b: EthAmount): EthAmount {
  return compareEth(a, b) <= 0 ? a : b
}
