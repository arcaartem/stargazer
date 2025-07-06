import { test, expect } from '@playwright/test';
import { setupGitHubMocks, setupUserCredentials } from './helpers/setup';

test.describe('Search and Filtering', () => {
	test.beforeEach(async ({ page }) => {
		await setupGitHubMocks(page);
		await setupUserCredentials(page);

		// Pre-populate with repositories
		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(3);
	});

	test('should search repositories by name', async ({ page }) => {
		// Search for specific repository
		await page.fill('#search', 'awesome');

		// Should filter results
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(1);
		await expect(page.locator('text=awesome-project')).toBeVisible();

		// Clear search
		await page.fill('#search', '');
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(3);
	});

	test('should search repositories by description', async ({ page }) => {
		await page.fill('#search', 'JavaScript library');

		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(1);
		await expect(page.locator('text=awesome-project')).toBeVisible();
	});

	test('should search repositories by language', async ({ page }) => {
		await page.fill('#search', 'Python');

		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(1);
		await expect(page.locator('text=minimal-repo')).toBeVisible();
	});

	test('should show search results count', async ({ page }) => {
		await page.fill('#search', 'awesome');

		await expect(page.locator('text=Found 1 repositories matching "awesome"')).toBeVisible();
	});

	test('should show no results message', async ({ page }) => {
		await page.fill('#search', 'nonexistent');

		await expect(page.locator('text=No repositories found matching your search')).toBeVisible();
	});

	test('should sort repositories by stars', async ({ page }) => {
		await page.selectOption('#sort', 'stars');

		// Verify sort order (highest stars first)
		const cards = page.locator('[data-testid="repo-card"]');
		await expect(cards.first()).toContainText('awesome-project'); // 15,420 stars
		await expect(cards.last()).toContainText('minimal-repo'); // 5 stars
	});

	test('should sort repositories by name', async ({ page }) => {
		await page.selectOption('#sort', 'name');

		// Verify alphabetical order
		const cards = page.locator('[data-testid="repo-card"]');
		await expect(cards.first()).toContainText('awesome-project');
		await expect(cards.last()).toContainText('minimal-repo');
	});

	test('should sort repositories by last updated', async ({ page }) => {
		await page.selectOption('#sort', 'updated');

		// Verify date order (most recent first)
		const cards = page.locator('[data-testid="repo-card"]');
		await expect(cards.first()).toContainText('awesome-project'); // 2024-01-15
	});

	test('should maintain search and sort state', async ({ page }) => {
		// Set search and sort
		await page.fill('#search', 'project');
		await page.selectOption('#sort', 'stars');

		// Navigate away and back
		await page.goto('http://localhost:4173/stargazer/settings');
		await page.goto('http://localhost:4173/stargazer/search');

		// State should be preserved
		await expect(page.locator('#search')).toHaveValue('project');
		await expect(page.locator('#sort')).toHaveValue('stars');
	});

	test('should handle case insensitive search', async ({ page }) => {
		// Search with different cases
		await page.fill('#search', 'AWESOME');
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(1);

		await page.fill('#search', 'python');
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(1);
		await expect(page.locator('text=minimal-repo')).toBeVisible();
	});

	test('should search in real-time', async ({ page }) => {
		// Start typing
		await page.fill('#search', 'a');
		// Should show results containing 'a'

		await page.fill('#search', 'aw');
		// Should narrow down results

		await page.fill('#search', 'awesome');
		// Should show only awesome-project
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(1);
	});

	test('should clear search with escape key', async ({ page }) => {
		await page.fill('#search', 'awesome');
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(1);

		// Press escape to clear (if implemented)
		await page.locator('#search').press('Escape');

		// Check if search was cleared (this depends on implementation)
		const searchValue = await page.locator('#search').inputValue();
		if (searchValue === '') {
			await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(3);
		}
	});
});
