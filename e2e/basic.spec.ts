import { expect, test } from '@playwright/test'

// Smoke flow: sign in as the seeded admin and land on the week grid.
// Assumes a registered user alex@openweek.test (see docs/testing.md).
test('sign in lands on the week grid', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await page.getByPlaceholder('Email').fill('alex@openweek.test')
  await page.getByPlaceholder('Password').fill('supersecret123')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText(/WEEK \d+/)).toBeVisible()
})

test('can add a task to today', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('Email').fill('alex@openweek.test')
  await page.getByPlaceholder('Password').fill('supersecret123')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText(/WEEK \d+/)).toBeVisible()

  const title = `e2e task ${Date.now()}`
  const composer = page.getByPlaceholder('Write a task').first()
  await composer.fill(title)
  await composer.press('Enter')
  await expect(page.getByText(title)).toBeVisible()
})
