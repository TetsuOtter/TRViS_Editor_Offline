import { test, expect } from '@playwright/test'

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should create a new project', async ({ page }) => {
    await page.goto('/')

    const main = page.locator('main')

    // Should show project selector when no projects exist
    await expect(main.getByRole('button', { name: 'Create Your First Project' })).toBeVisible()

    // Create new project using the main "New Project" button
    await main.getByRole('button', { name: 'New Project' }).click()

    // Fill project details in dialog
    await page.getByLabel('Project Name').fill('E2E Test Project')

    // Save project
    await page.getByRole('button', { name: 'Create' }).click()

    // Should redirect to WorkGroups page
    await page.waitForURL(/\/project\/.*\/workgroups/)
    
    // Verify we're on the WorkGroups page
    await expect(main.getByRole('heading', { name: 'WorkGroups' })).toBeVisible()
  })

  test('should switch between projects', async ({ page }) => {
    await page.goto('/')

    const main = page.locator('main')

    // Create first project
    await main.getByRole('button', { name: 'New Project' }).click()
    await page.getByLabel('Project Name').fill('Project 1')
    await page.getByRole('button', { name: 'Create' }).click()

    // Should redirect, go back to project list
    await page.goto('/')

    // Create second project
    await main.getByRole('button', { name: 'New Project' }).click()
    await page.getByLabel('Project Name').fill('Project 2')
    await page.getByRole('button', { name: 'Create' }).click()

    // Should redirect, go back to project list
    await page.goto('/')

    // Both projects should be visible in the project list
    await expect(main.getByText('Project 1').first()).toBeVisible()
    await expect(main.getByText('Project 2').first()).toBeVisible()

    // Click on first project to select it (use list item)
    await main.locator('li').filter({ hasText: 'Project 1' }).click()

    // Should redirect to WorkGroups page for Project 1
    await page.waitForURL(/\/project\/.*\/workgroups/)
  })

  test('should delete a project', async ({ page }) => {
    await page.goto('/')

    const main = page.locator('main')

    // Create project
    await main.getByRole('button', { name: 'New Project' }).click()
    await page.getByLabel('Project Name').fill('Delete Test Project')
    await page.getByRole('button', { name: 'Create' }).click()

    // Go back to project list
    await page.goto('/')

    // Delete project using delete icon (MUI Tooltip sets aria-label)
    await main.getByRole('button', { name: 'Delete project' }).click()

    // Project should be removed from list
    await expect(main.getByText('Delete Test Project')).not.toBeVisible()

    // Should show "Create Your First Project" button again
    await expect(main.getByRole('button', { name: 'Create Your First Project' })).toBeVisible()
  })

  test('should persist projects across browser sessions', async ({ page }) => {
    await page.goto('/')

    const main = page.locator('main')

    // Create project
    await main.getByRole('button', { name: 'New Project' }).click()
    await page.getByLabel('Project Name').fill('Persistence Test')
    await page.getByRole('button', { name: 'Create' }).click()

    // Go back to project list
    await page.goto('/')

    // Verify project exists
    await expect(main.getByText('Persistence Test').first()).toBeVisible()

    // Reload page
    await page.reload()

    // Project should still exist
    await expect(main.getByText('Persistence Test').first()).toBeVisible()
  })

  test('should handle empty project name validation', async ({ page }) => {
    await page.goto('/')

    const main = page.locator('main')

    // Open create dialog
    await main.getByRole('button', { name: 'New Project' }).click()

    // Create button should be disabled with empty name
    await expect(page.getByRole('button', { name: 'Create' })).toBeDisabled()

    // Add some text then clear it
    await page.getByLabel('Project Name').fill('Test')
    await expect(page.getByRole('button', { name: 'Create' })).toBeEnabled()

    await page.getByLabel('Project Name').clear()
    await expect(page.getByRole('button', { name: 'Create' })).toBeDisabled()
  })
})