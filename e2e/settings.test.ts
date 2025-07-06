import { test, expect } from '@playwright/test';

test.describe('Settings Management', () => {
	test.beforeEach(async ({ page }) => {
		// Go to settings page and wait for it to load
		await page.goto('http://localhost:4173/stargazer/settings');
		await page.waitForLoadState('networkidle');

		// Wait for the form to be visible
		await page.waitForSelector('#username', { timeout: 10000 });
	});

	test('should display settings form', async ({ page }) => {
		// Check form elements are present
		await expect(page.locator('#username')).toBeVisible();
		await expect(page.locator('#token')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();

		// Check labels are present
		await expect(page.locator('label[for="username"]')).toContainText('GitHub Username');
		await expect(page.locator('label[for="token"]')).toContainText('GitHub Personal Access Token');
	});

	test('should save user credentials', async ({ page }) => {
		// Fill in credentials
		await page.fill('#username', 'testuser');
		await page.fill('#token', 'ghp_test123');

		// Should show unsaved changes
		await expect(page.locator('text=You have unsaved changes')).toBeVisible();

		// Save settings
		await page.click('button[type="submit"]');

		// Should show success message
		await expect(page.locator('.bg-green-50')).toBeVisible({ timeout: 5000 });
		await expect(page.locator('text=Settings saved successfully')).toBeVisible();
	});

	test('should validate required fields', async ({ page }) => {
		// Button should be disabled when no changes are made
		await expect(page.locator('button[type="submit"]')).toBeDisabled();

		// Fill one field
		await page.fill('#username', 'testuser');

		// Button should now be enabled
		await expect(page.locator('button[type="submit"]')).toBeEnabled();
	});

	test('should show dirty state when fields are modified', async ({ page }) => {
		// Make changes
		await page.fill('#username', 'testuser');

		// Should show dirty state indicator
		await expect(page.locator('text=You have unsaved changes')).toBeVisible();

		// Should enable save button
		await expect(page.locator('button[type="submit"]')).toBeEnabled();
	});

	test('should clear success message after new changes', async ({ page }) => {
		// Save some credentials
		await page.fill('#username', 'testuser');
		await page.fill('#token', 'ghp_test123');
		await page.click('button[type="submit"]');

		// Wait for success message
		await expect(page.locator('.bg-green-50')).toBeVisible();

		// Make new changes
		await page.fill('#username', 'newuser');

		// Success message should be gone
		await expect(page.locator('.bg-green-50')).toBeHidden();

		// Should show unsaved changes
		await expect(page.locator('text=You have unsaved changes')).toBeVisible();
	});
});
