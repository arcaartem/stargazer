import { test, expect } from '@playwright/test';
import { setupGitHubMocks, setupUserCredentials, setupMultiPageMocks } from './helpers/setup';

test.describe('Repository Fetching', () => {
	test.beforeEach(async ({ page }) => {
		// Setup mocks for GitHub API
		await setupGitHubMocks(page);

		// Setup user credentials
		await setupUserCredentials(page);
	});

	test('should fetch starred repositories successfully', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');

		// Click fetch button
		await page.click('button:has-text("Fetch Stars")');

		// Verify loading state
		await expect(page.locator('button:has-text("Fetching...")')).toBeVisible();

		// Verify progress bar appears
		await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();

		// Wait for completion
		await expect(page.locator('button:has-text("Fetch Stars")')).toBeVisible();

		// Verify repositories are displayed
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(3);

		// Verify specific repository content
		await expect(page.locator('text=awesome-project')).toBeVisible();
		await expect(page.locator('text=15,420')).toBeVisible(); // Star count
	});

	test('should handle pagination correctly', async ({ page }) => {
		// Setup multi-page mock
		await setupMultiPageMocks(page);

		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		// Verify progress updates
		await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();

		// Wait for completion
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(6); // Combined pages
	});

	test('should handle GitHub API errors', async ({ page }) => {
		// Mock API error
		await page.route('https://api.github.com/users/*/starred*', async (route) => {
			await route.fulfill({
				status: 401,
				contentType: 'application/json',
				body: JSON.stringify({ message: 'Bad credentials' })
			});
		});

		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		// Verify error message
		await expect(page.locator('.bg-red-50')).toContainText('Failed to fetch');

		// Verify error can be dismissed
		await page.click('button:has-text("Dismiss")');
		await expect(page.locator('.bg-red-50')).not.toBeVisible();
	});

	test('should handle network timeouts', async ({ page }) => {
		// Mock slow response
		await page.route('https://api.github.com/users/*/starred*', async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 10000)); // 10s delay
			await route.abort();
		});

		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		// Should eventually show error
		await expect(page.locator('.bg-red-50')).toContainText('error', { timeout: 15000 });
	});

	test('should show progress during fetch', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');

		// Start fetch
		await page.click('button:has-text("Fetch Stars")');

		// Progress should be visible
		await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();

		// Button should show loading state
		await expect(page.locator('button:has-text("Fetching...")')).toBeVisible();

		// Progress should disappear when done
		await expect(page.locator('[data-testid="progress-bar"]')).not.toBeVisible({ timeout: 10000 });
	});

	test('should handle empty repository list', async ({ page }) => {
		// Mock empty response
		await page.route('https://api.github.com/users/*/starred*', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([])
			});
		});

		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		// Should show empty state
		await expect(page.locator('text=No repositories found')).toBeVisible();
	});

	test('should disable fetch button while fetching', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');

		const fetchButton = page.locator('button:has-text("Fetch Stars")');

		// Click fetch button
		await fetchButton.click();

		// Button should be disabled during fetch
		await expect(page.locator('button:has-text("Fetching...")')).toBeDisabled();

		// Wait for completion
		await expect(fetchButton).toBeEnabled({ timeout: 10000 });
	});
});
