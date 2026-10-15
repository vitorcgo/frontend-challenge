import type { EditionId, IsoDateTime, Network, Order, Quote, Wallet } from '@/api/contracts'
import { buildNftFixtures, type NftRecord } from './fixtures/nfts'
import { DEMO_PASSWORD, FIXTURES_CREATED_AT, USER_FIXTURES } from './fixtures/users'
import { hashPassword, type PasswordHash } from './passwords'

export interface UserRecord {
  id: string
  username: string
  displayName: string
  email: string
  ensName: string
  walletNickname: string
  avatarUrl: string | null
  password: PasswordHash
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export interface SessionRecord {
  token: string
  userId: string
  createdAt: IsoDateTime
  expiresAt: IsoDateTime
}

export interface WalletRecord extends Wallet {
  userId: string
}

export interface ConnectionRecord {
  sessionToken: string
  walletId: string
  network: Network
  connectedAt: IsoDateTime
}

export interface CartItemRecord {
  id: string
  nftId: string
  editionId: EditionId
  quantity: number
  addedPrice: string
}

export interface CartRecord {
  items: CartItemRecord[]
  couponCode: string | null
  updatedAt: IsoDateTime
}

export interface QuoteRecord extends Quote {
  userId: string
  /** Versão de cada NFT na cotação: se mudar, o pedido é recusado e pede nova confirmação. */
  versions: Record<string, number>
}

export interface OrderRecord extends Order {
  userId: string
  quoteId: string
  idempotencyKey: string
  settleAt: IsoDateTime
  outcome: 'confirmed' | 'rejected'
}

export interface MockDatabase {
  schemaVersion: number
  users: UserRecord[]
  sessions: SessionRecord[]
  nfts: NftRecord[]
  favorites: Record<string, string[]>
  wallets: WalletRecord[]
  connections: ConnectionRecord[]
  /** Chave `user:<id>` para quem entrou na conta e `guest:<id>` para visitante. */
  carts: Record<string, CartRecord>
  quotes: QuoteRecord[]
  orders: OrderRecord[]
}

// Mudou a forma do banco? Incremente para descartar dados antigos salvos no navegador.
const SCHEMA_VERSION = 5
const STORAGE_KEY = 'kurio.mocks.db'

let state: MockDatabase | null = null

async function seed(): Promise<MockDatabase> {
  const users = await Promise.all(
    USER_FIXTURES.map(
      async (fixture): Promise<UserRecord> => ({
        id: fixture.id,
        username: fixture.username,
        displayName: fixture.displayName,
        email: fixture.email,
        ensName: fixture.ensName,
        walletNickname: fixture.walletNickname,
        avatarUrl: null,
        password: await hashPassword(DEMO_PASSWORD),
        createdAt: FIXTURES_CREATED_AT,
        updatedAt: FIXTURES_CREATED_AT,
      }),
    ),
  )

  return {
    schemaVersion: SCHEMA_VERSION,
    users,
    sessions: [],
    nfts: buildNftFixtures(),
    favorites: Object.fromEntries(USER_FIXTURES.map((fixture) => [fixture.id, [...fixture.favorites]])),
    wallets: USER_FIXTURES.flatMap((fixture) =>
      fixture.wallets.map((wallet) => ({
        ...wallet,
        userId: fixture.id,
        createdAt: FIXTURES_CREATED_AT,
        updatedAt: FIXTURES_CREATED_AT,
      })),
    ),
    connections: [],
    carts: {},
    quotes: [],
    orders: [],
  }
}

function load(): MockDatabase | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as MockDatabase
    return parsed.schemaVersion === SCHEMA_VERSION ? parsed : null
  } catch {
    return null
  }
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Sem armazenamento (aba anônima, cota cheia): o banco segue só em memória.
  }
}

let syncing = false

// Cada aba tem a própria cópia em memória: sem isso, uma aba aberta antes do login
// não conhece a sessão nova, responde 401 e apaga o token compartilhado das duas.
function syncAcrossTabs(): void {
  if (syncing) return
  syncing = true
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return
    try {
      const parsed = JSON.parse(event.newValue) as MockDatabase
      if (parsed.schemaVersion === SCHEMA_VERSION) state = parsed
    } catch {
      // Valor inválido gravado por outra versão: mantém a cópia atual.
    }
  })
}

export async function initDatabase(): Promise<void> {
  state = load() ?? (await seed())
  persist()
  syncAcrossTabs()
}

export async function resetDatabase(): Promise<void> {
  state = await seed()
  persist()
  syncAcrossTabs()
}

function current(): MockDatabase {
  if (!state) throw new Error('Mock database used before initDatabase()')
  return state
}

export function read<T>(selector: (db: Readonly<MockDatabase>) => T): T {
  return selector(current())
}

export function write<T>(mutation: (db: MockDatabase) => T): T {
  const result = mutation(current())
  persist()
  return result
}
