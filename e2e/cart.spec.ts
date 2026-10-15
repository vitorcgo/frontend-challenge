import type { Page } from '@playwright/test'
import { expect, test, type CatalogPage } from './support/catalog'

const items = (page: Page) => page.getByRole('list', { name: 'Itens do carrinho' }).getByRole('listitem')
const summaryValue = (page: Page, label: string) =>
  page.locator('dl div').filter({ has: page.getByText(label, { exact: true }) }).locator('dd').first()

async function addFromDetail(page: Page, catalog: CatalogPage, nftId: string, edition?: string) {
  await catalog.goto(`/nft/${nftId}`)
  if (edition) await page.getByRole('group', { name: 'Edição:' }).getByRole('button', { name: edition, exact: true }).click()
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await expect(page).toHaveURL(/\/carrinho/)
  await expect(items(page).first()).toBeVisible()
}

async function control(page: Page, path: string, method: string, body?: unknown) {
  return page.evaluate(
    async ([p, m, b]) => {
      const response = await fetch(`/api/__mock${p}`, {
        method: m,
        headers: { 'Content-Type': 'application/json' },
        body: b === undefined ? undefined : JSON.stringify(b),
      })
      return response.ok
    },
    [path, method, body] as const,
  )
}

async function waitForSocket(page: Page) {
  await expect
    .poll(() => page.evaluate(() => fetch('/api/__mock/realtime').then((r) => r.json()).then((d: { connected: number }) => d.connected)))
    .toBeGreaterThan(0)
}

