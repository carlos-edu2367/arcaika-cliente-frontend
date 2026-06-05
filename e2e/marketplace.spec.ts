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

test.describe('Marketplace', () => {
  test.beforeEach(suppressModals)

  test('home carrega sem erros', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('busca na hero navega para marketplace', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await dismissAnyDialog(page)
    const searchInput = page.locator('input[name="q"]')
    await searchInput.fill('pintura')
    await searchInput.press('Enter')
    await expect(page).toHaveURL(/\/marketplace.*q=pintura/)
  })

  test('marketplace carrega e exibe abas', async ({ page }) => {
    await page.goto('/marketplace')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /marketplace/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /serviços/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /itens/i })).toBeVisible()
  })

  test('tabs serviços/itens funcionam', async ({ page }) => {
    await page.goto('/marketplace')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /^itens$/i }).click()
    await expect(page).toHaveURL(/tab=itens/)
    await page.getByRole('button', { name: /^serviços$/i }).click()
    await expect(page).toHaveURL(/tab=servicos/)
  })

  test('campo de busca no marketplace funciona', async ({ page }) => {
    await page.goto('/marketplace')
    await page.waitForLoadState('networkidle')
    // O input do marketplace tem pl-12 (padding left para o ícone de busca)
    const input = page.locator('input.pl-12')
    await input.fill('pintura')
    // Aguarda URL atualizar com debounce (400ms + margem)
    await page.waitForURL(/q=pintura/, { timeout: 5000 })
    await expect(page).toHaveURL(/q=pintura/)
  })

  test('botão X limpa a busca', async ({ page }) => {
    await page.goto('/marketplace?q=teste')
    await page.waitForLoadState('networkidle')
    // O input do marketplace tem pl-12 e pr-12
    const input = page.locator('input.pl-12')
    await expect(input).toHaveValue('teste')
    // O botão X é absolutamente posicionado na direita do container de busca
    await page.locator('input.pl-12 ~ button').click()
    await expect(input).toHaveValue('')
  })

  test('página de busca carrega com query', async ({ page }) => {
    await page.goto('/busca?q=pintor')
    await page.waitForLoadState('networkidle')
    // O input da busca tem pl-9 (diferente do marketplace pl-12)
    await expect(page.locator('input.pl-9')).toBeVisible()
  })

  test('página 404 exibe conteúdo correto', async ({ page }) => {
    await page.goto('/rota-inexistente-xyz')
    await expect(page.getByText('404')).toBeVisible()
    await expect(page.getByRole('link', { name: /voltar/i })).toBeVisible()
  })
})

test.describe('Marketplace — mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })
  test.beforeEach(suppressModals)

  test('bottom nav está visível no mobile', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await dismissAnyDialog(page)
    // BottomNav é o <nav class="fixed bottom-0...md:hidden">
    const bottomNav = page.locator('nav.fixed')
    await expect(bottomNav).toBeVisible()
    // Verifica os links de navegação
    await expect(page.locator('nav.fixed a[href="/"]')).toBeVisible()
    await expect(page.locator('nav.fixed a[href="/marketplace"]')).toBeVisible()
  })

  test('bottom nav abre login modal para rotas protegidas sem auth', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await dismissAnyDialog(page)
    // Clica no link de Orçamentos no BottomNav
    await page.locator('nav.fixed a[href="/conta/orcamentos"]').click()
    // Deve abrir modal de login (não navegar)
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('heading', { name: /acesse sua conta/i })).toBeVisible()
  })
})
