import { test, expect } from '@playwright/test';

test.describe('Working Tests', () => {
	test('should load settings page correctly', async ({ page }) => {
		// Go directly to the correct URL
		await page.goto('http://localhost:4173/stargazer/settings');

		// Wait for the page to load
		await page.waitForTimeout(3000);

		// Check for the username input
		const usernameInput = page.locator('#username');
		await expect(usernameInput).toBeVisible({ timeout: 10000 });

		// Check for the token input
		const tokenInput = page.locator('#token');
		await expect(tokenInput).toBeVisible();

		// Check for the save button
		const saveButton = page.locator('button[type="submit"]');
		await expect(saveButton).toBeVisible();
		await expect(saveButton).toContainText('Save Settings');
	});

	test('should load search page correctly', async ({ page }) => {
		// Go directly to the correct URL
		await page.goto('http://localhost:4173/stargazer/search');

		// Wait for the page to load
		await page.waitForTimeout(3000);

		// Check for the search input
		const searchInput = page.locator('#search');
		await expect(searchInput).toBeVisible({ timeout: 10000 });

		// Check for the sort select
		const sortSelect = page.locator('#sort');
		await expect(sortSelect).toBeVisible();

		// Check for the fetch button
		const fetchButton = page.locator('button:has-text("Fetch Stars")');
		await expect(fetchButton).toBeVisible();
	});

	test('should be able to fill settings form', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/settings');

		// Wait for elements to be available
		await page.waitForSelector('#username', { timeout: 10000 });

		// Fill in the form
		await page.fill('#username', 'testuser');
		await page.fill('#token', 'test_token_123');

		// Check that the unsaved changes message appears
		await expect(page.locator('text=You have unsaved changes')).toBeVisible();

		// Check that the save button is enabled
		const saveButton = page.locator('button[type="submit"]');
		await expect(saveButton).toBeEnabled();
	});

	test('should be able to navigate between pages', async ({ page }) => {
		// Start at search page
		await page.goto('http://localhost:4173/stargazer/search');

		// Wait for page to load
		await page.waitForSelector('#search', { timeout: 10000 });

		// Click on Settings link in navigation
		await page.click('a:has-text("Settings")');

		// Should be on settings page now
		await expect(page.locator('#username')).toBeVisible({ timeout: 10000 });

		// Click on Search link in navigation
		await page.click('a:has-text("Search")');

		// Should be back on search page
		await expect(page.locator('#search')).toBeVisible({ timeout: 10000 });
	});
});
