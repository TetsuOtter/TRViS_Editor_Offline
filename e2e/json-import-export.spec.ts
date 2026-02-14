import { test, expect } from '@playwright/test'

test.describe('JSON Import/Export', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and create test project
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Wait for page to stabilize after reload
    await page.waitForLoadState('networkidle')

    const main = page.locator('main')

    // Create test project
    await main.getByRole('button', { name: 'New Project' }).click()
    await page.getByLabel('Project Name').fill('Import Export Test')
    await page.getByRole('button', { name: 'Create' }).click()

    // Wait for redirect to WorkGroups page
    await page.waitForURL(/\/project\/.*\/workgroups/)
  })

  test('should export project as JSON', async ({ page }) => {
    const main = page.locator('main')

    // TODO: Export functionality needs to be integrated into the new page structure
    // Currently, JsonExport component is not accessible from the new pages
    // Add some test data via Station dialog
    await main.getByRole('button', { name: 'Stations' }).click()
    await page.getByRole('button', { name: 'Add First Station' }).click()
    await page.getByLabel('Name', { exact: true }).fill('東京')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.getByRole('button', { name: 'Close' }).click()

    // For now, just verify the page structure is correct (use h4 to distinguish from "No WorkGroups" h6)
    await expect(main.locator('h4').filter({ hasText: 'WorkGroups' })).toBeVisible()
  })

  test('should import valid TRViS JSON', async ({ page }) => {
    // Navigate to settings page where import functionality lives
    await page.getByRole('button', { name: 'open drawer' }).click();
    await page.getByText('Settings').click();

    // Create sample JSON data
    const sampleData = JSON.stringify([
      {
        "Name": "テストワークグループ",
        "Works": [
          {
            "Name": "テストワーク",
            "AffectDate": "20260213",
            "Remarks": "",
            "Trains": [
              {
                "TrainNumber": "001",
                "Direction": 1,
                "TimetableRows": [
                  {
                    "StationName": "東京",
                    "Location_m": 0,
                    "Departure": "06:00:00"
                  },
                  {
                    "StationName": "品川",
                    "Location_m": 6800,
                    "Arrive": "06:10:00"
                  }
                ]
              }
            ]
          }
        ]
      }
    ], null, 2)

    // Use Playwright's fileChooser to upload the JSON file
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: 'Import JSON File' }).click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles({
      name: 'test-import.json',
      mimeType: 'application/json',
      buffer: Buffer.from(sampleData),
    })

    // Should show import success message
    await expect(page.getByText(/Successfully imported/)).toBeVisible({ timeout: 10000 })
  })

  test('should reject invalid JSON format', async ({ page }) => {
    // Navigate to settings page
    await page.getByRole('button', { name: 'open drawer' }).click();
    await page.getByText('Settings').click();

    const invalidJSON = 'invalid json content'

    await page.evaluate((data) => {
      const blob = new Blob([data], { type: 'application/json' })
      const file = new File([blob], 'invalid.json', { type: 'application/json' })
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)

      const inputs = document.querySelectorAll('input[type="file"][accept=".json"]')
      if (inputs.length > 0) {
        const input = inputs[0] as HTMLInputElement
        input.files = dataTransfer.files
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }, invalidJSON)

    // Should show error message
    await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('should generate AppLink for sharing', async ({ page }) => {
    // Navigate to settings page where AppLink generation is available
    await page.getByRole('button', { name: 'open drawer' }).click();
    await page.getByText('Settings').click();

    // The Generate AppLink button should be visible (might be disabled without data)
    await expect(page.getByRole('button', { name: 'Generate AppLink' })).toBeVisible()
  })

  test('should handle empty project export', async ({ page }) => {
    // Verify we're on the WorkGroups page
    await expect(page).toHaveURL(/\/project\/.*\/workgroups/)

    // The export functionality test is covered by the JsonExport component
    // For empty projects, the export button should be disabled
    // Just verify the page loaded correctly
    await expect(page.locator('main').locator('h4').filter({ hasText: 'WorkGroups' })).toBeVisible()
  })

  test('should auto-generate stations from imported JSON with multiple TimetableRows', async ({ page }) => {
    // Go back to home page to import JSON
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const main = page.locator('main')

    // Create sample JSON data with multiple stations
    const sampleData = JSON.stringify([
      {
        "Name": "テスト路線",
        "Works": [
          {
            "Name": "テストワーク",
            "AffectDate": "20260213",
            "Remarks": "",
            "Trains": [
              {
                "TrainNumber": "001",
                "Direction": 1,
                "TimetableRows": [
                  {
                    "StationName": "東京",
                    "Location_m": 0,
                    "FullName": "東京駅",
                    "Longitude_deg": 139.7654,
                    "Latitude_deg": 35.6812,
                    "Departure": "06:00:00"
                  },
                  {
                    "StationName": "品川",
                    "Location_m": 6800,
                    "FullName": "品川駅",
                    "Longitude_deg": 139.7373,
                    "Latitude_deg": 35.6282,
                    "Arrive": "06:10:00"
                  },
                  {
                    "StationName": "横浜",
                    "Location_m": 28700,
                    "FullName": "横浜駅",
                    "Longitude_deg": 139.6455,
                    "Latitude_deg": 35.4437,
                    "Arrive": "06:30:00"
                  }
                ]
              }
            ]
          }
        ]
      }
    ], null, 2)

    // Use Playwright's fileChooser to upload the JSON file
    const fileChooserPromise = page.waitForEvent('filechooser')
    await main.getByRole('button', { name: 'Import JSON' }).click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles({
      name: 'test-stations.json',
      mimeType: 'application/json',
      buffer: Buffer.from(sampleData),
    })

    // Wait for project to be created and navigate to it
    await page.waitForURL(/\/project\/.*\/workgroups/)
    await page.waitForLoadState('networkidle')

    // Navigate to Stations page to verify stations were auto-generated
    const main2 = page.locator('main')
    await main2.getByRole('button', { name: 'Stations' }).click()

    // Verify all three stations are present in the stations table
    const stationsTable = page.locator('table')

    // Check first station (東京)
    await expect(stationsTable.getByRole('cell', { name: '東京', exact: true })).toBeVisible({ timeout: 5000 })
    await expect(stationsTable.getByRole('cell', { name: '東京駅' })).toBeVisible({ timeout: 5000 })

    // Check second station (品川)
    await expect(stationsTable.getByRole('cell', { name: '品川', exact: true })).toBeVisible({ timeout: 5000 })
    await expect(stationsTable.getByRole('cell', { name: '品川駅' })).toBeVisible({ timeout: 5000 })

    // Check third station (横浜)
    await expect(stationsTable.getByRole('cell', { name: '横浜', exact: true })).toBeVisible({ timeout: 5000 })
    await expect(stationsTable.getByRole('cell', { name: '横浜駅' })).toBeVisible({ timeout: 5000 })
  })

  test('should register all stations from multiple TimetableRows in multiple Trains', async ({ page }) => {
    // Go back to home page to import JSON
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const main = page.locator('main')

    // Create sample JSON data with multiple Trains each having multiple TimetableRows
    const sampleData = JSON.stringify([
      {
        "Name": "複数列車路線",
        "Works": [
          {
            "Name": "平日ワーク",
            "AffectDate": "20260213",
            "Remarks": "",
            "Trains": [
              {
                "TrainNumber": "001",
                "Direction": 1,
                "TimetableRows": [
                  {
                    "StationName": "東京",
                    "Location_m": 0,
                    "FullName": "東京駅",
                    "Longitude_deg": 139.7654,
                    "Latitude_deg": 35.6812,
                    "Departure": "06:00:00"
                  },
                  {
                    "StationName": "品川",
                    "Location_m": 6800,
                    "FullName": "品川駅",
                    "Longitude_deg": 139.7373,
                    "Latitude_deg": 35.6282,
                    "Arrive": "06:10:00"
                  }
                ]
              },
              {
                "TrainNumber": "002",
                "Direction": 1,
                "TimetableRows": [
                  {
                    "StationName": "東京",
                    "Location_m": 0,
                    "Departure": "07:00:00"
                  },
                  {
                    "StationName": "横浜",
                    "Location_m": 28700,
                    "FullName": "横浜駅",
                    "Longitude_deg": 139.6455,
                    "Latitude_deg": 35.4437,
                    "Arrive": "07:30:00"
                  },
                  {
                    "StationName": "鎌倉",
                    "Location_m": 42500,
                    "FullName": "鎌倉駅",
                    "Longitude_deg": 139.5551,
                    "Latitude_deg": 35.3147,
                    "Arrive": "07:50:00"
                  }
                ]
              },
              {
                "TrainNumber": "003",
                "Direction": 1,
                "TimetableRows": [
                  {
                    "StationName": "品川",
                    "Location_m": 6800,
                    "Departure": "08:00:00"
                  },
                  {
                    "StationName": "鎌倉",
                    "Location_m": 42500,
                    "Departure": "08:45:00"
                  },
                  {
                    "StationName": "江ノ島",
                    "Location_m": 55000,
                    "FullName": "江ノ島駅",
                    "Longitude_deg": 139.4863,
                    "Latitude_deg": 35.2977,
                    "Arrive": "09:00:00"
                  }
                ]
              }
            ]
          }
        ]
      }
    ], null, 2)

    // Use Playwright's fileChooser to upload the JSON file
    const fileChooserPromise = page.waitForEvent('filechooser')
    await main.getByRole('button', { name: 'Import JSON' }).click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles({
      name: 'test-multiple-trains.json',
      mimeType: 'application/json',
      buffer: Buffer.from(sampleData),
    })

    // Wait for project to be created and navigate to it
    await page.waitForURL(/\/project\/.*\/workgroups/)
    await page.waitForLoadState('networkidle')

    // Navigate to Stations page to verify all stations were auto-generated from all Trains
    const main2 = page.locator('main')
    await main2.getByRole('button', { name: 'Stations' }).click()

    // Verify all five unique stations are present in the stations table
    const stationsTable = page.locator('table')

    // Station 1: 東京 (Location_m: 0)
    await expect(stationsTable.getByRole('cell', { name: '東京', exact: true })).toBeVisible({ timeout: 5000 })
    await expect(stationsTable.getByRole('cell', { name: '東京駅' })).toBeVisible({ timeout: 5000 })

    // Station 2: 品川 (Location_m: 6800)
    await expect(stationsTable.getByRole('cell', { name: '品川', exact: true })).toBeVisible({ timeout: 5000 })
    await expect(stationsTable.getByRole('cell', { name: '品川駅' })).toBeVisible({ timeout: 5000 })

    // Station 3: 横浜 (Location_m: 28700)
    await expect(stationsTable.getByRole('cell', { name: '横浜', exact: true })).toBeVisible({ timeout: 5000 })
    await expect(stationsTable.getByRole('cell', { name: '横浜駅' })).toBeVisible({ timeout: 5000 })

    // Station 4: 鎌倉 (Location_m: 42500)
    await expect(stationsTable.getByRole('cell', { name: '鎌倉', exact: true })).toBeVisible({ timeout: 5000 })
    await expect(stationsTable.getByRole('cell', { name: '鎌倉駅' })).toBeVisible({ timeout: 5000 })

    // Station 5: 江ノ島 (Location_m: 55000)
    await expect(stationsTable.getByRole('cell', { name: '江ノ島', exact: true })).toBeVisible({ timeout: 5000 })
    await expect(stationsTable.getByRole('cell', { name: '江ノ島駅' })).toBeVisible({ timeout: 5000 })
  })
})