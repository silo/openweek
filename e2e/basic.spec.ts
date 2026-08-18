import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

// Smoke flow: sign in as the seeded admin and land on the week grid.
// Assumes a registered user alex@openweek.test (see docs/testing.md).

/**
 * A day-column header — only the desktop grid renders these, so it is an unambiguous
 * "the week is up" signal. (The week-number pill is not: the mobile day strip renders a
 * weekday letter next to a date, so "W" + "19" reads as "W19" too.)
 */
const dayHeader = (page: Page) => page.getByRole('button', { name: /focus this day$/ })

async function signIn(page: Page) {
  await page.goto('/login')
  // Wait for hydration — clicking before Vue attaches @submit.prevent submits the form
  // natively and the page just reloads /login.
  await page.waitForLoadState('networkidle')
  await page.locator('#ow-email').fill('alex@openweek.test')
  await page.locator('#ow-password').fill('supersecret123')
  // The tabs are links, so this matches the submit button only.
  await page.getByRole('button', { name: 'Sign in' }).click()
  // Sign-in reloads rather than client-navigating; wait for the week to render.
  await expect(dayHeader(page).first()).toBeVisible({ timeout: 20_000 })
  // The grid is server-rendered, so it is visible before Vue has attached any handlers.
  // Without this the next click lands on inert markup and silently does nothing.
  await page.waitForLoadState('networkidle')
}

test('sign in lands on the week grid', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Openweek' })).toBeVisible()
  await signIn(page)
  await expect(dayHeader(page)).toHaveCount(7)
})

test('can add a task to a day', async ({ page }) => {
  await signIn(page)

  const title = `e2e task ${Date.now()}`
  await page.getByRole('button', { name: '＋ Add' }).first().click()
  const composer = page.getByPlaceholder('New task…').first()
  await composer.fill(title)
  await composer.press('Enter')

  await expect(page.getByText(title)).toBeVisible()
})

test('focusing a day widens its column', async ({ page }) => {
  await signIn(page)

  const grid = page.locator('[style*="grid-template-columns"]').first()
  const even = await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns)

  await dayHeader(page).first().click()
  await expect(page.getByText('FOCUS ×')).toBeVisible()

  const focused = await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns)
  expect(focused).not.toBe(even)
})
