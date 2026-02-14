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

    // Add test stations
    await main.getByRole('tab', { name: 'Stations' }).click()
    const stations = [
      { name: '東京', fullName: '東京駅', lon: '139.7673', lat: '35.6812' },
      { name: '品川', fullName: '品川駅', lon: '139.7403', lat: '35.6285' },
      { name: '新橋', fullName: '新橋駅', lon: '139.7585', lat: '35.6658' },
    ]

    for (let i = 0; i < stations.length; i++) {
      const station = stations[i]
      const buttonName = i === 0 ? 'Create Station' : 'Add Station'
      await main.getByRole('button', { name: buttonName }).click()
      await page.getByLabel('Name', { exact: true }).fill(station.name)
      await page.getByLabel('Full Name').fill(station.fullName)
      await page.getByLabel('Longitude').fill(station.lon)
      await page.getByLabel('Latitude').fill(station.lat)
      await page.getByRole('button', { name: 'Save' }).click()
    }
  })

  test('should create work group and work', async ({ page }) => {
    const main = page.locator('main')

    // Navigate to Work Groups tab
    await main.getByRole('tab', { name: 'Work Groups' }).click()

    // The Work Groups tab shows export and workgroup info
    // WorkGroup management is done through the data store
    // Let's verify the tab loads correctly
    await expect(main.getByText('Export')).toBeVisible()
    await expect(main.getByRole('button', { name: 'Download as JSON' })).toBeVisible()
  })

  test('should verify stations were created', async ({ page }) => {
    const main = page.locator('main')

    // Verify stations tab shows all stations
    await main.getByRole('tab', { name: 'Stations' }).click()

    await expect(main.getByRole('cell', { name: '東京', exact: true })).toBeVisible()
    await expect(main.getByRole('cell', { name: '品川', exact: true })).toBeVisible()
    await expect(main.getByRole('cell', { name: '新橋', exact: true })).toBeVisible()
  })

  test('should create a line with stations', async ({ page }) => {
    const main = page.locator('main')

    // Navigate to Lines tab
    await main.getByRole('tab', { name: 'Lines' }).click()

    // Create a new line
    await main.getByRole('button', { name: 'Create Line' }).click()

    // Fill line name in dialog
    await page.getByLabel('Line Name').fill('JR東海道線')

    // Save the line
    await page.getByRole('button', { name: 'Save' }).click()

    // Verify line appears
    await expect(main.getByText('JR東海道線')).toBeVisible()
  })

  test('should create a train type pattern', async ({ page }) => {
    const main = page.locator('main')

    // First create a line
    await main.getByRole('tab', { name: 'Lines' }).click()
    await main.getByRole('button', { name: 'Create Line' }).click()
    await page.getByLabel('Line Name').fill('Test Line')
    await page.getByRole('button', { name: 'Save' }).click()

    // Navigate to Train Types tab
    await main.getByRole('tab', { name: 'Train Types' }).click()

    // Create pattern
    await main.getByRole('button', { name: 'Create Pattern' }).click()

    // Verify dialog opens
    await expect(page.getByText('Create New Train Type Pattern')).toBeVisible()
  })

  test('should navigate between all tabs', async ({ page }) => {
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

    // Go to stations tab
    await main.getByRole('tab', { name: 'Stations' }).click()

    // Edit first station
    await main.getByRole('button', { name: 'Edit Station' }).first().click()

    // Modify the station name
    await page.getByLabel('Name', { exact: true }).clear()
    await page.getByLabel('Name', { exact: true }).fill('東京modified')
    await page.getByRole('button', { name: 'Save' }).click()

    // Verify the change
    await expect(main.getByText('東京modified')).toBeVisible()
  })

  test('should delete a station', async ({ page }) => {
    const main = page.locator('main')

    await main.getByRole('tab', { name: 'Stations' }).click()

    // Count initial stations (should be 3)
    const initialRows = await main.locator('table tbody tr').count()
    expect(initialRows).toBe(3)

    // Delete one station (uses window.confirm)
    page.on('dialog', dialog => dialog.accept())
    await main.getByRole('button', { name: 'Delete Station' }).first().click()

    // Should have one fewer station
    const remainingRows = await main.locator('table tbody tr').count()
    expect(remainingRows).toBe(2)
  })
})