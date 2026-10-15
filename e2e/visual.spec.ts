import type { Page } from '@playwright/test'
import { expect, test } from './support/catalog'

// Na captura de página inteira, as barras fixas do mobile (navegação e compra) seriam desenhadas no meio da página.
// Elas ficam de fora dessa captura e aparecem na da primeira tela, no lugar real.
const HIDE_FIXED_BARS = '.fixed.bottom-0 { visibility: hidden !important; }'

/** Imagens lazy fora da tela e a fonte precisam estar prontas, senão a captura muda a cada execução. */
async function waitForMedia(page: Page) {
  await page.evaluate(async () => {
    const images = [...document.images]
    for (const image of images) image.loading = 'eager'
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)))
    await document.fonts.ready
  })
}

test('Início', async ({ page, catalog }) => {
  await catalog.goto()
  await expect(catalog.cards).toHaveCount(9)
  await waitForMedia(page)

  await expect(page).toHaveScreenshot('inicio-primeira-tela.png')
  await page.addStyleTag({ content: HIDE_FIXED_BARS })
  await expect(page).toHaveScreenshot('inicio-pagina-inteira.png', { fullPage: true })
})

test('Carrinho', async ({ page, catalog }) => {
  await catalog.goto('/carrinho')
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  await page.evaluate(async () => {
    const headers = { 'Content-Type': 'application/json', 'X-Guest-Cart': localStorage.getItem('kurio.cart.guest') ?? '' }
    for (const body of [
      { nftId: 'emerald-ape-042', editionId: '1-50', quantity: 2 },
      { nftId: 'ivory-baron-088', editionId: '1-50', quantity: 1 },
      { nftId: 'golden-beat-207', editionId: '1-50', quantity: 3 },
    ]) {
      await fetch('/api/cart/items', { method: 'POST', headers, body: JSON.stringify(body) })
    }
  })
  await page.reload()
  await expect(page.getByRole('list', { name: 'Itens do carrinho' }).getByRole('listitem')).toHaveCount(3)
  await expect(page.getByRole('region', { name: 'Colecionadores também viram' }).getByRole('listitem')).toHaveCount(5)
  await waitForMedia(page)

  await expect(page).toHaveScreenshot('carrinho-primeira-tela.png')
  await page.addStyleTag({ content: HIDE_FIXED_BARS })
  await expect(page).toHaveScreenshot('carrinho-pagina-inteira.png', { fullPage: true })
})

test('Detalhe do NFT', async ({ page, catalog }) => {
  await catalog.goto('/nft/emerald-ape-042')
  await expect(page.getByRole('region', { name: 'Mais desta coleção' }).getByRole('listitem')).toHaveCount(5)
  await waitForMedia(page)

  await expect(page).toHaveScreenshot('detalhe-primeira-tela.png')
  await page.addStyleTag({ content: HIDE_FIXED_BARS })
  await expect(page).toHaveScreenshot('detalhe-pagina-inteira.png', { fullPage: true })
})
