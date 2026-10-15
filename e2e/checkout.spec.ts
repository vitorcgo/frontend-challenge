import type { Page } from '@playwright/test'
import type { ScenarioId } from '../src/mocks/scenarios'
import { expect, test, type CatalogPage } from './support/catalog'

const NFT = 'emerald-ape-042'

async function addToCart(page: Page, catalog: CatalogPage, scenario: ScenarioId = 'fast') {
  await catalog.goto(`/nft/${NFT}`, scenario)
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await expect(page).toHaveURL(/\/carrinho/)
}

async function loginToCheckout(page: Page) {
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL(/\/entrar\?redirect=%2Fpagamento/)
  await page.getByRole('textbox', { name: 'E-mail' }).fill('ana@kurio.dev')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio2026!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/pagamento/)
}

async function openReview(page: Page) {
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const dialog = page.getByRole('dialog', { name: 'Revise seu pedido' })
  await expect(dialog).toBeVisible()
  return dialog
}

const editionStock = (page: Page) =>
  page.evaluate(async (id) => {
    const nft = (await fetch(`/api/nfts/${id}`).then((r) => r.json())) as { editions: Array<{ id: string; available: number }> }
    return nft.editions.find((edition) => edition.id === '1-50')!.available
  }, NFT)

test('compra completa: revisão, pedido pendente e recibo confirmado', async ({ page, catalog }) => {
  await addToCart(page, catalog)
  await loginToCheckout(page)
  const before = await editionStock(page)

  const dialog = await openReview(page)
  await expect(dialog.getByText('Emerald Ape #042')).toBeVisible()
  await dialog.getByRole('button', { name: 'Confirmar e pagar' }).click()

  await expect(page).toHaveURL(/\/pedido\/ord_/)
  await expect(page.getByRole('heading', { name: 'Processando o pagamento' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Ver no Etherscan/ })).toHaveAttribute('href', /^https:\/\/etherscan\.io\/tx\/0x/)
  expect(await editionStock(page)).toBe(before - 1)

  // O recibo é o snapshot do pedido: mudar o preço no catálogo depois não altera os valores.
  await page.evaluate(
    (id) => fetch(`/api/__mock/nfts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{"price":"9"}' }),
    NFT,
  )
  await page.reload()
  await expect(page.getByRole('cell', { name: '1.19 ETH' })).toBeVisible()
})

test('pedido pendente continua depois do refresh', async ({ page, catalog }) => {
  await addToCart(page, catalog)
  await loginToCheckout(page)
  const dialog = await openReview(page)
  await dialog.getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(page.getByRole('heading', { name: 'Processando o pagamento' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
})

test('preço que muda durante a revisão bloqueia o pagamento até atualizar', async ({ page, catalog }) => {
  await addToCart(page, catalog)
  await loginToCheckout(page)
  const dialog = await openReview(page)

  await page.evaluate(
    (id) => fetch(`/api/__mock/nfts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{"price":"1.5"}' }),
    NFT,
  )
  await expect(dialog.getByText('Os valores mudaram desde a revisão.')).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Confirmar e pagar' })).toBeDisabled()

  await dialog.getByRole('button', { name: 'Atualizar revisão' }).click()
  await expect(dialog.getByText('Os valores mudaram desde a revisão.')).toBeHidden()
  await expect(dialog.getByText('1.512 ETH')).toBeVisible()
  await dialog.getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
})

test('pagamento recusado mantém os itens no carrinho', async ({ page, catalog }) => {
  await addToCart(page, catalog, 'payment-rejected')
  await loginToCheckout(page)
  const dialog = await openReview(page)
  await dialog.getByRole('button', { name: 'Confirmar e pagar' }).click()

  await expect(page.getByRole('heading', { name: 'Pagamento não concluído' })).toBeVisible()
  await expect(page.getByText('O pagamento foi recusado pela carteira. Nenhum valor foi cobrado.')).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
  await expect(page.getByRole('list', { name: 'Itens do carrinho' }).getByRole('link', { name: 'Emerald Ape #042' })).toBeVisible()
})

test('resposta perdida: tentar de novo recupera o mesmo pedido, sem cobrar duas vezes', async ({ page, catalog }) => {
  test.setTimeout(60_000)
  await addToCart(page, catalog, 'order-timeout')
  await loginToCheckout(page)
  const before = await editionStock(page)
  const dialog = await openReview(page)
  await dialog.getByRole('button', { name: 'Confirmar e pagar' }).click()

  await expect(dialog.getByText('Não recebemos a resposta do pedido. Tentar de novo não cria outra compra.')).toBeVisible({ timeout: 25_000 })
  await dialog.getByRole('button', { name: 'Tentar de novo' }).click()
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
  expect(await editionStock(page)).toBe(before - 1)
})

test('clique repetido em "Confirmar e pagar" cria um pedido só', async ({ page, catalog }) => {
  await addToCart(page, catalog)
  await loginToCheckout(page)
  const before = await editionStock(page)
  const dialog = await openReview(page)
  await dialog.getByRole('button', { name: 'Confirmar e pagar' }).dblclick()

  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
  expect(await editionStock(page)).toBe(before - 1)
})

test('carrinho alterado em outra aba exige nova revisão', async ({ page, catalog }) => {
  await addToCart(page, catalog)
  await loginToCheckout(page)
  const dialog = await openReview(page)

  await page.evaluate(async () => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('kurio.session.token')}` }
    await fetch('/api/cart/items', { method: 'POST', headers, body: JSON.stringify({ nftId: 'ivory-baron-088', editionId: '1-50', quantity: 1 }) })
  })
  await dialog.getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(dialog.getByText('Os itens do carrinho mudaram desde a revisão.')).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Confirmar e pagar' })).toBeDisabled()

  await dialog.getByRole('button', { name: 'Atualizar revisão' }).click()
  await expect(dialog.getByText('Ivory Baron #088')).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Confirmar e pagar' })).toBeEnabled()
})

test('carteira que recusa a conexão mostra o erro e não abre a revisão', async ({ page, catalog }) => {
  await addToCart(page, catalog, 'wallet-rejected')
  await loginToCheckout(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'A conexão foi recusada na carteira. Tente novamente.' })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('desconectar a carteira fecha a revisão', async ({ page, catalog }) => {
  await addToCart(page, catalog)
  await loginToCheckout(page)
  const dialog = await openReview(page)
  await dialog.getByRole('button', { name: 'Desconectar carteira' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled()
})

test('sessão que expira no checkout volta ao pagamento com o rascunho', async ({ page, catalog }) => {
  test.skip(catalog.isMobile, 'a observação fica no formulário do desktop')
  await addToCart(page, catalog)
  await loginToCheckout(page)
  const note = page.getByRole('textbox', { name: 'Observação do colecionador (opcional)' })
  await note.fill('Presente de aniversário')

  await page.evaluate(() => fetch('/api/__mock/sessions/expire', { method: 'POST' }))
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/entrar\?redirect=%2Fpagamento/)

  await page.getByRole('textbox', { name: 'E-mail' }).fill('ana@kurio.dev')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio2026!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/pagamento/)
  await expect(note).toHaveValue('Presente de aniversário')
})

test('campos obrigatórios vazios mostram erro e não abrem a revisão', async ({ page, catalog }) => {
  test.skip(catalog.isMobile, 'no mobile o formulário fica atrás de "Trocar carteira"')
  await addToCart(page, catalog)
  await loginToCheckout(page)
  const name = page.getByRole('textbox', { name: 'Nome de exibição' })
  await name.fill('')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(name).toHaveAttribute('aria-invalid', 'true')
  await expect(name).toBeFocused()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('pagamento sem sessão leva ao login', async ({ page, catalog }) => {
  await catalog.goto('/pagamento')
  await expect(page).toHaveURL(/\/entrar\?redirect=%2Fpagamento/)
})
