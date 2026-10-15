import type { Wallet, WalletInput } from '@/api/contracts'

export const emptyWalletValues = (email = ''): WalletInput => ({
  displayName: '',
  alias: '',
  network: 'ethereum',
  profileName: '',
  address: '',
  secondaryAddress: '',
  walletType: 'metamask',
  referralCode: '',
  email,
  ensName: '',
})

export const walletValues = (wallet: Wallet): WalletInput => ({
  displayName: wallet.displayName,
  alias: wallet.alias,
  network: wallet.network,
  profileName: wallet.profileName,
  address: wallet.address,
  secondaryAddress: wallet.secondaryAddress,
  walletType: wallet.walletType,
  referralCode: wallet.referralCode,
  email: wallet.email,
  ensName: wallet.ensName,
})
