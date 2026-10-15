import type { Page } from '@playwright/test'
import { expect, test } from './support/catalog'

const PASSWORD = 'Kurio2026!'

async function fillLogin(page: Page, email: string, password = PASSWORD) {
  await page.getByRole('textbox', { name: 'E-mail' }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

const EXPIRED = 'Sua sessão expirou. Entre novamente para continuar.'
const expiredNotice = (page: Page) => page.getByRole('paragraph').filter({ hasText: EXPIRED })

async function expectLoggedIn(page: Page, name: string, isMobile: boolean) {
  if (isMobile) {
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const token = localStorage.getItem('kurio.session.token')
          if (!token) return null
          const response = await fetch('/api/auth/session', { headers: { Authorization: `Bearer ${token}` } })
          // Logo após o refresh os mocks podem não ter iniciado e a resposta é o HTML da página.
          if (!response.ok || !response.headers.get('content-type')?.includes('json')) return null
          return ((await response.json()) as { user: { displayName: string } }).user.displayName
        }),
      )
      .toBe(name)
  } else {
    await expect(page.getByRole('banner').getByText(name)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
  }
}

test('login volta para a tela de origem e a sessão sobrevive ao refresh', async ({ page, catalog }) => {
  await catalog.goto('/nft/emerald-ape-042')
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  await catalog.goto('/entrar?redirect=%2Fnft%2Femerald-ape-042')

  await fillLogin(page, 'ana@kurio.dev')
  await expect(page).toHaveURL(/\/nft\/emerald-ape-042$/)
  await expectLoggedIn(page, 'Ana Lima', catalog.isMobile)

  await page.reload()
  await expectLoggedIn(page, 'Ana Lima', catalog.isMobile)
})

test('login com outra aba do site aberta mantém a sessão nas duas', async ({ page, catalog, context }) => {
  test.skip(catalog.isMobile, 'mesmo comportamento; o desktop mostra a sessão no cabeçalho')
  const other = await context.newPage()
  await other.goto('/?scenario=fast')
  await expect(other.locator('#mercado li h3').first()).toBeVisible()

  await catalog.goto('/entrar')
  await fillLogin(page, 'ana@kurio.dev')
  await expectLoggedIn(page, 'Ana Lima', false)
  await expectLoggedIn(other, 'Ana Lima', false)

  // A outra aba confere a sessão na própria cópia do banco; se ela estivesse desatualizada, o 401 apagaria o token.
  await page.waitForTimeout(1000)
  await expectLoggedIn(page, 'Ana Lima', false)
  await other.reload()
  await expectLoggedIn(other, 'Ana Lima', false)
})

test('validação do login acontece no campo, antes de chamar a API', async ({ page, catalog }) => {
  await catalog.goto('/entrar')
  await page.getByRole('textbox', { name: 'E-mail' }).fill('nao-e-email')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  const email = page.getByRole('textbox', { name: 'E-mail' })
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toBeFocused()
  await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
  await expect(page.getByText('Informe a senha.')).toBeVisible()
  const describedBy = await email.getAttribute('aria-describedby')
  await expect(page.locator(`[id="${describedBy}"]`)).toHaveText('Informe um e-mail válido.')
})

test('senha errada mostra erro sem revelar se o e-mail existe', async ({ page, catalog }) => {
  await catalog.goto('/entrar')
  await fillLogin(page, 'ana@kurio.dev', 'SenhaErrada1')
  await expect(page.getByRole('alert')).toHaveText('E-mail ou senha incorretos.')
  await expect(page).toHaveURL(/\/entrar/)
})

test('mostrar senha alterna o tipo do campo', async ({ page, catalog }) => {
  await catalog.goto('/entrar')
  const password = page.getByLabel('Senha', { exact: true })
  await expect(password).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: 'Mostrar senha' }).click()
  await expect(password).toHaveAttribute('type', 'text')
  await expect(page.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute('aria-pressed', 'true')
})

