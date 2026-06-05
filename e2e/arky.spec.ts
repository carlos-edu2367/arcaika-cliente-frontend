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

test.describe('Arky — Assistente Virtual', () => {
  test.beforeEach(suppressModals)

  test('FAB do Arky está visível na home', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const fab = page.locator('button[aria-label*="Arky"]')
    await expect(fab).toBeVisible()
  })

  test('FAB fica visível em /auth/login (não é hidden route)', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    // FAB não é hidden em /auth/login — só em /checkout
    const fab = page.locator('button[aria-label*="Arky"]')
    await expect(fab).toBeVisible()
  })

  test('FAB abre modal de login quando usuário não está autenticado', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await dismissAnyDialog(page)
    await page.locator('button[aria-label*="Abrir Arky"]').click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('heading', { name: /acesse sua conta/i })).toBeVisible()
  })

  test('modal de login aberto pelo Arky tem toggle de senha', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await dismissAnyDialog(page)
    await page.locator('button[aria-label*="Abrir Arky"]').click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 })
    const senhaInput = page.locator('[role="dialog"] input[type="password"]')
    await expect(senhaInput).toBeVisible()
    await page.locator('[role="dialog"] button[aria-label*="senha"]').click()
    await expect(page.locator('[role="dialog"] input[type="text"]')).toBeVisible()
  })

  test('checkout redireciona para login (FAB fica em /auth/login)', async ({ page }) => {
    // Sem autenticação, /checkout redireciona para /auth/login
    // O FAB (aria-label="Abrir Arky") está visível em /auth/login
    await page.goto('/checkout')
    await expect(page).toHaveURL(/auth\/login/)
    await expect(page.locator('button[aria-label*="Arky"]')).toBeVisible()
  })
})
