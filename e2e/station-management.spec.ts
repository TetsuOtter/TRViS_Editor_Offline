import { test, expect } from '@playwright/test'

test.describe('Station Management', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and create test project
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Create test project
    await page.getByRole('button', { name: '新しいプロジェクト' }).click()
    await page.getByLabel('プロジェクト名').fill('E2E駅管理テスト')
    await page.getByRole('button', { name: '作成' }).click()

    // Navigate to stations tab
    await page.getByRole('tab', { name: '駅管理' }).click()
  })

  test('should add a new station', async ({ page }) => {
    // Add new station
    await page.getByRole('button', { name: '新しい駅を追加' }).click()

    // Fill station details
    await page.getByLabel('駅名').fill('東京')
    await page.getByLabel('駅名（フル）').fill('東京駅')
    await page.getByLabel('経度').fill('139.7673')
    await page.getByLabel('緯度').fill('35.6812')

    // Save station
    await page.getByRole('button', { name: '保存' }).click()

    // Verify station appears in list
    await expect(page.getByText('東京')).toBeVisible()
    await expect(page.getByText('東京駅')).toBeVisible()
  })

  test('should edit a station', async ({ page }) => {
    // First add a station
    await page.getByRole('button', { name: '新しい駅を追加' }).click()
    await page.getByLabel('駅名').fill('品川')
    await page.getByLabel('駅名（フル）').fill('品川駅')
    await page.getByRole('button', { name: '保存' }).click()

    // Edit the station
    await page.getByRole('button', { name: '編集' }).first().click()
    await page.getByLabel('駅名').clear()
    await page.getByLabel('駅名').fill('新品川')
    await page.getByRole('button', { name: '保存' }).click()

    // Verify changes
    await expect(page.getByText('新品川')).toBeVisible()
    await expect(page.getByText('品川')).not.toBeVisible()
  })

  test('should delete a station', async ({ page }) => {
    // First add a station
    await page.getByRole('button', { name: '新しい駅を追加' }).click()
    await page.getByLabel('駅名').fill('テスト駅')
    await page.getByRole('button', { name: '保存' }).click()

    // Delete the station
    await page.getByRole('button', { name: '削除' }).first().click()
    await page.getByRole('button', { name: '削除する' }).click()

    // Verify station is removed
    await expect(page.getByText('テスト駅')).not.toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    // Try to save station without name
    await page.getByRole('button', { name: '新しい駅を追加' }).click()
    await page.getByRole('button', { name: '保存' }).click()

    // Should show validation error
    await expect(page.getByText('駅名は必須です')).toBeVisible()
  })

  test('should handle multiple stations', async ({ page }) => {
    const stations = [
      { name: '東京', fullName: '東京駅', lon: '139.7673', lat: '35.6812' },
      { name: '品川', fullName: '品川駅', lon: '139.7403', lat: '35.6285' },
      { name: '新橋', fullName: '新橋駅', lon: '139.7585', lat: '35.6658' },
    ]

    for (const station of stations) {
      await page.getByRole('button', { name: '新しい駅を追加' }).click()
      await page.getByLabel('駅名').fill(station.name)
      await page.getByLabel('駅名（フル）').fill(station.fullName)
      await page.getByLabel('経度').fill(station.lon)
      await page.getByLabel('緯度').fill(station.lat)
      await page.getByRole('button', { name: '保存' }).click()
    }

    // Verify all stations are listed
    for (const station of stations) {
      await expect(page.getByText(station.name)).toBeVisible()
    }

    // Should show correct count
    await expect(page.getByText('3駅')).toBeVisible()
  })
})