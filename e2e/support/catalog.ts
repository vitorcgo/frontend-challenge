import { test as base, expect, type Locator, type Page } from '@playwright/test'
import type { ScenarioId } from '../../src/mocks/scenarios'

/**
 * Ações do catálogo que mudam de forma entre desktop e mobile: no desktop há barra lateral,
 * lupa no cabeçalho e ordenação ao lado das abas; no mobile tudo isso fica na busca do topo e na gaveta.
 */
export class CatalogPage {
  readonly cards: Locator
  readonly section: Locator
  readonly skeleton: Locator

  constructor(
    readonly page: Page,
    readonly isMobile: boolean,
  ) {
    this.cards = page.locator('#mercado li h3')
    this.section = page.locator('#mercado')
    this.skeleton = page.getByRole('list', { name: 'Carregando NFTs' })
  }

  /** Cada teste tem contexto próprio, então o banco simulado começa sempre do estado inicial. */
  async goto(path = '/', scenario: ScenarioId = 'fast') {
    await this.page.goto(`${path}${path.includes('?') ? '&' : '?'}scenario=${scenario}`)
  }

  /** Troca o cenário pela rota de controle do MSW; repete até os mocks terem iniciado. */
  async setScenario(scenario: ScenarioId) {
    await expect(async () => {
      const ok = await this.page.evaluate(async (id) => {
        const response = await fetch('/api/__mock/scenario', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario: id }),
        })
        return response.ok && (response.headers.get('content-type') ?? '').includes('json')
      }, scenario)
      expect(ok).toBe(true)
    }).toPass({ timeout: 10_000 })
  }

  async names() {
    return this.cards.allTextContents()
  }

  async prices() {
    const texts = await this.section.locator('li p span.font-bold').allTextContents()
    return texts.map((text) => parseFloat(text))
  }

  /** Painel de filtros: barra lateral no desktop, gaveta aberta no mobile. */
  async openFilters(): Promise<Locator> {
    if (!this.isMobile) return this.page.getByRole('complementary', { name: 'Filtros do catálogo' })
    await this.page.getByRole('button', { name: 'Abrir filtros' }).click()
    const sheet = this.page.getByRole('dialog', { name: 'Filtros' })
    await expect(sheet).toBeVisible()
    return sheet
  }

  async closeFilters() {
    if (!this.isMobile) return
    const sheet = this.page.getByRole('dialog', { name: 'Filtros' })
    await sheet.getByRole('button', { name: /^Ver/ }).click()
    await expect(sheet).toBeHidden()
  }

  async sortBy(label: string) {
    if (this.isMobile) {
      const sheet = await this.openFilters()
      await sheet.getByRole('combobox', { name: 'Ordenar por' }).click()
      await this.page.getByRole('option', { name: label }).click()
      await this.closeFilters()
      return
    }
    await this.page.getByRole('combobox', { name: 'Ordenar por:' }).click()
    await this.page.getByRole('option', { name: label }).click()
  }

  /** Busca com Enter: pela barra do topo no mobile, pelo diálogo da lupa no desktop. */
  async search(term: string) {
    if (this.isMobile) {
      const box = this.page.getByRole('searchbox', { name: 'Buscar NFTs' })
      await box.fill(term)
      await box.press('Enter')
      return
    }
    await this.page.getByRole('button', { name: 'Buscar NFTs' }).click()
    const box = this.page.getByRole('searchbox', { name: 'Termo da busca' })
    await expect(box).toBeFocused()
    await box.fill(term)
    await box.press('Enter')
    await expect(this.page.getByRole('dialog')).toBeHidden()
  }

  /** A seção de resultados recebeu o foco e está no topo da tela, não escondida acima ou abaixo. */
  async expectResultsInView() {
    await expect(this.section).toBeFocused()
    const top = await this.section.evaluate((element) => element.getBoundingClientRect().top)
    expect(top).toBeGreaterThanOrEqual(0)
    expect(top).toBeLessThan(120)
  }
}

export const test = base.extend<{ catalog: CatalogPage }>({
  catalog: async ({ page, isMobile }, provide) => {
    await provide(new CatalogPage(page, isMobile))
  },
})

export { expect }

/** Primeira página do catálogo com os dados iniciais, ordenada por "Mais recentes". */
export const FIRST_PAGE = { first: 'Emerald Ape #042', last: 'Golden Signal #160' }
