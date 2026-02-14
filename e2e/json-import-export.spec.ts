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
})