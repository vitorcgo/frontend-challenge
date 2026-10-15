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

test('Detalhe do NFT', async ({ page, catalog }) => {
  await catalog.goto('/nft/emerald-ape-042')
  await expect(page.getByRole('region', { name: 'Mais desta coleção' }).getByRole('listitem')).toHaveCount(5)
  await waitForMedia(page)

  await expect(page).toHaveScreenshot('detalhe-primeira-tela.png')
  await page.addStyleTag({ content: HIDE_FIXED_BARS })
  await expect(page).toHaveScreenshot('detalhe-pagina-inteira.png', { fullPage: true })
})
