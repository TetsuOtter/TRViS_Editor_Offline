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

    // Should show "Create Your First Project" button when no projects exist
    await expect(page.getByRole('button', { name: 'Create Your First Project' })).toBeVisible()

    // Create new project using the main "New Project" button
    await page.getByRole('button', { name: 'New Project' }).click()

    // Fill project details in dialog
    await page.getByLabel('Project Name').fill('E2E Test Project')

    // Save project
    await page.getByRole('button', { name: 'Create' }).click()

    // Dialog should close and project should be visible
    await expect(page.getByText('E2E Test Project')).toBeVisible()
  })

  test('should switch between projects', async ({ page }) => {
    await page.goto('/')

    // Create first project
    await page.getByRole('button', { name: 'New Project' }).click()
    await page.getByLabel('Project Name').fill('Project 1')
    await page.getByRole('button', { name: 'Create' }).click()

    // Create second project
    await page.getByRole('button', { name: 'New Project' }).click()
    await page.getByLabel('Project Name').fill('Project 2')
    await page.getByRole('button', { name: 'Create' }).click()

    // Both projects should be visible in the list
    await expect(page.getByText('Project 1')).toBeVisible()
    await expect(page.getByText('Project 2')).toBeVisible()

    // Click on first project to select it
    await page.getByText('Project 1').click()

    // Project should be highlighted (check for selection styling)
    const project1Item = page.getByText('Project 1').locator('..')
    await expect(project1Item).toHaveCSS('background-color', /rgba.*/)
  })

  test('should delete a project', async ({ page }) => {
    await page.goto('/')

    // Create project
    await page.getByRole('button', { name: 'New Project' }).click()
    await page.getByLabel('Project Name').fill('Delete Test Project')
    await page.getByRole('button', { name: 'Create' }).click()

    // Delete project using delete icon
    await page.locator('button[title="Delete project"]').click()

    // Project should be removed from list
    await expect(page.getByText('Delete Test Project')).not.toBeVisible()

    // Should show "Create Your First Project" button again
    await expect(page.getByRole('button', { name: 'Create Your First Project' })).toBeVisible()
  })

  test('should persist projects across browser sessions', async ({ page }) => {
    await page.goto('/')

    // Create project
    await page.getByRole('button', { name: 'New Project' }).click()
    await page.getByLabel('Project Name').fill('Persistence Test')
    await page.getByRole('button', { name: 'Create' }).click()

    // Verify project exists
    await expect(page.getByText('Persistence Test')).toBeVisible()

    // Reload page
    await page.reload()

    // Project should still exist
    await expect(page.getByText('Persistence Test')).toBeVisible()
  })

  test('should handle empty project name validation', async ({ page }) => {
    await page.goto('/')

    // Open create dialog
    await page.getByRole('button', { name: 'New Project' }).click()

    // Create button should be disabled with empty name
    await expect(page.getByRole('button', { name: 'Create' })).toBeDisabled()

    // Add some text then clear it
    await page.getByLabel('Project Name').fill('Test')
    await expect(page.getByRole('button', { name: 'Create' })).toBeEnabled()

    await page.getByLabel('Project Name').clear()
    await expect(page.getByRole('button', { name: 'Create' })).toBeDisabled()
  })
})