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

    // Wait for redirect to WorkGroups page
    await page.waitForURL(/\/project\/.*\/workgroups/)

    // Open Station dialog
    await main.getByRole('button', { name: 'Stations' }).click()
  })

  test('should add a new station', async ({ page }) => {
    // Add new station (when no stations, button says "Add First Station")
    await page.getByRole('button', { name: 'Add First Station' }).click()

    // Fill station details in dialog
    await page.getByLabel('Name', { exact: true }).fill('東京')
    await page.getByLabel('Full Name').fill('東京駅')
    await page.getByLabel('Longitude').fill('139.7673')
    await page.getByLabel('Latitude').fill('35.6812')

    // Save station
    await page.getByRole('button', { name: 'Save' }).click()

    // Verify station appears in table
    await expect(page.getByRole('cell', { name: '東京', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: '東京駅' })).toBeVisible()
  })

  test('should edit a station', async ({ page }) => {
    // First add a station
    await page.getByRole('button', { name: 'Add First Station' }).click()
    await page.getByLabel('Name', { exact: true }).fill('品川')
    await page.getByLabel('Full Name').fill('品川駅')
    await page.getByRole('button', { name: 'Save' }).click()

    // Edit the station (via Edit icon button with tooltip)
    await page.getByRole('button', { name: 'Edit' }).first().click()
    await page.getByLabel('Name', { exact: true }).clear()
    await page.getByLabel('Name', { exact: true }).fill('新品川')
    await page.getByRole('button', { name: 'Save' }).click()

    // Verify changes
    await expect(page.getByText('新品川')).toBeVisible()
  })

  test('should delete a station', async ({ page }) => {
    // First add a station
    await page.getByRole('button', { name: 'Add First Station' }).click()
    await page.getByLabel('Name', { exact: true }).fill('テスト駅')
    await page.getByRole('button', { name: 'Save' }).click()

    // Delete the station (uses window.confirm)
    page.on('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: 'Delete' }).first().click()

    // Verify station is removed (should show empty state again)
    await expect(page.getByText('テスト駅')).not.toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    // Open the create station dialog
    await page.getByRole('button', { name: 'Add First Station' }).click()

    // Name field is required - Save button should be disabled
    await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled()

    // Fill name and save button should be enabled
    await page.getByLabel('Name', { exact: true }).fill('Test')
    await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  test('should handle multiple stations', async ({ page }) => {
    const stations = [
      { name: '東京', fullName: '東京駅', lon: '139.7673', lat: '35.6812' },
      { name: '品川', fullName: '品川駅', lon: '139.7403', lat: '35.6285' },
      { name: '新橋', fullName: '新橋駅', lon: '139.7585', lat: '35.6658' },
    ]

    for (let i = 0; i < stations.length; i++) {
      const station = stations[i]
      // First station: "Create Station", subsequent: "Add Station"
      const buttonName = i === 0 ? 'Add First Station' : 'Add Station'
      await page.getByRole('button', { name: buttonName }).click()
      await page.getByLabel('Name', { exact: true }).fill(station.name)
      await page.getByLabel('Full Name').fill(station.fullName)
      await page.getByLabel('Longitude').fill(station.lon)
      await page.getByLabel('Latitude').fill(station.lat)
      await page.getByRole('button', { name: 'Save' }).click()
    }

    // Verify all stations are listed
    for (const station of stations) {
      await expect(page.getByText(station.name, { exact: true }).first()).toBeVisible()
    }
  })
})