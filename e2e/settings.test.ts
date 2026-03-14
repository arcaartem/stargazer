import { test, expect } from '@playwright/test';

test.describe('settings page', () => {
	test('shows settings form', async ({ page }) => {
		await page.goto('settings');
		await expect(page.getByLabel('GitHub Username')).toBeVisible();
		await expect(page.getByLabel('Personal Access Token')).toBeVisible();
	});

	test('save button is disabled initially', async ({ page }) => {
		await page.goto('settings');
		await expect(page.getByRole('button', { name: 'Save Settings' })).toBeDisabled();
	});

	test('can enter username and token', async ({ page }) => {
		await page.goto('settings');
		await page.getByLabel('GitHub Username').fill('testuser');
		await page.getByLabel('Personal Access Token').fill('ghp_testtokenvalue12345');
		// Save button should be enabled after filling valid values
		await expect(page.getByRole('button', { name: 'Save Settings' })).toBeEnabled();
	});

	test('shows clear data button', async ({ page }) => {
		await page.goto('settings');
		await expect(page.getByRole('button', { name: 'Clear All Data' })).toBeVisible();
	});

	test('clear data shows confirmation', async ({ page }) => {
		await page.goto('settings');
		await page.getByRole('button', { name: 'Clear All Data' }).click();
		await expect(page.getByText('Are you sure?')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Yes, clear all data' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
	});
});