test('cadastro valida campos, trata conflito e entra na conta nova', async ({ page, catalog }) => {
  await catalog.goto('/cadastro')
  const submit = page.getByRole('button', { name: /^(Criar conta|Criar perfil)$/ })

  await page.getByRole('textbox', { name: 'Nome de usuário' }).fill('Nova Conta')
  await page.getByLabel('Senha', { exact: true }).fill('curta')
  await page.getByLabel('Confirmar senha').fill('outra')
  await submit.click()
  await expect(page.getByText('Use letras minúsculas, números, ponto ou sublinhado.')).toBeVisible()
  await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
  await expect(page.getByText('A senha precisa ter pelo menos 8 caracteres.')).toBeVisible()
  await expect(page.getByText('As senhas não conferem.')).toBeVisible()

  await page.getByRole('textbox', { name: 'Nome de usuário' }).fill('nova.conta')
  await page.getByRole('textbox', { name: 'Digite seu e-mail' }).fill('ana@kurio.dev')
  await page.getByLabel('Senha', { exact: true }).fill('NovaSenha1')
  await page.getByLabel('Confirmar senha').fill('NovaSenha1')
  await submit.click()
  const email = page.getByRole('textbox', { name: 'Digite seu e-mail' })
  await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toBeFocused()

  await email.fill('nova@kurio.dev')
  await submit.click()
  await expect(page).toHaveURL(/\/$|\/\?/)
  await expectLoggedIn(page, 'nova.conta', catalog.isMobile)
})

test('sessão expirada no relógio encerra a sessão e oferece entrar de novo', async ({ page, catalog }) => {
  await page.clock.install()
  await catalog.goto('/entrar', 'short-session')
  await fillLogin(page, 'ana@kurio.dev')
  await expectLoggedIn(page, 'Ana Lima', catalog.isMobile)

  await page.clock.fastForward(61_000)
  await expect(expiredNotice(page)).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Perfil' }).or(page.getByRole('banner').getByRole('link', { name: 'Entrar' }))).toBeVisible()
})

test('sessão expirada no servidor é detectada ao recarregar', async ({ page, catalog }) => {
  await catalog.goto('/entrar')
  await fillLogin(page, 'ana@kurio.dev')
  await expectLoggedIn(page, 'Ana Lima', catalog.isMobile)

  await page.evaluate(() => fetch('/api/__mock/sessions/expire', { method: 'POST' }))
  await page.reload()
  await expect(expiredNotice(page)).toBeVisible()

  await page.getByRole('link', { name: 'Entrar', exact: true }).first().click()
  await fillLogin(page, 'ana@kurio.dev')
  await expect(expiredNotice(page)).toBeHidden()
})

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'cabeçalho com "Sair" e modal existem só a partir de 768 px')

  test('logout e troca de usuário', async ({ page, catalog }) => {
    await catalog.goto('/entrar')
    await fillLogin(page, 'ana@kurio.dev')
    await expectLoggedIn(page, 'Ana Lima', false)

    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page.getByRole('banner').getByRole('link', { name: 'Entrar' })).toBeVisible()
    await expect(page.getByText('Ana Lima')).toHaveCount(0)
    expect(await page.evaluate(() => localStorage.getItem('kurio.session.token'))).toBeNull()

    await page.getByRole('banner').getByRole('link', { name: 'Entrar' }).click()
    await fillLogin(page, 'bruno@kurio.dev')
    await expectLoggedIn(page, 'Bruno Costa', false)
    await expect(page.getByText('Ana Lima')).toHaveCount(0)
  })

  test('modal de login prende o foco, começa no e-mail e fecha com Escape', async ({ page, catalog }) => {
    await catalog.goto()
    await page.getByRole('banner').getByRole('link', { name: 'Entrar' }).click()
    const dialog = page.getByRole('dialog', { name: 'Entrar' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('textbox', { name: 'E-mail' })).toBeFocused()

    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page).not.toHaveURL(/entrar/)
  })

  test('abas do modal alternam entre entrar e criar conta mantendo o retorno', async ({ page, catalog }) => {
    await catalog.goto('/entrar?redirect=%2Fnft%2Fsage-nomad-009')
    await page.getByRole('link', { name: 'Criar conta' }).click()
    await expect(page).toHaveURL(/\/cadastro\?redirect=/)
    await expect(page.getByRole('dialog', { name: 'Criar conta' })).toBeVisible()
  })
})

test('redirecionamento para fora do app é ignorado', async ({ page, catalog }) => {
  await catalog.goto('/entrar?redirect=%2F%2Fexemplo.com')
  await fillLogin(page, 'ana@kurio.dev')
  await expect(page).toHaveURL(/localhost:\d+\/(\?.*)?$/)
})
