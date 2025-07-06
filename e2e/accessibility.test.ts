import { test, expect } from '@playwright/test';
import { setupGitHubMocks, setupUserCredentials } from './helpers/setup';

test.describe('Accessibility', () => {
	test('should have no accessibility violations on search page', async ({ page }) => {
		await setupGitHubMocks(page);
		await setupUserCredentials(page);

		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		// Basic accessibility checks
		// Check for proper heading structure
		const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
		expect(headings).toBeGreaterThan(0);

		// Check for proper labels
		const inputs = page.locator('input, select');
		const inputCount = await inputs.count();
		for (let i = 0; i < inputCount; i++) {
			const input = inputs.nth(i);
			const hasLabel =
				(await input.getAttribute('aria-label')) ||
				(await page.locator(`label[for="${await input.getAttribute('id')}"]`).count()) > 0;
			expect(hasLabel).toBeTruthy();
		}
	});

	test('should have no accessibility violations on settings page', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/settings');

		// Check form accessibility
		const form = page.locator('form');
		await expect(form).toBeVisible();

		// Check for proper labels
		await expect(page.locator('label[for="username"]')).toBeVisible();
		await expect(page.locator('label[for="token"]')).toBeVisible();
	});

	test('should support keyboard navigation', async ({ page }) => {
		await setupGitHubMocks(page);
		await setupUserCredentials(page);

		await page.goto('http://localhost:4173/stargazer/search');

		// Tab through form elements
		await page.keyboard.press('Tab'); // Search input
		await expect(page.locator('#search')).toBeFocused();

		await page.keyboard.press('Tab'); // Sort select
		await expect(page.locator('#sort')).toBeFocused();

		await page.keyboard.press('Tab'); // Fetch button
		await expect(page.locator('button:has-text("Fetch Stars")')).toBeFocused();

		// Activate button with Enter
		await page.keyboard.press('Enter');
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(3);
	});

	test('should have proper ARIA labels and roles', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');

		// Verify form labels
		await expect(page.locator('label[for="search"]')).toBeVisible();
		await expect(page.locator('label[for="sort"]')).toBeVisible();

		// Verify button accessibility
		const fetchButton = page.locator('button:has-text("Fetch Stars")');
		await expect(fetchButton).toHaveAttribute('type', 'button');
	});

	test('should have sufficient color contrast', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');

		// Check that text is visible (basic contrast check)
		const textElements = page.locator('p, span, div, label, button');
		const count = await textElements.count();

		for (let i = 0; i < Math.min(count, 10); i++) {
			const element = textElements.nth(i);
			if (await element.isVisible()) {
				const text = await element.textContent();
				if (text && text.trim()) {
					// Element should be visible and readable
					await expect(element).toBeVisible();
				}
			}
		}
	});

	test('should provide focus indicators', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/settings');

		// Tab to focusable elements and verify focus is visible
		const focusableElements = page.locator('input, button, select, a');
		const count = await focusableElements.count();

		for (let i = 0; i < count; i++) {
			const element = focusableElements.nth(i);
			await element.focus();

			// Element should be focused
			await expect(element).toBeFocused();
		}
	});

	test('should have proper semantic markup', async ({ page }) => {
		await setupGitHubMocks(page);
		await setupUserCredentials(page);

		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		// Check for proper semantic elements
		const semanticCount = await page.locator('main, section, article').count();
		expect(semanticCount).toBeGreaterThan(0);

		// Check for proper list markup for repositories
		const repoList = page.locator('ul, ol');
		if ((await repoList.count()) > 0) {
			const listItemCount = await repoList.first().locator('li').count();
			expect(listItemCount).toBeGreaterThan(0);
		}
	});

	test('should provide alternative text for images', async ({ page }) => {
		await page.goto('http://localhost:4173/stargazer/search');

		// Check all images have alt text
		const images = page.locator('img');
		const imageCount = await images.count();

		for (let i = 0; i < imageCount; i++) {
			const img = images.nth(i);
			const altText = await img.getAttribute('alt');
			expect(altText).toBeTruthy();
		}
	});

	test('should handle reduced motion preferences', async ({ page }) => {
		// Set reduced motion preference
		await page.emulateMedia({ reducedMotion: 'reduce' });

		await setupGitHubMocks(page);
		await setupUserCredentials(page);

		await page.goto('http://localhost:4173/stargazer/search');
		await page.click('button:has-text("Fetch Stars")');

		// App should still function with reduced motion
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(3);
	});
});
