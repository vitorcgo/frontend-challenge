// Substitui o `tough-cookie` do MSW (alias no vite.config.ts): o original traz ~257 KB de lista de domínios
// e o app não usa cookie. Guarda só nome e valor por domínio.

interface CookieJson {
  key: string
  value: string
  domain: string
  path: string
}

export class Cookie {
  key: string
  value: string
  domain: string
  path: string

  constructor({ key, value, domain, path }: CookieJson) {
    this.key = key
    this.value = value
    this.domain = domain
    this.path = path
  }

  static fromJSON(raw: unknown): Cookie | null {
    const data = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw
    if (!data || typeof data !== 'object') return null
    const { key, value, domain, path } = data as Partial<CookieJson>
    if (typeof key !== 'string' || typeof domain !== 'string') return null
    return new Cookie({ key, value: String(value ?? ''), domain, path: path ?? '/' })
  }

  toJSON(): CookieJson {
    return { key: this.key, value: this.value, domain: this.domain, path: this.path }
  }
}

export class MemoryCookieStore {
  idx: Record<string, Record<string, Record<string, Cookie>>> = {}
}

export class CookieJar {
  constructor(private readonly store: MemoryCookieStore) {}

  getCookiesSync(url: string): Cookie[] {
    const byPath = this.store.idx[new URL(url).hostname] ?? {}
    return Object.values(byPath).flatMap((cookies) => Object.values(cookies))
  }

  async setCookie(header: string, url: string): Promise<void> {
    const [pair = ''] = header.split(';')
    const separator = pair.indexOf('=')
    if (separator <= 0) return
    const key = pair.slice(0, separator).trim()
    const value = pair.slice(separator + 1).trim()
    const domain = new URL(url).hostname
    const paths = (this.store.idx[domain] ??= {})
    ;(paths['/'] ??= {})[key] = new Cookie({ key, value, domain, path: '/' })
  }
}
