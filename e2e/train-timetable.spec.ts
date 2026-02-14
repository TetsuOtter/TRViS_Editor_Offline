import { test, expect } from '@playwright/test'

test.describe('Train Timetable Management', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and set up test environment
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    const main = page.locator('main')

    // Create test project
    await main.getByRole('button', { name: 'New Project' }).click()
    await page.getByLabel('Project Name').fill('Timetable Test')
    await page.getByRole('button', { name: 'Create' }).click()

    // Wait for redirect to WorkGroups page
    await page.waitForURL(/\/project\/.*\/workgroups/)

    // Add test stations via Station dialog
    await main.getByRole('button', { name: 'Stations' }).click()
    const stations = [
      { name: '東京', fullName: '東京駅', lon: '139.7673', lat: '35.6812' },
      { name: '品川', fullName: '品川駅', lon: '139.7403', lat: '35.6285' },
      { name: '新橋', fullName: '新橋駅', lon: '139.7585', lat: '35.6658' },
    ]

    for (let i = 0; i < stations.length; i++) {
      const station = stations[i]
      const buttonName = i === 0 ? 'Add First Station' : 'Add Station'
      await page.getByRole('button', { name: buttonName }).click()
      await page.getByLabel('Name', { exact: true }).fill(station.name)
      await page.getByLabel('Full Name').fill(station.fullName)
      await page.getByLabel('Longitude').fill(station.lon)
      await page.getByLabel('Latitude').fill(station.lat)
      await page.getByRole('button', { name: 'Save' }).click()
    }

    // Close Station dialog
    await page.getByRole('button', { name: 'Close' }).click()
  })

  test('should create work group and work', async ({ page }) => {
    const main = page.locator('main')

    // Create WorkGroup
    await main.getByRole('button', { name: 'Create WorkGroup' }).click()
    await page.getByLabel('WorkGroup Name').fill('Test WorkGroup')
    await page.getByRole('button', { name: 'Create' }).click()

    // Verify WorkGroup is created
    await expect(main.getByText('Test WorkGroup')).toBeVisible()
  })

  test('should verify stations were created', async ({ page }) => {
    const main = page.locator('main')

    // Open Station dialog to verify stations
    await main.getByRole('button', { name: 'Stations' }).click()

    await expect(page.getByRole('cell', { name: '東京', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: '品川', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: '新橋', exact: true })).toBeVisible()

    // Close dialog
    await page.getByRole('button', { name: 'Close' }).click()
  })

  test('should create a line with stations', async ({ page }) => {
    const main = page.locator('main')

    // Open Line dialog
    await main.getByRole('button', { name: 'Lines' }).click()

    // Create a new line
    await page.getByRole('button', { name: 'Add First Line' }).click()

    // Fill line name in dialog
    await page.getByLabel('Line Name').fill('JR東海道線')

    // Save the line
    await page.getByRole('button', { name: 'Save' }).click()

    // Verify line appears
    await expect(page.getByText('JR東海道線')).toBeVisible()

    // Close dialog
    await page.locator('button:has-text("Close")').last().click()
  })

  test('should navigate between all pages', async ({ page }) => {
    const main = page.locator('main')

    // Test all tabs are accessible
    const tabNames = ['Work Groups', 'Stations', 'Lines', 'Train Types']

    for (const tabName of tabNames) {
      await main.getByRole('tab', { name: tabName }).click()
      // Verify tab content loads (tab should be selected)
      await expect(main.getByRole('tab', { name: tabName })).toHaveAttribute('aria-selected', 'true')
    }
  })

  test('should edit station details', async ({ page }) => {
    const main = page.locator('main')

    // Open Stations dialog
    await main.getByRole('button', { name: 'Stations' }).click()
    const stationDialog = page.locator('div[role="dialog"]')
    await expect(stationDialog).toBeVisible()

    // Edit first station
    await stationDialog.getByRole('button', { name: 'Edit Station' }).first().click()

    // Wait for edit dialog to open
    const editDialogs = page.locator('div[role="dialog"]')
    await expect(editDialogs.nth(1)).toBeVisible()

    // Modify the station name
    await page.getByLabel('Name', { exact: true }).clear()
    await page.getByLabel('Name', { exact: true }).fill('東京modified')
    await page.getByRole('button', { name: 'Save' }).click()

    // Wait for edit dialog to close
    await expect(editDialogs.nth(1)).not.toBeVisible()

    // Verify the change in the station list dialog
    await expect(stationDialog.getByText('東京modified')).toBeVisible()

    // Close station dialog
    await page.getByRole('button', { name: 'Close' }).click()
  })

  test('should delete a station', async ({ page }) => {
    const main = page.locator('main')

    // Open Stations dialog
    await main.getByRole('button', { name: 'Stations' }).click()
    const stationDialog = page.locator('div[role="dialog"]')
    await expect(stationDialog).toBeVisible()

    // Count initial stations (should be 3)
    const initialRows = await stationDialog.locator('table tbody tr').count()
    expect(initialRows).toBe(3)

    // Delete one station (uses window.confirm)
    page.on('dialog', dialog => dialog.accept())
    await stationDialog.getByRole('button', { name: 'Delete Station' }).first().click()

    // Should have one fewer station
    const remainingRows = await stationDialog.locator('table tbody tr').count()
    expect(remainingRows).toBe(2)

    // Close station dialog
    await page.getByRole('button', { name: 'Close' }).click()
  })
})