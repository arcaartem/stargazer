import { test, expect } from '@playwright/test';

test.describe('search page', () => {
	test('shows search input', async ({ page }) => {
		await page.goto('search');
		await expect(page.getByPlaceholder('Search repositories...')).toBeVisible();
	});

	test('shows empty state when no repos synced', async ({ page }) => {
		await page.goto('search');
		await expect(page.getByText('No repositories synced')).toBeVisible();
	});

	test('shows readme-only toggle', async ({ page }) => {
		await page.goto('search');
		await expect(page.getByText('Search READMEs only')).toBeVisible();
	});

	test('shows repository count in status bar', async ({ page }) => {
		await page.goto('search');
		await expect(page.getByText('0 repos', { exact: true })).toBeVisible();
	});
});
