// Mesmo simulado, a senha nunca é guardada em texto puro: PBKDF2 com sal aleatório.
const ITERATIONS = 100_000

function toHex(buffer: ArrayBuffer | Uint8Array): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(hex.match(/.{2}/g)!.map((pair) => parseInt(pair, 16)))
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256)
  return toHex(bits)
}

export interface PasswordHash {
  hash: string
  salt: string
}

export async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return { hash: await derive(password, salt), salt: toHex(salt) }
}

export async function verifyPassword(password: string, stored: PasswordHash): Promise<boolean> {
  return (await derive(password, fromHex(stored.salt))) === stored.hash
}
