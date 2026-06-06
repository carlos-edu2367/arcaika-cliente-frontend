import { expect, test } from '@playwright/test'

async function suppressModals({ page }: { page: any }) {
  await page.addInitScript(() => {
    localStorage.setItem('arcaika_location', JSON.stringify({
      state: { localidade: null, hasChosen: true, isPickerOpen: false },
      version: 0,
    }))
  })
}

async function dismissAnyDialog(page: any) {
  try {
    await page.getByRole('button', { name: /todo o brasil/i }).click({ timeout: 1500 })
    await page.waitForTimeout(300)
  } catch {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
  }
}

test.describe('Home search', () => {
  test.beforeEach(suppressModals)

  test('hero search fits inside the first mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await dismissAnyDialog(page)

    const searchForm = page.locator('form:has(input[name="q"])')
    const searchInput = searchForm.locator('input[name="q"]')
    const searchButton = searchForm.getByRole('button', { name: 'Buscar' })

    await expect(searchForm).toBeVisible()
    await expect(searchInput).toBeVisible()
    await expect(searchButton).toBeVisible()

    const metrics = await searchForm.evaluate((form) => {
      const viewportWidth = document.documentElement.clientWidth
      const bodyScrollWidth = document.documentElement.scrollWidth
      const formRect = form.getBoundingClientRect()
      const inputRect = form.querySelector('input[name="q"]')!.getBoundingClientRect()
      const buttonRect = form.querySelector('button[type="submit"]')!.getBoundingClientRect()
      const arkyButton = document.querySelector('button[aria-label^="Abrir Arky"]')
      const arkyRect = arkyButton?.getBoundingClientRect()
      const overlapsArky = arkyRect
        ? !(formRect.right <= arkyRect.left
          || formRect.left >= arkyRect.right
          || formRect.bottom <= arkyRect.top
          || formRect.top >= arkyRect.bottom)
        : false

      return {
        bodyOverflows: bodyScrollWidth > viewportWidth,
        formLeft: formRect.left,
        formRight: formRect.right,
        inputLeft: inputRect.left,
        inputRight: inputRect.right,
        buttonLeft: buttonRect.left,
        buttonRight: buttonRect.right,
        overlapsArky,
        viewportWidth,
      }
    })

    expect(metrics.bodyOverflows).toBe(false)
    expect(metrics.formLeft).toBeGreaterThanOrEqual(0)
    expect(metrics.inputLeft).toBeGreaterThanOrEqual(0)
    expect(metrics.buttonLeft).toBeGreaterThanOrEqual(0)
    expect(metrics.formRight).toBeLessThanOrEqual(metrics.viewportWidth)
    expect(metrics.inputRight).toBeLessThanOrEqual(metrics.viewportWidth)
    expect(metrics.buttonRight).toBeLessThanOrEqual(metrics.viewportWidth)
    expect(metrics.overlapsArky).toBe(false)
  })

  test('hero search button navigates to marketplace results', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await dismissAnyDialog(page)

    const searchForm = page.locator('form:has(input[name="q"])')
    await searchForm.locator('input[name="q"]').fill('pintura')
    await searchForm.getByRole('button', { name: 'Buscar' }).click()

    await expect(page).toHaveURL(/\/marketplace.*q=pintura/)
  })
})
