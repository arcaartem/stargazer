import { test, expect } from '@playwright/test';

test.describe('smoke tests', () => {
	test('app loads and shows navigation', async ({ page }) => {
		await page.goto('search');
		await expect(page.getByText('Stargazer')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Search' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
	});

	test('root redirects to search page', async ({ page }) => {
		await page.goto('');
		await page.waitForURL('**/search');
		expect(page.url()).toContain('/search');
	});

	test('can navigate between pages', async ({ page }) => {
		await page.goto('search');
		await page.getByRole('link', { name: 'Settings' }).click();
		await page.waitForURL('**/settings');
		await expect(page.getByRole('heading', { name: 'GitHub Credentials' })).toBeVisible();

		await page.getByRole('link', { name: 'Search' }).click();
		await page.waitForURL('**/search');
	});
});
