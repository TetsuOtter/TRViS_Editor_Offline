import { test, expect } from '@playwright/test';

test.describe('Breadcrumb Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should navigate back to project list from WorkListPage when breadcrumb Projects link is clicked', async ({ page }) => {
    const main = page.locator('main');

    // Step 1: Create a project
    await main.getByRole('button', { name: 'New Project' }).click();
    await page.getByLabel('Project Name').fill('Breadcrumb Test Project');
    await page.getByRole('button', { name: 'Create' }).click();

    // Wait for redirect to WorkGroups page
    await page.waitForURL(/\/project\/.*\/workgroups/);
    await page.waitForLoadState('networkidle');

    // Step 2: Create a WorkGroup
    const workGroupMain = page.locator('main');
    await workGroupMain.getByRole('button', { name: 'Create WorkGroup' }).click();
    await page.getByLabel('WorkGroup Name').fill('Test WorkGroup');
    await page.getByRole('button', { name: 'Create' }).click();

    // Wait for stable state after WorkGroup creation
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Step 3: Navigate to Works page
    const updatedMain = page.locator('main');
    await updatedMain.getByRole('button', { name: 'Open' }).click();
    await page.waitForURL(/\/works$/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify we're on the WorkListPage
    const worksMain = page.locator('main');
    await expect(worksMain.locator('h4').filter({ hasText: 'Works' })).toBeVisible();

    // Step 4: Click on "Projects" breadcrumb link to navigate back to project selector
    await page.getByRole('link', { name: 'Projects' }).click();

    // Should navigate to "/" which shows the project selector
    await page.waitForURL('/', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Step 5: Verify we're back at the project selector page
    // The ProjectSelector component should be visible with projects listed
    const selectorMain = page.locator('main');
    await expect(selectorMain.locator('h4').filter({ hasText: 'Projects' })).toBeVisible();

    // Verify the project we created is visible in the selector
    await expect(selectorMain.getByText('Breadcrumb Test Project')).toBeVisible();
  });

  test('should navigate back to project list from WorkGroupListPage when breadcrumb Projects link is clicked', async ({ page }) => {
    const main = page.locator('main');

    // Step 1: Create a project
    await main.getByRole('button', { name: 'New Project' }).click();
    await page.getByLabel('Project Name').fill('WorkGroup Navigation Test');
    await page.getByRole('button', { name: 'Create' }).click();

    // Wait for redirect to WorkGroups page
    await page.waitForURL(/\/project\/.*\/workgroups/);
    await page.waitForLoadState('networkidle');

    // Step 2: Create a WorkGroup
    const workGroupMain = page.locator('main');
    await workGroupMain.getByRole('button', { name: 'Create WorkGroup' }).click();
    await page.getByLabel('WorkGroup Name').fill('Navigation Test Group');
    await page.getByRole('button', { name: 'Create' }).click();

    // Wait for stable state after WorkGroup creation
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Verify we're on the WorkGroupListPage
    const verifyMain = page.locator('main');
    await expect(verifyMain.locator('h4').filter({ hasText: 'WorkGroups' })).toBeVisible();

    // Step 3: Click on "Projects" breadcrumb link to navigate back to project selector
    await page.getByRole('link', { name: 'Projects' }).click();

    // Should navigate to "/" which shows the project selector
    await page.waitForURL('/', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Step 4: Verify we're back at the project selector page
    const selectorMain = page.locator('main');
    await expect(selectorMain.locator('h4').filter({ hasText: 'Projects' })).toBeVisible();

    // Verify the project we created is visible in the selector
    await expect(selectorMain.getByText('WorkGroup Navigation Test')).toBeVisible();
  });

  test('should navigate between different projects using breadcrumb siblings', async ({ page }) => {
    const main = page.locator('main');

    // Step 1: Create first project
    await main.getByRole('button', { name: 'New Project' }).click();
    await page.getByLabel('Project Name').fill('Project A');
    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForURL(/\/project\/.*\/workgroups/);
    await page.waitForLoadState('networkidle');

    // Step 2: Navigate back to create second project
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const main2 = page.locator('main');
    await main2.getByRole('button', { name: 'New Project' }).click();
    await page.getByLabel('Project Name').fill('Project B');
    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForURL(/\/project\/.*\/workgroups/);
    await page.waitForLoadState('networkidle');

    // Step 3: Create a WorkGroup in Project B
    const main3 = page.locator('main');
    await main3.getByRole('button', { name: 'Create WorkGroup' }).click();
    await page.getByLabel('WorkGroup Name').fill('WorkGroup B');
    await page.getByRole('button', { name: 'Create' }).click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Step 4: Navigate to Works page
    const main4 = page.locator('main');
    await main4.getByRole('button', { name: 'Open' }).click();
    await page.waitForURL(/\/works$/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Step 5: Verify breadcrumb shows current project context
    const breadcrumbProjects = page.getByRole('link', { name: 'Projects' });
    await expect(breadcrumbProjects).toBeVisible();

    // Step 6: Navigate back to project selector
    await breadcrumbProjects.click();
    await page.waitForURL('/');
    await page.waitForLoadState('networkidle');

    // Step 7: Verify both projects are visible
    const finalMain = page.locator('main');
    await expect(finalMain.getByText('Project A')).toBeVisible();
    await expect(finalMain.getByText('Project B')).toBeVisible();
  });

  test('should persist project selection when navigating via breadcrumb then back', async ({ page }) => {
    const main = page.locator('main');

    // Step 1: Create a project
    await main.getByRole('button', { name: 'New Project' }).click();
    await page.getByLabel('Project Name').fill('Persistence Test');
    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForURL(/\/project\/.*\/workgroups/);
    const projectId = page.url().match(/\/project\/([^/]+)\//)?.[1];
    await page.waitForLoadState('networkidle');

    // Step 2: Create a WorkGroup
    const main2 = page.locator('main');
    await main2.getByRole('button', { name: 'Create WorkGroup' }).click();
    await page.getByLabel('WorkGroup Name').fill('Persistence WorkGroup');
    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Step 3: Navigate to project selector via breadcrumb
    const main3 = page.locator('main');
    await main3.getByRole('button', { name: 'Open' }).click();
    await page.waitForURL(/\/works$/);
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: 'Projects' }).click();
    await page.waitForURL('/');
    await page.waitForLoadState('networkidle');

    // Step 4: Click on the project name in the project selector to return to it
    const selectorMain = page.locator('main');
    await selectorMain.getByText('Persistence Test').first().click();

    // Should be back on the workgroups page for the same project
    await page.waitForURL(/\/project\/.*\/workgroups/);
    await page.waitForLoadState('networkidle');

    // Verify we're on the correct project
    const verifyMain = page.locator('main');
    await expect(verifyMain.getByText('Persistence WorkGroup')).toBeVisible();
  });
});
