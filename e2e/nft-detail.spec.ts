import { expect, test } from './support/catalog'

const EMERALD = '/nft/emerald-ape-042'

test('acesso direto mostra o NFT com título da aba próprio', async ({ page, catalog }) => {
  await catalog.goto(EMERALD)
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page).toHaveTitle('Emerald Ape #042 | Kurio')
  await expect(page.getByText('ID do token:')).toBeVisible()
  await expect(page.getByText('#0042')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
})

test('card do catálogo leva ao detalhe e voltar retorna ao catálogo', async ({ page, catalog }) => {
  await catalog.goto()
  await catalog.cards.first().click()
  await expect(page).toHaveURL(/\/nft\/emerald-ape-042/)
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()

  await page.goBack()
  await expect(catalog.cards.first()).toHaveText('Emerald Ape #042')
})

test('NFT inexistente mostra mensagem própria e caminho de volta ao catálogo', async ({ page, catalog }) => {
  await catalog.goto('/nft/nao-existe-123')
  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
  await expect(page).toHaveTitle('NFT não encontrado | Kurio')

  await page.getByRole('link', { name: 'Ver o catálogo' }).click()
  await expect(catalog.cards.first()).toBeVisible()
})

test('edição esgotada fica indisponível e a escolha troca a edição marcada', async ({ page, catalog }) => {
  await catalog.goto(EMERALD)
  const editions = page.getByRole('group', { name: 'Edição:' })
  await expect(editions.getByRole('button', { name: '1/1 (esgotada)' })).toBeDisabled()
  await expect(editions.getByRole('button', { name: '1/10 (esgotada)' })).toBeDisabled()
  await expect(editions.getByRole('button', { name: '1/50' })).toHaveAttribute('aria-pressed', 'true')

  await editions.getByRole('button', { name: 'ABERTA' }).click()
  await expect(editions.getByRole('button', { name: 'ABERTA' })).toHaveAttribute('aria-pressed', 'true')
  await expect(editions.getByRole('button', { name: '1/50' })).toHaveAttribute('aria-pressed', 'false')
})

