import { test, expect } from '@playwright/test'

test.describe('Station Management', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and create test project
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    const main = page.locator('main')

    // Create test project
    await main.getByRole('button', { name: 'New Project' }).click()
    await page.getByLabel('Project Name').fill('E2E Station Test')
    await page.getByRole('button', { name: 'Create' }).click()

    // Navigate to stations tab
    await main.getByRole('tab', { name: 'Stations' }).click()
  })

  test('should add a new station', async ({ page }) => {
    const main = page.locator('main')

    // Add new station (when no stations, button says "Create Station")
    await main.getByRole('button', { name: 'Create Station' }).click()

    // Fill station details in dialog
    await page.getByLabel('Name', { exact: true }).fill('東京')
    await page.getByLabel('Full Name').fill('東京駅')
    await page.getByLabel('Longitude').fill('139.7673')
    await page.getByLabel('Latitude').fill('35.6812')

    // Save station
    await page.getByRole('button', { name: 'Save' }).click()

    // Verify station appears in table
    await expect(main.getByRole('cell', { name: '東京', exact: true })).toBeVisible()
    await expect(main.getByRole('cell', { name: '東京駅' })).toBeVisible()
  })

  test('should edit a station', async ({ page }) => {
    const main = page.locator('main')

    // First add a station
    await main.getByRole('button', { name: 'Create Station' }).click()
    await page.getByLabel('Name', { exact: true }).fill('品川')
    await page.getByLabel('Full Name').fill('品川駅')
    await page.getByRole('button', { name: 'Save' }).click()

    // Edit the station (via Edit Station icon button)
    await main.getByRole('button', { name: 'Edit Station' }).first().click()
    await page.getByLabel('Name', { exact: true }).clear()
    await page.getByLabel('Name', { exact: true }).fill('新品川')
    await page.getByRole('button', { name: 'Save' }).click()

    // Verify changes
    await expect(main.getByText('新品川')).toBeVisible()
  })

  test('should delete a station', async ({ page }) => {
    const main = page.locator('main')

    // First add a station
    await main.getByRole('button', { name: 'Create Station' }).click()
    await page.getByLabel('Name', { exact: true }).fill('テスト駅')
    await page.getByRole('button', { name: 'Save' }).click()

    // Delete the station (uses window.confirm)
    page.on('dialog', dialog => dialog.accept())
    await main.getByRole('button', { name: 'Delete Station' }).first().click()

    // Verify station is removed (should show empty state again)
    await expect(main.getByText('テスト駅')).not.toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    const main = page.locator('main')

    // Open the create station dialog
    await main.getByRole('button', { name: 'Create Station' }).click()

    // Name field is required - Save button should still be clickable
    // but the station won't be saved if name is empty
    await page.getByRole('button', { name: 'Save' }).click()

    // Dialog should stay open since name is empty (form doesn't submit)
    await expect(page.getByLabel('Name', { exact: true })).toBeVisible()
  })

  test('should handle multiple stations', async ({ page }) => {
    const main = page.locator('main')

    const stations = [
      { name: '東京', fullName: '東京駅', lon: '139.7673', lat: '35.6812' },
      { name: '品川', fullName: '品川駅', lon: '139.7403', lat: '35.6285' },
      { name: '新橋', fullName: '新橋駅', lon: '139.7585', lat: '35.6658' },
    ]

    for (let i = 0; i < stations.length; i++) {
      const station = stations[i]
      // First station: "Create Station", subsequent: "Add Station"
      const buttonName = i === 0 ? 'Create Station' : 'Add Station'
      await main.getByRole('button', { name: buttonName }).click()
      await page.getByLabel('Name', { exact: true }).fill(station.name)
      await page.getByLabel('Full Name').fill(station.fullName)
      await page.getByLabel('Longitude').fill(station.lon)
      await page.getByLabel('Latitude').fill(station.lat)
      await page.getByRole('button', { name: 'Save' }).click()
    }

    // Verify all stations are listed
    for (const station of stations) {
      await expect(main.getByText(station.name, { exact: true }).first()).toBeVisible()
    }
  })
})