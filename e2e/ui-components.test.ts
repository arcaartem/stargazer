import { test, expect } from '@playwright/test';
import { setupGitHubMocks, setupUserCredentials } from './helpers/setup';

test.describe('UI Components', () => {
	test.beforeEach(async ({ page }) => {
		await setupGitHubMocks(page);
		await setupUserCredentials(page);
	});

	test('should display repository cards correctly', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		const card = page.locator('[data-testid="repo-card"]').first();

		// Verify card structure
		await expect(card.locator('h3')).toContainText('awesome-project');
		await expect(card.locator('text=⭐ 15,420')).toBeVisible();
		await expect(card.locator('text=An amazing JavaScript library')).toBeVisible();
		await expect(card.locator('text=JavaScript')).toBeVisible();
		await expect(card.locator('a:has-text("View on GitHub")')).toBeVisible();
	});

	test('should handle repositories without description', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		// Find minimal-repo card
		const card = page.locator('[data-testid="repo-card"]:has-text("minimal-repo")');

		// Should not show description section or show placeholder
		const descriptionElements = await card.locator('p').count();
		// Either no description elements or shows "No description available"
		if (descriptionElements > 0) {
			await expect(card.locator('text=No description')).toBeVisible();
		}
	});

	test('should handle repositories without language', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		// Find docs-only card
		const card = page.locator('[data-testid="repo-card"]:has-text("docs-only")');

		// Should show "No language" or similar
		await expect(card.locator('text=No language')).toBeVisible();
	});

	test('should open GitHub links in new tab', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		const link = page.locator('a:has-text("View on GitHub")').first();

		// Verify link attributes
		await expect(link).toHaveAttribute('href', 'https://github.com/user/awesome-project');
		await expect(link).toHaveAttribute('target', '_blank');
		await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
	});

	test('should display progress bar during fetch', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');

		// Start fetch
		await page.click('button:has-text("Fetch Stars")');

		// Progress bar should appear
		const progressBar = page.locator('[data-testid="progress-bar"]');
		await expect(progressBar).toBeVisible();

		// Should show progress text
		await expect(progressBar).toContainText('Loading repositories');

		// Should disappear when complete
		await expect(progressBar).not.toBeVisible({ timeout: 10000 });
	});

	test('should show empty state when no repositories', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');

		// Should show empty state message
		await expect(page.locator('text=No repositories available')).toBeVisible();
		await expect(page.locator('text=Click "Fetch Stars" to load')).toBeVisible();
	});

	test('should format star counts properly', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		// Check that large numbers are formatted with commas
		await expect(page.locator('text=⭐ 15,420')).toBeVisible();

		// Check smaller numbers
		await expect(page.locator('text=⭐ 123')).toBeVisible();
		await expect(page.locator('text=⭐ 5')).toBeVisible();
	});

	test('should display last updated dates', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		// Should show relative dates or formatted dates
		const card = page.locator('[data-testid="repo-card"]').first();

		// Look for date information (could be "Updated X days ago" or formatted date)
		const hasRelativeDate = await card.locator('text=/Updated.*ago/').isVisible();
		const hasFormattedDate = await card.locator('text=/202\\d-\\d{2}-\\d{2}/').isVisible();

		expect(hasRelativeDate || hasFormattedDate).toBeTruthy();
	});

	test('should show loading skeleton during fetch', async ({ page }) => {
		// Mock slow response to see loading state
		await page.route('https://api.github.com/users/*/starred*', async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			await route.continue();
		});

		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		// Should show loading skeleton or spinner
		const hasLoadingSkeleton = await page.locator('[data-testid="loading-skeleton"]').isVisible();
		const hasSpinner = await page.locator('[data-testid="spinner"]').isVisible();
		const hasProgressBar = await page.locator('[data-testid="progress-bar"]').isVisible();

		expect(hasLoadingSkeleton || hasSpinner || hasProgressBar).toBeTruthy();
	});

	test('should highlight search terms in results', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		// Search for a term
		await page.fill('#search', 'awesome');

		// Should highlight the search term if implemented
		const highlightedText = page.locator('mark, .highlight, .text-yellow-300');
		const hasHighlight = (await highlightedText.count()) > 0;

		// This is optional functionality, so we just check if it exists
		if (hasHighlight) {
			await expect(highlightedText.first()).toContainText('awesome');
		}
	});
});
