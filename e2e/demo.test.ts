import { expect, test } from '@playwright/test';

test('home page redirects to search', async ({ page }) => {
	await page.goto('/');
	// Wait for redirect and verify we're on the search page
	await page.waitForURL('**/search');
	await expect(page).toHaveURL(/\/search$/);
});
