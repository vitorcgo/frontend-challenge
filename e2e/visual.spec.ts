import { expect, test } from './support/catalog'

// §9: regressão visual da Início (detalhe, carrinho e pagamento entram com as telas), com dados estáveis.

// Na captura de página inteira, a barra fixa do mobile seria desenhada no meio da página.
// Ela fica de fora dessa captura e aparece na da primeira tela, no lugar real.
const HIDE_FIXED_TAB_BAR = 'nav.fixed { visibility: hidden !important; }'

test('Início', async ({ page, catalog }) => {
  await catalog.goto()
  await expect(catalog.cards).toHaveCount(9)
  // Imagens lazy fora da tela e a fonte precisam estar prontas, senão a captura muda a cada execução.
  await page.evaluate(async () => {
    const images = [...document.images]
    for (const image of images) image.loading = 'eager'
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)))
    await document.fonts.ready
  })

  await expect(page).toHaveScreenshot('inicio-primeira-tela.png')
  await page.addStyleTag({ content: HIDE_FIXED_TAB_BAR })
  await expect(page).toHaveScreenshot('inicio-pagina-inteira.png', { fullPage: true })
})
