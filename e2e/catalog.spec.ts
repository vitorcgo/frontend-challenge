import { expect, FIRST_PAGE, test } from './support/catalog'

// §9, item 1: busca, filtros combinados, ordenação, paginação e restauração pelo histórico.

test.describe('catálogo da Início', () => {
  test.beforeEach(async ({ catalog }) => {
    await catalog.goto()
    await expect(catalog.cards).toHaveCount(9)
  })

  test('mostra a primeira página na ordem do Figma', async ({ catalog }) => {
    const names = await catalog.names()
    expect(names[0]).toBe(FIRST_PAGE.first)
    expect(names[8]).toBe(FIRST_PAGE.last)
  })

  test('paginação vai para a URL, sobrevive ao refresh e volta pelo histórico', async ({ page, catalog }) => {
    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(catalog.cards.first()).toHaveText('Jade Monarch #071')
    await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')

    await page.reload()
    await expect(catalog.cards.first()).toHaveText('Jade Monarch #071')

    await page.goBack()
    await expect(catalog.cards.first()).toHaveText(FIRST_PAGE.first)
    await page.goForward()
    await expect(catalog.cards.first()).toHaveText('Jade Monarch #071')
  })

  test('trocar de aba reinicia a paginação', async ({ page, catalog }) => {
    await page.getByRole('link', { name: 'Página 3' }).click()
    await expect(page).toHaveURL(/page=3/)

    await page.getByRole('tab', { name: 'Em alta' }).click()
    await expect(page).toHaveURL(/tab=/)
    expect(page.url()).not.toContain('page=')
    await expect(page.getByRole('tab', { name: 'Em alta' })).toHaveAttribute('aria-selected', 'true')
    await expect(catalog.cards.first()).toBeVisible()
  })

  test('ordena por menor preço e mantém a ordem nas abas', async ({ page, catalog }) => {
    await catalog.sortBy('Menor preço')
    await expect(page).toHaveURL(/sort=/)
    await expect(catalog.cards.first()).toHaveText('Cedar Baron #931')

    await page.getByRole('tab', { name: 'Em alta' }).click()
    await expect(page.getByRole('tab', { name: 'Em alta' })).toHaveAttribute('aria-selected', 'true')
    await expect(catalog.cards.first()).toBeVisible()
    const prices = await catalog.prices()
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })

  test('filtros combinados reiniciam a paginação e sobrevivem ao refresh e ao histórico', async ({ page, catalog }) => {
    await page.getByRole('link', { name: 'Página 3' }).click()
    await expect(page).toHaveURL(/page=3/)

    const filters = await catalog.openFilters()
    await filters.getByRole('button', { name: /^Música/ }).click()
    await expect(page).toHaveURL(/category=/)
    expect(page.url()).not.toContain('page=')
    await expect(catalog.cards).toHaveCount(5)

    await filters.getByRole('button', { name: /^Ethereum/ }).click()
    await expect(catalog.cards).toHaveCount(3)
    await expect(filters.getByRole('button', { name: /^Música/ })).toHaveAttribute('aria-pressed', 'true')
    // A contagem de cada rede já considera a categoria escolhida.
    await expect(filters.getByRole('button', { name: /^Polygon/ })).toContainText('(1)')
    await catalog.closeFilters()

    await page.reload()
    await expect(catalog.cards).toHaveCount(3)
    await page.goBack()
    await expect(catalog.cards).toHaveCount(5)
    await page.goForward()
    await expect(catalog.cards).toHaveCount(3)

    const again = await catalog.openFilters()
    await again.getByRole('button', { name: 'Limpar filtros' }).click()
    await catalog.closeFilters()
    await expect(catalog.cards).toHaveCount(9)
  })

  test('faixa de preço pelo teclado só mostra NFTs dentro dela', async ({ page, catalog }) => {
    const filters = await catalog.openFilters()
    await filters.getByRole('slider', { name: 'Preço mínimo' }).focus()
    for (let i = 0; i < 100; i++) await page.keyboard.press('ArrowRight')
    await expect(filters.getByText('Preço: 1.05 a 4.20 ETH')).toBeVisible()
    await filters.getByRole('button', { name: 'Aplicar' }).click()
    await catalog.closeFilters()

    await expect(page).toHaveURL(/priceMin=/)
    await expect(catalog.cards.first()).toBeVisible()
    for (const price of await catalog.prices()) expect(price).toBeGreaterThanOrEqual(1.05)
  })

  test('busca com Enter leva aos resultados e pode ser limpa', async ({ page, catalog }) => {
    await catalog.search('golden')
    await expect(page).toHaveURL(/search=golden/)
    await expect(page.getByText('Resultados para')).toBeVisible()
    for (const name of await catalog.names()) expect(name).toContain('Golden')
    await catalog.expectResultsInView()

    await page.getByRole('button', { name: 'Limpar busca' }).click()
    await expect(page.getByText('Resultados para')).toBeHidden()
    await expect(catalog.cards).toHaveCount(9)
  })

  test('busca sem resultado oferece limpar, mantendo aba e ordenação', async ({ page, catalog }) => {
    await catalog.goto('/?tab=%22new%22&sort=%22price-desc%22&search=zzzz')
    await expect(page.getByText('Nenhum NFT corresponde')).toBeVisible()

    await page.getByRole('link', { name: 'Limpar busca e filtros' }).click()
    await expect(catalog.cards.first()).toBeVisible()
    expect(page.url()).toContain('tab=')
    expect(page.url()).toContain('sort=')
    expect(page.url()).not.toContain('search=')
  })
})

