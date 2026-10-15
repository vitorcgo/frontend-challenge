import type { Page } from '@playwright/test'
import { expect, test, type CatalogPage } from './support/catalog'

const EMERALD = '/nft/emerald-ape-042'
const SAGE = '/nft/sage-nomad-009'

async function loginAndOpen(page: Page, catalog: CatalogPage, email: string, path: string) {
  await catalog.goto(`/entrar?redirect=${encodeURIComponent(path)}`)
  await page.getByRole('textbox', { name: 'E-mail' }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill('Kurio2026!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

const favoriteButton = (page: Page) => page.getByRole('button', { name: 'Favoritar' })

test('sem sessão, favoritar leva ao login e volta para o NFT', async ({ page, catalog }) => {
  await catalog.goto(SAGE)
  await favoriteButton(page).click()
  await expect(page).toHaveURL(/\/entrar\?redirect=/)

  await page.getByRole('textbox', { name: 'E-mail' }).fill('ana@kurio.dev')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio2026!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/nft\/sage-nomad-009(\?|$)/)
  await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false')
})

test('favoritos persistem após o refresh e pertencem a cada usuário', async ({ page, catalog }) => {
  await loginAndOpen(page, catalog, 'ana@kurio.dev', EMERALD)
  // Emerald Ape já está entre os favoritos da Ana nos dados iniciais.
  await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')

  await favoriteButton(page).click()
  await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false')
  await page.reload()
  await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false')

  await favoriteButton(page).click()
  await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')

  await page.evaluate(() => localStorage.removeItem('kurio.session.token'))
  await loginAndOpen(page, catalog, 'bruno@kurio.dev', EMERALD)
  await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false')
})

test('a marcação aparece na hora, antes da resposta da API', async ({ page, catalog }) => {
  await loginAndOpen(page, catalog, 'ana@kurio.dev', SAGE)
  await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false')
  await catalog.setScenario('slow')

  const request = page.waitForRequest((req) => req.method() === 'PUT' && req.url().includes('/api/favorites/'))
  await favoriteButton(page).click()
  await request
  await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true', { timeout: 1_000 })
})

test('falha ao favoritar desfaz a marcação e avisa; nova tentativa funciona', async ({ page, catalog }) => {
  await loginAndOpen(page, catalog, 'ana@kurio.dev', SAGE)
  await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false')

  await catalog.setScenario('server-error')
  await favoriteButton(page).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível atualizar seus favoritos' })).toBeVisible()
  await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false')

  await catalog.setScenario('fast')
  await favoriteButton(page).click()
  await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível atualizar seus favoritos' })).toBeHidden()
  await page.reload()
  await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
})

test('cliques seguidos terminam no estado do último clique', async ({ page, catalog }) => {
  await loginAndOpen(page, catalog, 'ana@kurio.dev', SAGE)
  await catalog.setScenario('variable-latency')
  for (let i = 0; i < 5; i++) await favoriteButton(page).click()
  await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
  await page.waitForTimeout(2_500)
  await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')

  await catalog.setScenario('fast')
  await page.reload()
  await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
})
