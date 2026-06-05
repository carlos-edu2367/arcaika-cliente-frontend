import { test, expect } from '@playwright/test'

async function suppressModals({ page }: { page: any }) {
  await page.addInitScript(() => {
    localStorage.setItem('arcaika_location', JSON.stringify({
      state: { localidade: null, hasChosen: true, isPickerOpen: false },
      version: 0
    }))
  })
}

async function dismissAnyDialog(page: any, _?: any) {
  // LocationPicker com firstVisit=true não fecha com Escape — tenta "Todo o Brasil"
  try {
    await page.getByRole('button', { name: /todo o brasil/i }).click({ timeout: 1500 })
    await page.waitForTimeout(300)
  } catch {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
  }
}

test.describe('Autenticação', () => {
  test.beforeEach(suppressModals)

  test('página de login renderiza corretamente', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /bem-vindo/i })).toBeVisible()
    await expect(page.getByPlaceholder('seu@email.com')).toBeVisible()
    await expect(page.getByRole('button', { name: /entrar na conta/i })).toBeVisible()
  })

  test('toggle de visibilidade de senha funciona na página de login', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    // Verifica estado inicial (password)
    const senhaInput = page.locator('input[type="password"]').first()
    await expect(senhaInput).toHaveAttribute('type', 'password')
    // Clica no botão de toggle (aria-label contém "senha")
    await page.locator('button[aria-label*="senha"]').first().click()
    // Deve virar text
    await expect(page.locator('input[type="text"]').first()).toBeVisible()
    // Clica de novo para voltar a password
    await page.locator('button[aria-label*="senha"]').first().click()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })

  test('valida campos obrigatórios antes de submeter', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /entrar na conta/i }).click()
    await expect(page.locator('.text-error, [class*="text-error"]').first()).toBeVisible({ timeout: 3000 })
  })

  test('link para cadastro navega corretamente', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: /criar conta/i }).click()
    await expect(page).toHaveURL('/auth/cadastro')
  })

  test('link para recuperar senha navega corretamente', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    await page.locator('a[href="/auth/recuperar-senha"]').click()
    await expect(page).toHaveURL('/auth/recuperar-senha')
  })

  test('rota protegida /carrinho redireciona para login', async ({ page }) => {
    await page.goto('/carrinho')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('rota protegida /conta/pedidos redireciona para login', async ({ page }) => {
    await page.goto('/conta/pedidos')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('rota protegida /orcamentos/novo redireciona para login', async ({ page }) => {
    await page.goto('/orcamentos/novo')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('rota protegida /checkout redireciona para login', async ({ page }) => {
    await page.goto('/checkout')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('modal de login tem toggle de visibilidade de senha', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await dismissAnyDialog(page)
    // Abre o modal via botão "Entrar" na TopBar
    await page.getByRole('button', { name: /^Entrar$/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    // Verifica campo de senha no modal
    const senhaInput = page.locator('[role="dialog"] input[type="password"]')
    await expect(senhaInput).toBeVisible()
    await page.locator('[role="dialog"] button[aria-label*="senha"]').click()
    await expect(page.locator('[role="dialog"] input[type="text"]')).toBeVisible()
  })
})
