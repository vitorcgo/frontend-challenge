import { expect, test } from './support/catalog'

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'o NFT em destaque fica na barra lateral, a partir de 1280 px')

  test('NFT em destaque vem da API e leva ao detalhe', async ({ page, catalog }) => {
    await catalog.goto()
    const featured = page.getByRole('region', { name: 'NFT EM DESTAQUE' })
    await expect(featured.getByText('OFERTA LIMITADA')).toBeVisible()
    await expect(featured.getByRole('link')).toHaveAttribute('href', '/nft/sage-nomad-009')
  })

  test('falha no destaque mostra "Tentar novamente" e recupera', async ({ page, catalog }) => {
    await catalog.goto('/', 'server-error')
    const sidebar = page.getByRole('region', { name: 'Filtros do catálogo' })
    await expect(sidebar.getByText('Não foi possível carregar o NFT em destaque.')).toBeVisible({ timeout: 15_000 })

    await catalog.setScenario('fast')
    await sidebar.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByText('OFERTA LIMITADA')).toBeVisible()
  })

  test('sem destaque o bloco some, sem mensagem de erro', async ({ page, catalog }) => {
    await catalog.goto('/', 'empty-catalog')
    await expect(page.getByText('O catálogo está vazio no momento')).toBeVisible()
    await expect(page.getByText('OFERTA LIMITADA')).toBeHidden()
    await expect(page.getByText('Não foi possível carregar o NFT em destaque.')).toBeHidden()
  })

  test('promoções abrem o catálogo já filtrado', async ({ page, catalog }) => {
    await catalog.goto()
    await page.getByRole('link', { name: /Explorar.*Lançamentos gênesis/ }).click()
    await expect(page.getByRole('tab', { name: 'Novos lançamentos' })).toHaveAttribute('aria-selected', 'true')

    await page.getByRole('link', { name: /Explorar.*Arte digital/ }).click()
    const sidebar = page.getByRole('region', { name: 'Filtros do catálogo' })
    await expect(sidebar.getByRole('button', { name: /^Arte digital/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(catalog.cards).toHaveCount(6)
  })
})

test('abaixo de 1280 px o destaque não faz requisição', async ({ page, catalog }) => {
  test.skip(!catalog.isMobile, 'no desktop de 1440 px o destaque aparece')
  const calls: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/api/nfts/featured')) calls.push(request.url())
  })
  await catalog.goto()
  await expect(catalog.cards).toHaveCount(9)
  expect(calls).toEqual([])
})

test('"Ler mais" do Diário não aparenta funcionar', async ({ page, catalog }) => {
  await catalog.goto()
  const more = page.getByRole('link', { name: /Ler mais/ }).first()
  await expect(more).toHaveAttribute('aria-disabled', 'true')
  expect(await more.getAttribute('href')).toBeNull()
})

test('rota inexistente mostra a página 404 com caminho de volta', async ({ page, catalog }) => {
  await catalog.goto('/rota-que-nao-existe')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect(catalog.cards.first()).toBeVisible()
})
