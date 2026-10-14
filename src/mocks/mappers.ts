import type { Nft, NftSummary, Profile, SessionUser, Wallet } from '@/api/contracts'
import type { UserRecord, WalletRecord } from './db'
import type { NftRecord } from './fixtures/nfts'

export function toNft({ newRelease: _newRelease, trendingScore: _trendingScore, ...nft }: NftRecord): Nft {
  return nft
}

export function toNftSummary(nft: NftRecord): NftSummary {
  return {
    id: nft.id,
    name: nft.name,
    tokenId: nft.tokenId,
    image: nft.image,
    category: nft.category,
    network: nft.network,
    price: nft.price,
    previousPrice: nft.previousPrice,
    rare: nft.rare,
    available: nft.available,
    listedAt: nft.listedAt,
    version: nft.version,
  }
}

export function toSessionUser(user: UserRecord): SessionUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
  }
}

export function toProfile(user: UserRecord): Profile {
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    ensName: user.ensName,
    walletNickname: user.walletNickname,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export function toWallet({ userId: _userId, ...wallet }: WalletRecord): Wallet {
  return wallet
}
