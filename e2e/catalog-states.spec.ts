import { expect, FIRST_PAGE, test } from './support/catalog'

/** Maior latência do cenário `variable-latency` (100 ms a 2 s): depois dela nenhuma resposta antiga chega mais. */
const MAX_VARIABLE_LATENCY_MS = 2_000

test('skeleton com shimmer enquanto o catálogo carrega devagar', async ({ catalog }) => {
  await catalog.goto('/', 'slow')
  await expect(catalog.skeleton).toBeVisible()
  const animation = await catalog.skeleton.locator('[data-slot="skeleton"]').first().evaluate((element) => {
    const style = getComputedStyle(element)
    return { name: style.animationName, duration: style.animationDuration }
  })
  expect(animation).toEqual({ name: 'shimmer', duration: '1.6s' })

  await expect(catalog.cards.first()).toHaveText(FIRST_PAGE.first, { timeout: 10_000 })
  await expect(catalog.skeleton).toBeHidden()
})

test('shimmer para quando a pessoa prefere menos movimento', async ({ page, catalog }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await catalog.goto('/', 'slow')
  await expect(catalog.skeleton).toBeVisible()
  const duration = await catalog.skeleton
    .locator('[data-slot="skeleton"]')
    .first()
    .evaluate((element) => getComputedStyle(element).animationDuration)
  expect(duration).not.toBe('1.6s')
})

test('troca de página mantém a grade anterior e avisa a atualização', async ({ page, catalog }) => {
  await catalog.goto()
  await expect(catalog.cards).toHaveCount(9)
  await catalog.setScenario('slow')

  await page.getByRole('link', { name: 'Página 2' }).click()
  await expect(page.getByText('Atualizando catálogo...')).toBeVisible()
  await expect(catalog.cards.first()).toHaveText(FIRST_PAGE.first)
  await expect(catalog.cards.first()).toHaveText('Jade Monarch #071', { timeout: 10_000 })
  await expect(page.getByText('Atualizando catálogo...')).toBeHidden()
})

test('avisa quando a conexão está mais lenta que o normal', async ({ page, catalog }) => {
  await page.clock.install()
  await catalog.goto('/', 'timeout')
  await expect(catalog.skeleton).toBeVisible()
  await expect(page.getByText('A conexão está mais lenta que o normal')).toBeHidden()

  await page.clock.fastForward(4_100)
  await expect(page.getByText('A conexão está mais lenta que o normal')).toBeVisible()
})

test('erro do servidor mostra a falha e "Tentar novamente" recupera', async ({ page, catalog }) => {
  await catalog.goto('/', 'server-error')
  const alert = page.getByRole('alert').filter({ hasText: 'Não foi possível carregar os NFTs' })
  await expect(alert).toBeVisible({ timeout: 15_000 })
  await expect(alert).toContainText('Erro interno no servidor')

  await catalog.setScenario('fast')
  await alert.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(catalog.cards).toHaveCount(9)
  await expect(alert).toBeHidden()
})

test('sem conexão explica o problema', async ({ page, catalog }) => {
  await catalog.goto('/', 'offline')
  const alert = page.getByRole('alert').filter({ hasText: 'Não foi possível carregar os NFTs' })
  await expect(alert).toBeVisible({ timeout: 15_000 })
  await expect(alert).toContainText('Sem conexão com o servidor')
})

test('falha passageira (503) se recupera sozinha, sem mostrar erro', async ({ page, catalog }) => {
  await catalog.goto('/', 'flaky')
  await expect(catalog.cards).toHaveCount(9, { timeout: 10_000 })
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('catálogo vazio tem mensagem própria, sem botão de limpar', async ({ page, catalog }) => {
  await catalog.goto('/', 'empty-catalog')
  await expect(page.getByText('O catálogo está vazio no momento')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Limpar busca e filtros' })).toHaveCount(0)
})

test('respostas fora de ordem não sobrescrevem a aba escolhida por último', async ({ page, catalog }) => {
  await catalog.goto('/', 'variable-latency')
  await expect(catalog.cards.first()).toBeVisible({ timeout: 10_000 })

  for (const tab of ['Em alta', 'Novos lançamentos', 'Em alta', 'Todos os NFTs', 'Novos lançamentos']) {
    await page.getByRole('tab', { name: tab }).click()
  }

  const expected = [
    'Emerald Ape #042',
    'Sage Nomad #009',
    'Neon Vessel #552',
    'Violet Nomad #314',
    'Golden Beat #207',
    'Golden Signal #160',
    'Copper Ape #019',
  ]
  await expect(catalog.cards).toHaveText(expected, { timeout: 10_000 })
  // Espera a resposta mais lenta possível chegar e confere que nada foi sobrescrito.
  await page.waitForTimeout(MAX_VARIABLE_LATENCY_MS)
  await expect(catalog.cards).toHaveText(expected)
})

test('digitação rápida com latência variável termina no último termo', async ({ page, catalog }) => {
  test.skip(!catalog.isMobile, 'a busca ao digitar existe só abaixo de 768 px')
  await catalog.goto('/', 'variable-latency')
  await expect(catalog.cards.first()).toBeVisible({ timeout: 10_000 })

  const box = page.getByRole('searchbox', { name: 'Buscar NFTs' })
  for (const term of ['g', 'go', 'gol', 'gold', 'golden e', 'golden echo']) {
    await box.fill(term)
    // Passa do debounce (350 ms): cada termo vira uma requisição com latência diferente.
    await page.waitForTimeout(400)
  }

  await expect(catalog.cards).toHaveText(['Golden Echo #412'], { timeout: 10_000 })
  await page.waitForTimeout(MAX_VARIABLE_LATENCY_MS)
  await expect(catalog.cards).toHaveText(['Golden Echo #412'])
})
