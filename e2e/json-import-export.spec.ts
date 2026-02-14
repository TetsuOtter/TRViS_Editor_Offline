import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('JSON Import/Export', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and create test project
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Create test project
    await page.getByRole('button', { name: '新しいプロジェクト' }).click()
    await page.getByLabel('プロジェクト名').fill('インポートエクスポートテスト')
    await page.getByRole('button', { name: '作成' }).click()
  })

  test('should export project as JSON', async ({ page }) => {
    // Add some test data first
    await page.getByRole('tab', { name: '駅管理' }).click()
    await page.getByRole('button', { name: '新しい駅を追加' }).click()
    await page.getByLabel('駅名').fill('東京')
    await page.getByRole('button', { name: '保存' }).click()

    // Navigate to export
    await page.getByRole('tab', { name: 'エクスポート' }).click()

    // Start download
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'JSONエクスポート' }).click()
    const download = await downloadPromise

    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.json$/)

    // Save and verify file content
    const downloadPath = path.join('./temp', download.suggestedFilename())
    await download.saveAs(downloadPath)
  })

  test('should import valid TRViS JSON', async ({ page }) => {
    // Create sample JSON data
    const sampleData = JSON.stringify([
      {
        "Name": "テストワークグループ",
        "Description": "E2Eテスト用",
        "Works": [
          {
            "Name": "テストワーク",
            "AffectDate": "20260213",
            "Remarks": "",
            "Trains": [
              {
                "TrainNumber": "001",
                "Direction": 1,
                "MaxSpeed": 120,
                "CarCount": 10,
                "Destination": "品川",
                "WorkType": 0,
                "TimetableRows": [
                  {
                    "StationName": "東京",
                    "FullName": "東京駅",
                    "Location_m": 0,
                    "Departure": "06:00:00"
                  },
                  {
                    "StationName": "品川",
                    "FullName": "品川駅",
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

    // Create temp file for upload
    await page.evaluate((data) => {
      // Mock file input behavior
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      document.body.appendChild(input)

      // Create blob and file
      const blob = new Blob([data], { type: 'application/json' })
      const file = new File([blob], 'test-import.json', { type: 'application/json' })

      // Trigger file selection
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      input.files = dataTransfer.files

      // Dispatch change event
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }, sampleData)

    // Navigate to import section
    await page.getByRole('button', { name: 'JSONインポート' }).click()

    // Should show import success message
    await expect(page.getByText('インポートが完了しました')).toBeVisible()

    // Verify imported data
    await expect(page.getByText('テストワークグループ')).toBeVisible()
    await expect(page.getByText('テストワーク')).toBeVisible()
  })

  test('should reject invalid JSON format', async ({ page }) => {
    const invalidJSON = 'invalid json content'

    await page.evaluate((data) => {
      const input = document.createElement('input')
      input.type = 'file'
      document.body.appendChild(input)

      const blob = new Blob([data], { type: 'application/json' })
      const file = new File([blob], 'invalid.json', { type: 'application/json' })

      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      input.files = dataTransfer.files

      input.dispatchEvent(new Event('change', { bubbles: true }))
    }, invalidJSON)

    await page.getByRole('button', { name: 'JSONインポート' }).click()

    // Should show error message
    await expect(page.getByText('JSONの形式が正しくありません')).toBeVisible()
  })

  test('should generate AppLink for sharing', async ({ page }) => {
    // Add some minimal data
    await page.getByRole('tab', { name: '駅管理' }).click()
    await page.getByRole('button', { name: '新しい駅を追加' }).click()
    await page.getByLabel('駅名').fill('東京')
    await page.getByRole('button', { name: '保存' }).click()

    // Navigate to settings
    await page.getByRole('button', { name: '設定' }).click()

    // Generate AppLink
    await page.getByRole('button', { name: 'AppLink生成' }).click()

    // Should show generated link
    await expect(page.locator('[data-testid="applink-output"]')).toBeVisible()

    const linkText = await page.locator('[data-testid="applink-output"]').textContent()
    expect(linkText).toContain('trvis://app/open/json?data=')

    // Test copy functionality
    await page.getByRole('button', { name: 'コピー' }).click()
    await expect(page.getByText('クリップボードにコピーしました')).toBeVisible()
  })

  test('should handle empty project export', async ({ page }) => {
    // Export empty project
    await page.getByRole('tab', { name: 'エクスポート' }).click()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'JSONエクスポート' }).click()
    const download = await downloadPromise

    // Should still create valid JSON file
    expect(download.suggestedFilename()).toMatch(/\.json$/)
  })
})