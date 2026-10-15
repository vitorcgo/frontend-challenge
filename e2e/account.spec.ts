import type { Page } from '@playwright/test'
import { expect, test, type CatalogPage } from './support/catalog'

const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')

async function login(page: Page, catalog: CatalogPage, path: string, email = 'ana@kurio.dev', password = 'Kurio2026!') {
  await catalog.goto(`/entrar?redirect=${encodeURIComponent(path)}`)
  await page.getByRole('textbox', { name: 'E-mail' }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
}

const save = (page: Page) => page.getByRole('button', { name: 'Salvar', exact: true })

test('perfil sem sessão leva ao login e volta', async ({ page, catalog }) => {
  await catalog.goto('/carteiras')
  await expect(page).toHaveURL(/\/entrar\?redirect=%2Fcarteiras/)
})

test('edita os dados do perfil, com erro de validação e conflito da API, e mantém após refresh', async ({ page, catalog }) => {
  await login(page, catalog, '/perfil')
  const name = page.getByRole('textbox', { name: 'Nome de exibição' })
  const username = page.getByRole('textbox', { name: 'Nome de usuário' })

  await name.fill('A')
  await save(page).click()
  await expect(name).toHaveAttribute('aria-invalid', 'true')
  await expect(name).toBeFocused()

  await name.fill('Ana Martins')
  await username.fill('bruno.costa')
  await save(page).click()
  await expect(username).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText('Este nome de usuário já está em uso.')).toBeVisible()

  await username.fill('ana.martins')
  await save(page).click()
  await expect(page.getByRole('status').filter({ hasText: 'Perfil salvo.' })).toBeVisible()

  await page.reload()
  await expect(name).toHaveValue('Ana Martins')
  await expect(username).toHaveValue('ana.martins')
})

test('avatar: rejeita arquivo inválido, envia e remove', async ({ page, catalog }) => {
  await login(page, catalog, '/perfil')
  const input = page.locator('input[type="file"]')

  await input.setInputFiles({ name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('texto') })
  await expect(page.getByText('Envie uma imagem PNG, JPEG ou WebP.')).toBeVisible()

  await input.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG_1X1 })
  await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()

  await page.getByRole('button', { name: 'Remover' }).click()
  await expect(page.getByRole('img', { name: 'Seu avatar' })).toHaveCount(0)
})

test('troca a senha: senha atual errada, confirmação diferente e sucesso', async ({ page, catalog }) => {
  await login(page, catalog, '/perfil')
  const current = page.getByLabel('Senha atual', { exact: true })
  const next = page.getByLabel('Nova senha', { exact: true })
  const confirm = page.getByLabel('Confirmar nova senha', { exact: true })

  await current.fill('Kurio2026!')
  await next.fill('NovaSenha2026!')
  await confirm.fill('Outra2026!')
  await save(page).click()
  await expect(confirm).toHaveAttribute('aria-invalid', 'true')

  await current.fill('Errada2026!')
  await confirm.fill('NovaSenha2026!')
  await save(page).click()
  await expect(page.getByText('A senha atual está incorreta.')).toBeVisible()

  await current.fill('Kurio2026!')
  await save(page).click()
  await expect(page.getByRole('status').filter({ hasText: 'Perfil e senha salvos.' })).toBeVisible()
  await expect(current).toHaveValue('')

  await page.evaluate(() => fetch('/api/__mock/sessions/expire', { method: 'POST' }))
  await login(page, catalog, '/perfil', 'ana@kurio.dev', 'NovaSenha2026!')
})

test('carteiras: erro de validação, edição da principal e secundária igual à principal', async ({ page, catalog }) => {
  await login(page, catalog, '/carteiras', 'bruno@kurio.dev')
  const primary = page.getByRole('form', { name: 'Carteira principal' })
  const address = primary.getByRole('textbox', { name: 'Endereço da carteira' })

  await address.fill('0x123')
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(address).toHaveAttribute('aria-invalid', 'true')
  await expect(address).toBeFocused()

  await address.fill('0x1111111111111111111111111111111111111111')
  await primary.getByRole('textbox', { name: 'Apelido da carteira' }).fill('Cofre novo')
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Carteira principal atualizada.' })).toBeVisible()

  await expect(page.getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible()
  await page.getByRole('checkbox', { name: 'Igual à carteira principal' }).check()
  const secondary = page.getByRole('form', { name: 'Carteira secundária' })
  await expect(secondary.getByRole('textbox', { name: 'Endereço da carteira' })).toHaveValue('0x1111111111111111111111111111111111111111')
  await secondary.getByRole('textbox', { name: 'Apelido da carteira' }).fill('Reserva')
  await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Carteira secundária adicionada.' })).toBeVisible()

  await page.reload()
  await expect(primary.getByRole('textbox', { name: 'Apelido da carteira' })).toHaveValue('Cofre novo')
  await expect(secondary.getByRole('textbox', { name: 'Apelido da carteira' })).toHaveValue('Reserva')
})

test('sair pelo menu do perfil limpa a sessão (também no mobile)', async ({ page, catalog }) => {
  await login(page, catalog, '/perfil')
  await page.getByRole('navigation', { name: 'Meu perfil' }).getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL(/\/(\?.*)?$/)
  await catalog.goto('/perfil')
  await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil/)
})
