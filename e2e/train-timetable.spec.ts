import { test, expect } from '@playwright/test'

test.describe('Train Timetable Management', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and set up test environment
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Create test project
    await page.getByRole('button', { name: '新しいプロジェクト' }).click()
    await page.getByLabel('プロジェクト名').fill('時刻表管理テスト')
    await page.getByRole('button', { name: '作成' }).click()

    // Add test stations
    await page.getByRole('tab', { name: '駅管理' }).click()
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

    // Create test line
    await page.getByRole('tab', { name: '路線管理' }).click()
    await page.getByRole('button', { name: '新しい路線を追加' }).click()
    await page.getByLabel('路線名').fill('JR東海道線')

    // Add stations to line
    await page.getByRole('button', { name: '駅を追加' }).click()
    await page.selectOption('[name="stationSelect"]', { label: '東京' })
    await page.getByLabel('距離 (m)').fill('0')
    await page.getByRole('button', { name: '追加' }).click()

    await page.getByRole('button', { name: '駅を追加' }).click()
    await page.selectOption('[name="stationSelect"]', { label: '新橋' })
    await page.getByLabel('距離 (m)').fill('2800')
    await page.getByRole('button', { name: '追加' }).click()

    await page.getByRole('button', { name: '駅を追加' }).click()
    await page.selectOption('[name="stationSelect"]', { label: '品川' })
    await page.getByLabel('距離 (m)').fill('6800')
    await page.getByRole('button', { name: '追加' }).click()

    await page.getByRole('button', { name: '路線を保存' }).click()

    // Create train type pattern
    await page.getByRole('tab', { name: '列車タイプ' }).click()
    await page.getByRole('button', { name: '新しいパターンを追加' }).click()
    await page.getByLabel('パターン名').fill('普通列車パターン')
    await page.selectOption('[name="lineSelect"]', { label: 'JR東海道線' })

    // Add intervals
    await page.getByRole('button', { name: '区間を追加' }).click()
    await page.selectOption('[name="fromStation"]', { label: '東京' })
    await page.selectOption('[name="toStation"]', { label: '新橋' })
    await page.getByLabel('走行時間（分）').fill('3')
    await page.getByLabel('走行時間（秒）').fill('0')
    await page.getByRole('button', { name: '区間追加' }).click()

    await page.getByRole('button', { name: '区間を追加' }).click()
    await page.selectOption('[name="fromStation"]', { label: '新橋' })
    await page.selectOption('[name="toStation"]', { label: '品川' })
    await page.getByLabel('走行時間（分）').fill('4')
    await page.getByLabel('走行時間（秒）').fill('0')
    await page.getByRole('button', { name: '区間追加' }).click()

    await page.getByRole('button', { name: 'パターンを保存' }).click()
  })

  test('should create work group and work', async ({ page }) => {
    // Create work group
    await page.getByRole('tab', { name: 'ワークグループ' }).click()
    await page.getByRole('button', { name: '新しいワークグループ' }).click()
    await page.getByLabel('ワークグループ名').fill('平日ダイヤ')
    await page.getByLabel('説明').fill('平日運行ダイヤ')
    await page.getByRole('button', { name: '作成' }).click()

    // Verify work group is created
    await expect(page.getByText('平日ダイヤ')).toBeVisible()

    // Create work within group
    await page.getByRole('button', { name: '新しいワーク' }).click()
    await page.getByLabel('ワーク名').fill('2月13日運行')
    await page.getByLabel('適用日').fill('20260213')
    await page.getByRole('button', { name: '作成' }).click()

    // Verify work is created
    await expect(page.getByText('2月13日運行')).toBeVisible()
  })

  test('should create train manually', async ({ page }) => {
    // Set up work group and work first
    await page.getByRole('tab', { name: 'ワークグループ' }).click()
    await page.getByRole('button', { name: '新しいワークグループ' }).click()
    await page.getByLabel('ワークグループ名').fill('テストダイヤ')
    await page.getByRole('button', { name: '作成' }).click()

    await page.getByRole('button', { name: '新しいワーク' }).click()
    await page.getByLabel('ワーク名').fill('テスト運行')
    await page.getByLabel('適用日').fill('20260213')
    await page.getByRole('button', { name: '作成' }).click()

    // Create train
    await page.getByRole('button', { name: '新しい列車' }).click()
    await page.getByLabel('列車番号').fill('001')
    await page.getByLabel('最高速度').fill('120')
    await page.getByLabel('車両数').fill('10')
    await page.getByLabel('行き先').fill('品川')
    await page.selectOption('[name="direction"]', { value: '1' })
    await page.getByRole('button', { name: '作成' }).click()

    // Verify train is created
    await expect(page.getByText('001')).toBeVisible()
    await expect(page.getByText('品川')).toBeVisible()
  })

  test('should generate train from pattern', async ({ page }) => {
    // Set up work group and work
    await page.getByRole('tab', { name: 'ワークグループ' }).click()
    await page.getByRole('button', { name: '新しいワークグループ' }).click()
    await page.getByLabel('ワークグループ名').fill('パターンテスト')
    await page.getByRole('button', { name: '作成' }).click()

    await page.getByRole('button', { name: '新しいワーク' }).click()
    await page.getByLabel('ワーク名').fill('パターン運行')
    await page.getByRole('button', { name: '作成' }).click()

    // Generate train from pattern
    await page.getByRole('button', { name: 'パターンから生成' }).click()
    await page.getByLabel('列車番号').fill('101')
    await page.selectOption('[name="pattern"]', { label: '普通列車パターン' })
    await page.getByLabel('出発時刻').fill('06:00:00')
    await page.getByLabel('最高速度').fill('120')
    await page.getByLabel('車両数').fill('10')
    await page.getByRole('button', { name: '生成' }).click()

    // Verify train is generated with timetable
    await expect(page.getByText('101')).toBeVisible()

    // Open timetable editor
    await page.getByRole('button', { name: '時刻表編集' }).click()

    // Verify timetable has been generated
    await expect(page.getByText('東京')).toBeVisible()
    await expect(page.getByText('06:00:00')).toBeVisible()  // Departure time
    await expect(page.getByText('06:03:00')).toBeVisible()  // Arrival at Shinbashi
    await expect(page.getByText('06:07:30')).toBeVisible()  // Arrival at Shinagawa
  })

  test('should edit timetable inline', async ({ page }) => {
    // Set up train with timetable (simplified setup)
    await page.getByRole('tab', { name: 'ワークグループ' }).click()
    await page.getByRole('button', { name: '新しいワークグループ' }).click()
    await page.getByLabel('ワークグループ名').fill('編集テスト')
    await page.getByRole('button', { name: '作成' }).click()

    await page.getByRole('button', { name: '新しいワーク' }).click()
    await page.getByLabel('ワーク名').fill('編集ワーク')
    await page.getByRole('button', { name: '作成' }).click()

    await page.getByRole('button', { name: 'パターンから生成' }).click()
    await page.getByLabel('列車番号').fill('201')
    await page.selectOption('[name="pattern"]', { label: '普通列車パターン' })
    await page.getByLabel('出発時刻').fill('08:00:00')
    await page.getByRole('button', { name: '生成' }).click()

    // Open timetable editor
    await page.getByRole('button', { name: '時刻表編集' }).click()

    // Edit departure time
    const departureCell = page.locator('[data-testid="timetable-cell-departure-0"]')
    await departureCell.dblclick()
    await departureCell.fill('08:05:00')
    await page.keyboard.press('Enter')

    // Verify change is saved
    await expect(departureCell).toHaveValue('08:05:00')

    // Verify cascading updates (if implemented)
    const arrivalCell = page.locator('[data-testid="timetable-cell-arrival-1"]')
    await expect(arrivalCell).toHaveValue('08:08:00') // Should update based on pattern
  })

  test('should clone an existing train', async ({ page }) => {
    // Set up train first
    await page.getByRole('tab', { name: 'ワークグループ' }).click()
    await page.getByRole('button', { name: '新しいワークグループ' }).click()
    await page.getByLabel('ワークグループ名').fill('複製テスト')
    await page.getByRole('button', { name: '作成' }).click()

    await page.getByRole('button', { name: '新しいワーク' }).click()
    await page.getByLabel('ワーク名').fill('複製ワーク')
    await page.getByRole('button', { name: '作成' }).click()

    await page.getByRole('button', { name: '新しい列車' }).click()
    await page.getByLabel('列車番号').fill('301')
    await page.getByLabel('最高速度').fill('130')
    await page.getByRole('button', { name: '作成' }).click()

    // Clone the train
    await page.getByRole('button', { name: '複製' }).click()
    await page.getByLabel('新しい列車番号').fill('302')
    await page.getByRole('button', { name: '複製実行' }).click()

    // Verify both trains exist
    await expect(page.getByText('301')).toBeVisible()
    await expect(page.getByText('302')).toBeVisible()
  })

  test('should delete a train', async ({ page }) => {
    // Set up train first
    await page.getByRole('tab', { name: 'ワークグループ' }).click()
    await page.getByRole('button', { name: '新しいワークグループ' }).click()
    await page.getByLabel('ワークグループ名').fill('削除テスト')
    await page.getByRole('button', { name: '作成' }).click()

    await page.getByRole('button', { name: '新しいワーク' }).click()
    await page.getByLabel('ワーク名').fill('削除ワーク')
    await page.getByRole('button', { name: '作成' }).click()

    await page.getByRole('button', { name: '新しい列車' }).click()
    await page.getByLabel('列車番号').fill('999')
    await page.getByRole('button', { name: '作成' }).click()

    // Delete the train
    await page.getByRole('button', { name: '削除' }).click()
    await page.getByRole('button', { name: '削除する' }).click()

    // Verify train is removed
    await expect(page.getByText('999')).not.toBeVisible()
  })
})