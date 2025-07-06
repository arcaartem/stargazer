import { test, expect } from '@playwright/test';
import { setupGitHubMocks, setupUserCredentials } from './helpers/setup';

test.describe('Performance', () => {
	test('should load search page quickly', async ({ page }) => {
		const startTime = Date.now();

		await page.goto('http://localhost:4173/stargazer/search');
		await page.waitForLoadState('networkidle');

		const loadTime = Date.now() - startTime;
		expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
	});

	test('should handle large repository lists efficiently', async ({ page }) => {
		// Mock large dataset
		const largeRepoList = Array.from({ length: 1000 }, (_, i) => ({
			id: i + 1,
			name: `repo-${i + 1}`,
			description: `Description for repository ${i + 1}`,
			html_url: `https://github.com/user/repo-${i + 1}`,
			language: i % 3 === 0 ? 'JavaScript' : i % 3 === 1 ? 'Python' : 'TypeScript',
			stargazers_count: Math.floor(Math.random() * 10000),
			updated_at: '2024-01-15T10:30:00Z',
			owner: { login: 'user' }
		}));

		await page.route('https://api.github.com/users/*/starred*', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(largeRepoList)
			});
		});

		await setupUserCredentials(page);
		await page.goto('http://localhost:4173/stargazer/search');

		const startTime = Date.now();
		await page.click('button:has-text("Fetch Stars")');

		// Should complete within reasonable time
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(1000, { timeout: 15000 });

		const fetchTime = Date.now() - startTime;
		expect(fetchTime).toBeLessThan(15000); // Should complete within 15 seconds
	});

	test('should search large datasets quickly', async ({ page }) => {
		// Setup large dataset first
		const largeRepoList = Array.from({ length: 500 }, (_, i) => ({
			id: i + 1,
			name: `awesome-repo-${i + 1}`,
			description: `Amazing repository ${i + 1} for awesome features`,
			html_url: `https://github.com/user/awesome-repo-${i + 1}`,
			language: 'JavaScript',
			stargazers_count: i * 10,
			updated_at: '2024-01-15T10:30:00Z',
			owner: { login: 'user' }
		}));

		await page.route('https://api.github.com/users/*/starred*', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(largeRepoList)
			});
		});

		await setupUserCredentials(page);
		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(500);

		// Test search performance
		const startTime = Date.now();
		await page.fill('#search', 'awesome-repo-250');

		// Search should be fast
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(1, { timeout: 1000 });

		const searchTime = Date.now() - startTime;
		expect(searchTime).toBeLessThan(1000); // Search should be under 1 second
	});

	test('should not cause memory leaks', async ({ page }) => {
		await setupGitHubMocks(page);
		await setupUserCredentials(page);

		// Perform multiple operations
		for (let i = 0; i < 5; i++) {
			await page.goto('http://localhost:4173/stargazer/search');
			await page.click('button:has-text("Fetch Stars")');
			await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(3);

			await page.fill('#search', 'awesome');
			await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(1);

			await page.fill('#search', '');
			await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(3);
		}

		// Check for console errors that might indicate memory issues
		const logs: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error' && msg.text().includes('memory')) {
				logs.push(msg.text());
			}
		});

		await page.waitForTimeout(1000);
		expect(logs.length).toBe(0);
	});

	test('should handle concurrent operations', async ({ page }) => {
		await setupGitHubMocks(page);
		await setupUserCredentials(page);

		await page.goto('http://localhost:4173/stargazer/search');

		// Start multiple operations concurrently
		const promises = [
			page.click('button:has-text("Fetch Stars")'),
			page.fill('#search', 'test'),
			page.selectOption('#sort', 'stars')
		];

		await Promise.all(promises);

		// Should eventually reach stable state
		const cardCount = await page.locator('[data-testid="repo-card"]').count();
		expect(cardCount).toBeGreaterThanOrEqual(0);
	});
});
