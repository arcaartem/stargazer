import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
	test('should redirect from root to search page', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/');
		await page.waitForLoadState('networkidle');

		// Should redirect to search page
		await expect(page).toHaveURL(/\/search$/);

		// Should have the correct title
		await expect(page).toHaveTitle('GitHub Stars Search');
	});

	test('should navigate to settings page', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/settings');
		await page.waitForLoadState('networkidle');

		// Should be on settings page
		await expect(page).toHaveURL(/\/settings$/);

		// Should have settings content
		await expect(page.locator('h1')).toHaveText('Settings', { timeout: 10000 });
	});

	test('should navigate to search page', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');
		await page.waitForLoadState('networkidle');

		// Should be on search page
		await expect(page).toHaveURL(/\/search$/);

		// Should have search form elements
		await expect(page.locator('#search')).toBeVisible({ timeout: 10000 });
	});

	test('should have working navigation links', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');
		await page.waitForLoadState('networkidle');

		// Wait for page to load
		await page.waitForSelector('#search', { timeout: 10000 });

		// Click settings link
		await page.click('a:has-text("Settings")');
		await page.waitForLoadState('networkidle');
		await expect(page).toHaveURL(/\/settings$/);

		// Click search link
		await page.click('a:has-text("Search")');
		await page.waitForLoadState('networkidle');
		await expect(page).toHaveURL(/\/search$/);
	});

	test('should handle browser back/forward navigation', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');
		await page.waitForLoadState('networkidle');
		await page.waitForSelector('#search', { timeout: 10000 });

		// Navigate to settings
		await page.click('a:has-text("Settings")');
		await page.waitForLoadState('networkidle');
		await page.waitForSelector('#username', { timeout: 10000 });

		// Go back
		await page.goBack();
		await page.waitForLoadState('networkidle');
		await expect(page).toHaveURL(/\/search$/);

		// Go forward
		await page.goForward();
		await page.waitForLoadState('networkidle');
		await expect(page).toHaveURL(/\/settings$/);
	});
});