test('quantidade respeita o que resta na edição', async ({ page, catalog }) => {
  await catalog.goto('/nft/sage-nomad-009')
  const editions = page.getByRole('group', { name: 'Edição:' })
  const plus = page.getByRole('button', { name: 'Aumentar quantidade' })
  const minus = page.getByRole('button', { name: 'Diminuir quantidade' })
  const value = page.getByRole('group', { name: /Quantidade|Qtd\./ }).locator('output')

  await expect(editions.getByRole('button', { name: '1/1', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(value).toHaveText('1')
  await expect(plus).toBeDisabled()
  await expect(minus).toBeDisabled()
  await expect(page.getByText('Limite de 1 unidade nesta compra.')).toBeVisible()

  await editions.getByRole('button', { name: '1/10', exact: true }).click()
  await expect(page.getByText('Restam 3 de 10 nesta edição.')).toBeVisible()
  await plus.click()
  await plus.click()
  await expect(value).toHaveText('3')
  await expect(plus).toBeDisabled()
  await expect(page.getByText('Limite de 3 unidades nesta compra.')).toBeVisible()

  await editions.getByRole('button', { name: '1/1', exact: true }).click()
  await expect(value).toHaveText('1')
})

test('quantidade para no máximo por pedido mesmo com estoque maior', async ({ page, catalog }) => {
  await catalog.goto(EMERALD)
  await page.getByRole('group', { name: 'Edição:' }).getByRole('button', { name: 'ABERTA' }).click()
  const plus = page.getByRole('button', { name: 'Aumentar quantidade' })
  for (let i = 0; i < 9; i++) await plus.click()
  await expect(page.getByRole('group', { name: /Quantidade|Qtd\./ }).locator('output')).toHaveText('10')
  await expect(plus).toBeDisabled()
})

test('NFT esgotado avisa e desativa a compra', async ({ page, catalog }) => {
  await catalog.goto('/nft/cedar-baron-931')
  await expect(page.getByText('Esgotado: todas as edições deste NFT já foram vendidas.')).toBeVisible()
  for (const button of await page.getByRole('group', { name: 'Edição:' }).getByRole('button').all()) {
    await expect(button).toBeDisabled()
  }
  await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()
})

test('skeleton enquanto o detalhe carrega devagar', async ({ page, catalog }) => {
  await catalog.goto(EMERALD, 'slow')
  await expect(page.getByRole('status', { name: 'Carregando NFT' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible({ timeout: 10_000 })
})

test('falha ao carregar mostra o erro e "Tentar novamente" recupera', async ({ page, catalog }) => {
  await catalog.goto(EMERALD, 'server-error')
  const alert = page.getByRole('alert').filter({ hasText: 'Não foi possível carregar este NFT' })
  await expect(alert).toBeVisible({ timeout: 15_000 })

  await catalog.setScenario('fast')
  await alert.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
})

test('"Mais desta coleção" mostra outros NFTs da mesma coleção', async ({ page, catalog }) => {
  await catalog.goto(EMERALD)
  const related = page.getByRole('region', { name: 'Mais desta coleção' })
  await expect(related.getByRole('listitem')).toHaveCount(5)
  await expect(related.getByText('Emerald Ape #042')).toHaveCount(0)

  await related.getByRole('link').first().click()
  await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Emerald Ape #042')
})

test('NFT esgotado não deixa comprar', async ({ page, catalog }) => {
  await catalog.goto('/nft/cedar-baron-931')
  await expect(page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ })).toBeDisabled()
})

test('sem rolagem horizontal, inclusive com preço anterior e textos longos', async ({ page, catalog }) => {
  for (const id of ['emerald-ape-042', 'sage-nomad-009', 'neon-vessel-552']) {
    await catalog.goto(`/nft/${id}`)
    await expect(page.getByRole('region', { name: 'Mais desta coleção' }).getByRole('listitem').first()).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0)
  }
})

test('banco simulado salvo por uma versão anterior é descartado', async ({ page, catalog }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return
    sessionStorage.setItem('seeded', '1')
    localStorage.setItem('kurio.mocks.db', JSON.stringify({ schemaVersion: 1, nfts: [], users: [] }))
  })
  await catalog.goto(EMERALD)
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  const loaded = await page.locator('main img').evaluateAll((images) =>
    Promise.all(images.map((image) => (image as HTMLImageElement).decode().then(() => true, () => false))),
  )
  expect(loaded.every(Boolean)).toBe(true)
})

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'miniaturas e lupa existem só a partir de 768 px')

  test('miniaturas marcam a imagem escolhida', async ({ page, catalog }) => {
    await catalog.goto(EMERALD)
    const thumbs = page.getByRole('list', { name: 'Imagens da obra' }).getByRole('button')
    await expect(thumbs).toHaveCount(4)
    await expect(thumbs.first()).toHaveAttribute('aria-pressed', 'true')

    await thumbs.nth(2).click()
    await expect(thumbs.nth(2)).toHaveAttribute('aria-pressed', 'true')
    await expect(thumbs.first()).toHaveAttribute('aria-pressed', 'false')
  })

  test('lupa abre a imagem ampliada e devolve o foco ao fechar', async ({ page, catalog }) => {
    await catalog.goto(EMERALD)
    const zoom = page.getByRole('button', { name: 'Ampliar imagem' })
    await zoom.click()
    const dialog = page.getByRole('dialog', { name: 'Emerald Ape #042' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('img')).toHaveAttribute('src', /monkey-varsity-960/)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(zoom).toBeFocused()
  })

  test('trilha de navegação volta ao mercado', async ({ page, catalog }) => {
    await catalog.goto(EMERALD)
    await page.getByRole('navigation', { name: 'Trilha de navegação' }).getByRole('link', { name: 'Mercado' }).click()
    await expect(catalog.cards.first()).toBeVisible()
  })
})

test.describe('mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'barra de compra e galeria deslizante existem só abaixo de 768 px')

  test('barra de compra substitui a navegação e mostra o total', async ({ page, catalog }) => {
    await catalog.goto(EMERALD)
    await expect(page.getByRole('navigation', { name: 'Principal' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(page.getByText('2.38 ETH')).toBeVisible()
  })

  test('deslizar a galeria move o indicador de posição', async ({ page, catalog }) => {
    await catalog.goto(EMERALD)
    const track = page.getByRole('list', { name: /Imagens da obra/ })
    await track.evaluate((element) => element.scrollTo({ left: element.clientWidth * 2 }))
    await expect(page.getByText('Imagem 3 de 4')).toBeAttached()
    await expect(page.locator('[data-active]')).toHaveCount(1)
  })

  test('sem a barra de compra, a navegação continua no mobile', async ({ page, catalog }) => {
    await catalog.goto('/nft/nao-existe-123')
    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible()
  })

  test('voltar retorna à tela anterior', async ({ page, catalog }) => {
    await catalog.goto()
    await catalog.cards.first().click()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await page.getByRole('button', { name: 'Voltar' }).click()
    await expect(catalog.cards.first()).toBeVisible()
  })
})