test.describe('URL digitada à mão', () => {
  test('valores inválidos caem nos padrões', async ({ catalog }) => {
    await catalog.goto('/?page=abc&sort=foo&tab=xyz')
    await expect(catalog.cards.first()).toHaveText(FIRST_PAGE.first)
  })

  test('página além do total oferece voltar à primeira', async ({ page, catalog }) => {
    await catalog.goto('/?page=9')
    await expect(page.getByText('Esta página não existe')).toBeVisible()
    await page.getByRole('link', { name: 'Ir para a primeira página' }).click()
    await expect(catalog.cards.first()).toHaveText(FIRST_PAGE.first)
  })

  test('preço sem aspas e faixa invertida são aceitos', async ({ page, catalog }) => {
    await catalog.goto('/?priceMin=2&priceMax=0.5')
    await expect(catalog.cards.first()).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
    for (const price of await catalog.prices()) {
      expect(price).toBeGreaterThanOrEqual(0.5)
      expect(price).toBeLessThanOrEqual(2)
    }
  })

  test('busca longa é cortada no limite, não descartada', async ({ page, catalog }) => {
    await catalog.goto(`/?search=${'zzzz'.repeat(30)}`)
    await expect(page.getByText('Nenhum NFT corresponde')).toBeVisible()
  })
})

test.describe('somente desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'rodapé e lupa do cabeçalho existem só a partir de 768 px')

  test('coleção do rodapé abre o catálogo filtrado', async ({ page, catalog }) => {
    await catalog.goto()
    await page.getByRole('contentinfo').getByRole('link', { name: 'Música' }).click()
    await expect(page).toHaveURL(/category=/)
    await expect(catalog.cards).toHaveCount(5)
  })

  test('busca pela lupa vindo de outra página desce até os resultados', async ({ page, catalog }) => {
    await catalog.goto('/pagina-que-nao-existe')
    await expect(page.getByText('Página não encontrada')).toBeVisible()
    await catalog.search('nomad')
    await expect(catalog.cards.first()).toContainText('Nomad')
    await catalog.expectResultsInView()
  })

  test('campo da lupa limita o termo a 80 caracteres', async ({ page, catalog }) => {
    await catalog.goto()
    await page.getByRole('button', { name: 'Buscar NFTs' }).click()
    const box = page.getByRole('searchbox', { name: 'Termo da busca' })
    await box.fill('a'.repeat(120))
    await expect(box).toHaveValue('a'.repeat(80))
  })
})

test.describe('somente mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'a busca ao digitar existe só abaixo de 768 px')

  test('busca enquanto digita, sem criar uma entrada no histórico por letra', async ({ page, catalog }) => {
    await catalog.goto()
    await expect(catalog.cards).toHaveCount(9)
    const before = await page.evaluate(() => history.length)

    await page.getByRole('searchbox', { name: 'Buscar NFTs' }).fill('nomad')
    await expect(page).toHaveURL(/search=nomad/)
    await expect(catalog.cards.first()).toContainText('Nomad')
    expect(await page.evaluate(() => history.length)).toBe(before)
  })

  test('limpar filtros também esvazia o campo de busca', async ({ page, catalog }) => {
    await catalog.goto('/?search=golden')
    const box = page.getByRole('searchbox', { name: 'Buscar NFTs' })
    await expect(box).toHaveValue('golden')

    const filters = await catalog.openFilters()
    await filters.getByRole('button', { name: 'Limpar filtros' }).click()
    await catalog.closeFilters()
    await expect(box).toHaveValue('')
    await expect(page).not.toHaveURL(/search=/)
  })
})
