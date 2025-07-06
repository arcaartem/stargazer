import { test, expect } from '@playwright/test';
import { setupGitHubMocks, setupUserCredentials } from './helpers/setup';

test.describe('Smoke Tests', () => {
	test('should complete basic user workflow', async ({ page }) => {
		// Setup mocks
		await setupGitHubMocks(page);

		// 1. Navigate to settings and save credentials
		await page.goto('http://localhost:4173/stargazer/settings');
		await page.fill('#username', 'testuser');
		await page.fill('#token', 'github_pat_test_token');
		await page.click('button[type="submit"]');
		await expect(page.locator('.bg-green-50')).toBeVisible();

		// 2. Navigate to search page
		await page.goto('http://localhost:4173/stargazer/search');
		await expect(page).toHaveURL(/\/search$/);

		// 3. Fetch repositories
		await page.click('button:has-text("Fetch Stars")');
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(3);

		// 4. Search repositories
		await page.fill('#search', 'awesome');
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(1);

		// 5. Sort repositories
		await page.fill('#search', '');
		await page.selectOption('#sort', 'stars');
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(3);
	});

	test('should handle application startup', async ({ page }) => {
		// App should start without errors
		await page.goto('http://localhost:4173/stargazer/');

		// Should redirect to search
		await page.waitForURL('**/search');
		await expect(page).toHaveURL(/\/search$/);

		// Page should load without console errors
		const logs: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				logs.push(msg.text());
			}
		});

		await page.waitForTimeout(1000);
		expect(logs.length).toBe(0);
	});

	test('should handle empty states gracefully', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');

		// Should show empty state
		await expect(page.locator('text=No repositories available')).toBeVisible();
		await expect(page.locator('button:has-text("Fetch Stars")')).toBeVisible();
	});

	test('should maintain functionality across page refreshes', async ({ page }) => {
		await setupGitHubMocks(page);
		await setupUserCredentials(page);

		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(3);

		// Refresh page
		await page.reload();

		// Should maintain state
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(3);
	});

	test('should be responsive on mobile', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		await setupGitHubMocks(page);
		await setupUserCredentials(page);

		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		// Should display properly on mobile
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(3);

		// Navigation should work
		await page.goto('http://localhost:4173/stargazer/settings');
		await expect(page).toHaveURL(/\/settings$/);
	});
});
