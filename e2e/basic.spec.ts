import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

// Smoke flow: sign in as the seeded account and land on the week grid.
// Run `pnpm db:seed` first — that is what creates this login (see docs/testing.md).

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
  await page.locator('#ow-email').fill('demo@openweek.test')
  await page.locator('#ow-password').fill('demo1234')
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

  // Scoped to the desktop grid: the mobile day view is in the DOM too (just hidden), and it
  // renders today's tasks as well — an unscoped locator matches the row twice.
  const grid = page.locator('[style*="grid-template-columns"]')
  const title = `e2e task ${Date.now()}`
  await grid.getByRole('button', { name: '＋ Add' }).first().click()
  const composer = grid.getByPlaceholder('New task…').first()
  await composer.fill(title)
  await composer.press('Enter')

  await expect(grid.getByText(title)).toBeVisible()
})

test('focusing a day widens its column', async ({ page }) => {
  await signIn(page)

  const grid = page.locator('[style*="grid-template-columns"]').first()
  const tracks = () => grid.evaluate(el => getComputedStyle(el).gridTemplateColumns)
  const even = await tracks()

  await dayHeader(page).first().click()
  await expect(page.getByText('FOCUS ×')).toBeVisible()

  // The columns animate over ~300ms, so poll rather than sampling once — a single read
  // lands mid-transition and can still see the even tracks.
  await expect.poll(tracks, { timeout: 5_000 }).not.toBe(even)
})
test('a ticked task is struck through before it folds away', async ({ page }) => {
  await signIn(page)

  const grid = page.locator('[style*="grid-template-columns"]')
  const column = grid.locator('> div').filter({ has: page.getByText('TODAY', { exact: true }) })

  // Its own task, so the test neither depends on nor consumes the seeded ones.
  const title = `e2e tick ${Date.now()}`
  await column.getByRole('button', { name: '＋ Add' }).click()
  const composer = column.getByPlaceholder('New task…')
  await composer.fill(title)
  const saved = page.waitForResponse(r => r.url().endsWith('/api/tasks') && r.request().method() === 'POST')
  await composer.press('Enter')
  await composer.press('Escape')
  // The row appears optimistically and is swapped for the saved one; wait that out, or the
  // tick below lands on a row that is about to be replaced.
  await saved
  const row = column.locator('.ow-task-row').filter({ hasText: title })
  await expect(row).toHaveCount(1)
  await row.getByRole('button', { name: /^Mark / }).click()

  /**
   * Row and strike-through read together, so the two can be compared at one instant.
   * Scoped to the grid: the mobile day view holds a hidden copy of the same task, and it has
   * no done-fold to take the row away.
   */
  const probe = () => page.evaluate((t) => {
    const desktop = document.querySelector('[style*="grid-template-columns"]')!
    const rows = [...desktop.querySelectorAll('.ow-task-row')].filter(r => r.textContent?.includes(t))
    const line = rows[0]?.querySelector('.ow-strike')
    return { present: rows.length > 0, drawn: line ? getComputedStyle(line).backgroundSize : null }
  }, title)

  // The order is the feature: the line finishes drawing while the row is still standing, and
  // only then does the row fold away. Sampled rather than slept on, so it is the sequence
  // being asserted and not a duration.
  let struckWhileStanding = false
  await expect.poll(async () => {
    const { present, drawn } = await probe()
    if (present && drawn?.startsWith('100%')) struckWhileStanding = true
    return present
  }, { timeout: 5_000, intervals: [50] }).toBe(false)

  expect(struckWhileStanding).toBe(true)
})

test('the lists rail resizes, and hides when dragged to the floor', async ({ page }) => {
  await signIn(page)

  // A known starting point: on screen, and back to its natural height. Both are stored per
  // account, so without this the test inherits whatever the last run left behind.
  expect((await page.request.patch('/api/me/settings', {
    data: { showLists: true, listsHeight: 0 },
  })).ok()).toBeTruthy()
  await page.reload()
  await expect(dayHeader(page).first()).toBeVisible({ timeout: 20_000 })
  await page.waitForLoadState('networkidle')

  const rail = page.locator('.ow-rail')
  const grip = page.locator('[role="separator"]')
  const height = async () => Math.round((await rail.boundingBox())!.height)
  const grip_ = async () => {
    const box = (await grip.boundingBox())!
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  }
  const natural = await height()

  // Up is taller: the handle pulls the rail's top edge with it.
  const up = await grip_()
  await page.mouse.move(up.x, up.y)
  await page.mouse.down()
  await page.mouse.move(up.x, up.y - 100, { steps: 10 })
  await page.mouse.up()
  await expect.poll(height).toBeGreaterThan(natural + 80)
  const dragged = await height()

  // The floor is a position, not a delta, so drag to the bottom of the window.
  const down = await grip_()
  await page.mouse.move(down.x, down.y)
  await page.mouse.down()
  await page.mouse.move(down.x, page.viewportSize()!.height - 8, { steps: 10 })
  await page.mouse.up()
  await expect(rail).toHaveCount(0)

  // The toolbar switch brings it back the size it was, not the size it was hidden at.
  await page.getByRole('switch', { name: 'Show lists' }).click()
  await expect(rail).toBeVisible()
  await expect.poll(height).toBe(dragged)
})
