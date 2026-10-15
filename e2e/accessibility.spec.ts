import { expect, test } from './support/catalog'

test('link "Pular para o conteúdo" é o primeiro Tab e leva ao conteúdo', async ({ page, catalog }) => {
  await catalog.goto()
  await expect(catalog.cards.first()).toBeVisible()
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.locator('#conteudo')).toBeFocused()
})

test('abas do catálogo andam pelas setas do teclado', async ({ page, catalog }) => {
  await catalog.goto()
  await page.getByRole('tab', { name: 'Todos os NFTs' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Novos lançamentos' })).toBeFocused()
  await expect(page.getByRole('tab', { name: 'Novos lançamentos' })).toHaveAttribute('aria-selected', 'true')
  await expect(page).toHaveURL(/tab=/)
})

test('foco visível nos controles do catálogo', async ({ page, catalog }) => {
  await catalog.goto()
  await expect(catalog.cards.first()).toBeVisible()
  // Chega pelo teclado, a partir da aba anterior, para valer o :focus-visible e não um foco de clique.
  await page.getByRole('tab', { name: 'Todos os NFTs' }).focus()
  await page.keyboard.press('ArrowRight')
  const tab = page.getByRole('tab', { name: 'Novos lançamentos' })
  await expect(tab).toBeFocused()
  const outline = await tab.evaluate((element) => {
    const style = getComputedStyle(element)
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) }
  })
  expect(outline.style).toBe('solid')
  expect(outline.width).toBeGreaterThanOrEqual(1)
})

test('lista de páginas marca a atual sem depender só da cor', async ({ page, catalog }) => {
  await catalog.goto('/?page=2')
  await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('link', { name: 'Página 1' })).not.toHaveAttribute('aria-current', 'page')
})

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'a lupa do cabeçalho existe só a partir de 768 px')

  test('diálogo de busca recebe o foco, prende o Tab e devolve o foco ao fechar', async ({ page, catalog }) => {
    await catalog.goto()
    const trigger = page.getByRole('button', { name: 'Buscar NFTs' })
    await trigger.click()

    const dialog = page.getByRole('dialog', { name: 'Buscar NFTs' })
    await expect(dialog).toBeVisible()
    // Com o diálogo aberto, o resto da página sai da árvore de acessibilidade (modal); o botão é lido pelo atributo.
    await expect(page.locator('button[aria-label="Buscar NFTs"]')).toHaveAttribute('aria-expanded', 'true')
    await expect(dialog.getByRole('searchbox', { name: 'Termo da busca' })).toBeFocused()

    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab')
      expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('filtros da barra lateral funcionam pelo teclado', async ({ page, catalog }) => {
    await catalog.goto()
    const music = page.getByRole('complementary', { name: 'Filtros do catálogo' }).getByRole('button', { name: /^Música/ })
    await music.focus()
    await page.keyboard.press('Enter')
    await expect(music).toHaveAttribute('aria-pressed', 'true')
    await expect(catalog.cards).toHaveCount(5)
  })
})

test.describe('mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'a gaveta de filtros do topo existe só abaixo de 768 px')

  test('gaveta de filtros prende o foco e o devolve ao botão ao fechar', async ({ page, catalog }) => {
    await catalog.goto()
    const trigger = page.getByRole('button', { name: 'Abrir filtros' })
    await trigger.click()

    const sheet = page.getByRole('dialog', { name: 'Filtros' })
    await expect(sheet).toBeVisible()
    for (let i = 0; i < 30; i++) await page.keyboard.press('Tab')
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true)

    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    await expect(trigger).toBeFocused()
  })
})