test('visitante adiciona, altera e remove itens; o carrinho sobrevive ao refresh', async ({ page, catalog }) => {
  await addFromDetail(page, catalog, 'emerald-ape-042')
  await expect(items(page)).toHaveCount(1)
  await expect(summaryValue(page, 'Subtotal')).toHaveText('1.19 ETH')

  await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(summaryValue(page, 'Subtotal')).toHaveText('2.38 ETH')

  await page.reload()
  await expect(summaryValue(page, 'Subtotal')).toHaveText('2.38 ETH')

  await page.getByRole('button', { name: /Remover Emerald Ape #042/ }).click()
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
})

test('quantidade respeita o estoque da edição', async ({ page, catalog }) => {
  // Sage Nomad, edição 1/10: restam 3 unidades.
  await addFromDetail(page, catalog, 'sage-nomad-009', '1/10')
  const plus = page.getByRole('button', { name: 'Aumentar quantidade' })
  await plus.click()
  await plus.click()
  await expect(page.getByRole('group', { name: /Quantidade de Sage Nomad/ }).locator('output')).toHaveText('3')
  await expect(plus).toBeDisabled()
})

test('cupom inválido, expirado e válido', async ({ page, catalog }) => {
  await addFromDetail(page, catalog, 'emerald-ape-042')
  const input = page.getByRole('textbox', { name: 'Código promocional' })
  const apply = page.getByRole('button', { name: 'Aplicar' })

  await input.fill('NAOEXISTE')
  await apply.click()
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  // O erro é lido pelo `aria-describedby` do campo: fica associado a ele para o leitor de tela.
  const fieldError = page.locator(`[id="${await input.getAttribute('aria-describedby')}"]`)
  await expect(fieldError).toHaveText('Cupom inválido. Confira o código.')

  await input.fill('VERAO2025')
  await apply.click()
  await expect(fieldError).toHaveText('Este cupom expirou.')

  await input.fill('kurio10')
  await apply.click()
  await expect(page.getByText('KURIO10', { exact: true })).toBeVisible()
  // 10% de 1.19 ETH, calculado em wei: 0.119 ETH; total = 1.19 - 0.119 + 0.012 de taxa.
  await expect(summaryValue(page, 'Desconto do lançamento (10%)')).toHaveText('(-) 0.119 ETH')
  await expect(summaryValue(page, 'Total')).toHaveText('1.083 ETH')

  await page.getByRole('button', { name: 'Remover', exact: true }).click()
  await expect(summaryValue(page, 'Total')).toHaveText('1.202 ETH')
})

test('itens do visitante passam para a conta ao entrar', async ({ page, catalog }) => {
  await addFromDetail(page, catalog, 'golden-beat-207')
  await catalog.goto('/entrar?redirect=%2Fcarrinho')
  await page.getByRole('textbox', { name: 'E-mail' }).fill('bruno@kurio.dev')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio2026!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/carrinho/)
  await expect(items(page).filter({ hasText: 'Golden Beat #207' })).toHaveCount(1)

  await page.reload()
  await expect(items(page).filter({ hasText: 'Golden Beat #207' })).toHaveCount(1)
})

test.describe('tempo real pelo Socket.IO', () => {
  test('preço que muda com o carrinho aberto avisa e atualiza o resumo', async ({ page, catalog }) => {
    await addFromDetail(page, catalog, 'emerald-ape-042')
    await waitForSocket(page)

    await control(page, '/nfts/emerald-ape-042', 'PATCH', { price: '1.5' })
    await expect(page.getByText('Preço atualizado: era 1.19 ETH.')).toBeVisible()
    await expect(summaryValue(page, 'Subtotal')).toHaveText('1.50 ETH')
  })

  test('edição que esgota com o carrinho aberto bloqueia a finalização', async ({ page, catalog }) => {
    await addFromDetail(page, catalog, 'emerald-ape-042')
    await waitForSocket(page)

    await control(page, '/nfts/emerald-ape-042', 'PATCH', { editions: [{ id: '1-50', available: 0 }] })
    await expect(page.getByText('Esgotado: remova o item para continuar.')).toBeVisible()
    await expect(page.getByText('Ajuste os itens marcados para continuar.')).toBeVisible()
    await expect(summaryValue(page, 'Subtotal')).toHaveText('0.00 ETH')
  })

  test('evento repetido ou antigo não volta o preço a um estado anterior', async ({ page, catalog }) => {
    await catalog.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await waitForSocket(page)

    await control(page, '/nfts/emerald-ape-042', 'PATCH', { price: '2' })
    await control(page, '/nfts/emerald-ape-042', 'PATCH', { price: '2.5' })
    await expect(page.getByText('2.50 ETH').first()).toBeVisible()

    // -2 é o evento antigo (2.00 ETH); -1 repete o último.
    expect(await control(page, '/realtime/replay', 'POST', { index: -2 })).toBe(true)
    expect(await control(page, '/realtime/replay', 'POST', { index: -1 })).toBe(true)
    await page.waitForTimeout(500)
    await expect(page.getByText('2.50 ETH').first()).toBeVisible()
    await expect(page.getByText('2.00 ETH')).toHaveCount(0)
  })

  test('depois de cair a conexão, os dados são conferidos de novo com a API', async ({ page, catalog }) => {
    await catalog.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await waitForSocket(page)

    await control(page, '/realtime/disconnect', 'POST')
    // Mudança enquanto o socket está fora: nenhum evento chega, só a reconciliação pela API traz o preço novo.
    await control(page, '/nfts/emerald-ape-042', 'PATCH', { price: '3.33' })
    await expect(page.getByText('3.33 ETH').first()).toBeVisible({ timeout: 15_000 })
  })
})

test('sair da conta limpa o carrinho do usuário da tela', async ({ page, catalog }) => {
  test.skip(catalog.isMobile, 'o botão "Sair" fica no cabeçalho do desktop')
  await catalog.goto('/entrar?redirect=%2Fnft%2Femerald-ape-042')
  await page.getByRole('textbox', { name: 'E-mail' }).fill('ana@kurio.dev')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio2026!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page.getByRole('link', { name: 'Carrinho, 1 item' })).toBeVisible()

  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByRole('link', { name: 'Carrinho', exact: true })).toBeVisible()
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
})
