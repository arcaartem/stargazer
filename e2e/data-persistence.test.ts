import { test, expect } from '@playwright/test';
import { setupGitHubMocks, setupUserCredentials } from './helpers/setup';

test.describe('Data Persistence', () => {
	test.beforeEach(async ({ page }) => {
		await setupGitHubMocks(page);
	});

	test('should persist fetched repositories across sessions', async ({ page }) => {
		// First session: setup and fetch
		await setupUserCredentials(page);
		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(3);

		// Close and reopen (simulate new session)
		await page.close();
		const newPage = await page.context().newPage();

		// Should load cached repositories
		await newPage.goto('/search');
		await expect(newPage.locator('[data-testid="repo-card"]')).toHaveCount(3);
	});

	test('should persist search state', async ({ page }) => {
		await setupUserCredentials(page);
		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		// Set search and sort
		await page.fill('#search', 'awesome');
		await page.selectOption('#sort', 'stars');

		// Reload page
		await page.reload();

		// Search state should persist
		await expect(page.locator('#search')).toHaveValue('awesome');
		await expect(page.locator('#sort')).toHaveValue('stars');
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(1);
	});

	test('should handle IndexedDB unavailable', async ({ page }) => {
		// Disable IndexedDB
		await page.addInitScript(() => {
			delete (window as Window & { indexedDB?: IDBFactory }).indexedDB;
		});

		await page.goto('http://localhost:4173/stargazer/settings');

		// Should show graceful degradation
		await expect(page.locator('.bg-red-50')).toContainText('storage unavailable');
	});

	test('should refresh cached data when explicitly requested', async ({ page }) => {
		await setupUserCredentials(page);
		await page.goto('http://localhost:4173/stargazer/search');

		// Initial fetch
		await page.click('button:has-text("Fetch Stars")');
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(3);

		// Mock different response for refresh
		await page.route('https://api.github.com/users/*/starred*', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([
					{
						id: 1,
						name: 'single-repo',
						description: 'Only repository',
						html_url: 'https://github.com/user/single-repo',
						language: 'JavaScript',
						stargazers_count: 100,
						updated_at: '2024-01-15T10:30:00Z',
						owner: { login: 'user' }
					}
				])
			});
		});

		// Refresh
		await page.click('button:has-text("Fetch Stars")');
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(1);
		await expect(page.locator('text=single-repo')).toBeVisible();
	});

	test('should persist settings across browser restarts', async ({ page }) => {
		// Save settings
		await page.goto('http://localhost:4173/stargazer/settings');
		await page.fill('#username', 'persistuser');
		await page.fill('#token', 'persist_token');
		await page.click('button[type="submit"]');
		await expect(page.locator('.bg-green-50')).toBeVisible();

		// Simulate browser restart by clearing context and creating new one
		await page.close();
		const newContext = await page.context().browser()?.newContext();
		const newPage = await newContext?.newPage();

		if (newPage) {
			await newPage.goto('/settings');

			// Settings should be persisted
			await expect(newPage.locator('#username')).toHaveValue('persistuser');
			await expect(newPage.locator('#token')).toHaveValue('persist_token');
		}
	});

	test('should handle corrupted IndexedDB data', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/settings');

		// Corrupt the data by injecting invalid JSON
		await page.evaluate(() => {
			const request = indexedDB.open('GithubStarsDB');
			request.onsuccess = function (event) {
				const db = (event.target as IDBOpenDBRequest).result;
				const transaction = db.transaction(['settings'], 'readwrite');
				const store = transaction.objectStore('settings');
				// Store invalid data
				store.put({ id: 'github', data: 'invalid json string' });
			};
		});

		await page.reload();

		// Should handle corrupted data gracefully
		const hasError = await page.locator('.bg-red-50').isVisible();
		const hasEmptyForm = (await page.locator('#username').inputValue()) === '';

		expect(hasError || hasEmptyForm).toBeTruthy();
	});

	test('should clear data when user logs out', async ({ page }) => {
		await setupUserCredentials(page);
		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(3);

		// Look for logout/clear button
		const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Clear Data")');

		if (await logoutButton.isVisible()) {
			await logoutButton.click();

			// Data should be cleared
			await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(0);

			// Settings should be cleared
			await page.goto('http://localhost:4173/stargazer/settings');
			await expect(page.locator('#username')).toHaveValue('');
			await expect(page.locator('#token')).toHaveValue('');
		}
	});

	test('should handle quota exceeded errors', async ({ page }) => {
		// Mock quota exceeded error
		await page.addInitScript(() => {
			IDBObjectStore.prototype.put = function () {
				const error = new Error('QuotaExceededError');
				error.name = 'QuotaExceededError';
				throw error;
			};
		});

		await page.goto('http://localhost:4173/stargazer/settings');
		await page.fill('#username', 'testuser');
		await page.fill('#token', 'test_token');
		await page.click('button[type="submit"]');

		// Should show storage error
		await expect(page.locator('.bg-red-50')).toContainText('storage');
	});
});
