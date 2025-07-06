import { test, expect } from '@playwright/test';
import { setupUserCredentials } from './helpers/setup';

test.describe('Error Handling', () => {
	test('should handle missing credentials gracefully', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');

		// Try to fetch without credentials
		await page.click('button:has-text("Fetch Stars")');

		// Should show error about missing token
		await expect(page.locator('.bg-red-50')).toContainText('GitHub token required');
	});

	test('should handle GitHub API rate limiting', async ({ page }) => {
		await setupUserCredentials(page);

		// Mock rate limit response
		await page.route('https://api.github.com/users/*/starred*', async (route) => {
			await route.fulfill({
				status: 403,
				contentType: 'application/json',
				body: JSON.stringify({
					message: 'API rate limit exceeded',
					documentation_url:
						'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting'
				})
			});
		});

		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		await expect(page.locator('.bg-red-50')).toContainText('rate limit');
	});

	test('should handle invalid GitHub credentials', async ({ page }) => {
		await setupUserCredentials(page, 'invalid_token');

		// Mock unauthorized response
		await page.route('https://api.github.com/users/*/starred*', async (route) => {
			await route.fulfill({
				status: 401,
				contentType: 'application/json',
				body: JSON.stringify({ message: 'Bad credentials' })
			});
		});

		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		await expect(page.locator('.bg-red-50')).toContainText('credentials');
	});

	test('should handle GitHub API server errors', async ({ page }) => {
		await setupUserCredentials(page);

		// Mock server error
		await page.route('https://api.github.com/users/*/starred*', async (route) => {
			await route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({ message: 'Internal Server Error' })
			});
		});

		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		await expect(page.locator('.bg-red-50')).toContainText('server error');
	});

	test('should allow error dismissal', async ({ page }) => {
		await setupUserCredentials(page);

		// Mock error
		await page.route('https://api.github.com/users/*/starred*', async (route) => {
			await route.fulfill({ status: 500 });
		});

		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		// Error should appear
		await expect(page.locator('.bg-red-50')).toBeVisible();

		// Dismiss error
		await page.click('button:has-text("Dismiss")');

		// Error should disappear
		await expect(page.locator('.bg-red-50')).not.toBeVisible();
	});

	test('should handle network connectivity issues', async ({ page }) => {
		await setupUserCredentials(page);

		// Mock network error
		await page.route('https://api.github.com/users/*/starred*', async (route) => {
			await route.abort('internetdisconnected');
		});

		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		// Should show network error
		await expect(page.locator('.bg-red-50')).toContainText('network');
	});

	test('should retry failed requests', async ({ page }) => {
		await setupUserCredentials(page);
		let attemptCount = 0;

		// Mock intermittent failure
		await page.route('https://api.github.com/users/*/starred*', async (route) => {
			attemptCount++;
			if (attemptCount === 1) {
				await route.fulfill({ status: 500 });
			} else {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([])
				});
			}
		});

		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		// Should eventually succeed on retry
		await expect(page.locator('.bg-green-50, text=No repositories found')).toBeVisible();
	});
});
