# End-to-End Testing Plan for Stargazer

## Overview

This document outlines a comprehensive end-to-end testing strategy for Stargazer, a GitHub stars search application. The tests will cover core user workflows without making actual network calls to GitHub API.

## Project Context

**Stargazer** is a Svelte application that allows users to:

- Configure GitHub credentials (username and personal access token)
- Fetch all starred repositories from GitHub
- Search and filter repositories locally
- View repository details and navigate to GitHub

## Testing Strategy

### 1. Mock Strategy for Network Calls

To avoid real GitHub API calls, we'll use Playwright's request interception to mock all external requests:

```typescript
// Mock GitHub API responses
await page.route('https://api.github.com/users/*/starred*', async (route) => {
	await route.fulfill({
		status: 200,
		contentType: 'application/json',
		body: JSON.stringify(mockRepositories),
		headers: {
			Link: '<https://api.github.com/user/starred?page=2>; rel="next", <https://api.github.com/user/starred?page=3>; rel="last"'
		}
	});
});
```

### 2. Test Data

Create comprehensive mock data representing various GitHub repository scenarios:

```typescript
const mockRepositories = [
	// Popular repository with full metadata
	{
		id: 1,
		name: 'awesome-project',
		description: 'An amazing JavaScript library for building UIs',
		html_url: 'https://github.com/user/awesome-project',
		language: 'JavaScript',
		stargazers_count: 15420,
		updated_at: '2024-01-15T10:30:00Z',
		owner: { login: 'user' }
	},
	// Repository without description
	{
		id: 2,
		name: 'minimal-repo',
		description: null,
		html_url: 'https://github.com/user/minimal-repo',
		language: 'Python',
		stargazers_count: 5,
		updated_at: '2024-01-10T14:20:00Z',
		owner: { login: 'user' }
	},
	// Repository without language
	{
		id: 3,
		name: 'docs-only',
		description: 'Documentation repository',
		html_url: 'https://github.com/user/docs-only',
		language: null,
		stargazers_count: 123,
		updated_at: '2024-01-08T09:15:00Z',
		owner: { login: 'user' }
	}
];
```

## Core Test Scenarios

### 3. Navigation and Routing Tests

**File: `e2e/navigation.test.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
	test('should redirect from home to search page', async ({ page }) => {
		await page.goto('/');
		await page.waitForURL('**/search');
		await expect(page).toHaveURL(/\/search$/);
	});

	test('should navigate to settings page', async ({ page }) => {
		await page.goto('/search');
		await page.click('[href="/settings"]'); // Assuming nav link exists
		await expect(page).toHaveURL(/\/settings$/);
	});

	test('should navigate back to search from settings', async ({ page }) => {
		await page.goto('/settings');
		await page.click('[href="/search"]'); // Assuming nav link exists
		await expect(page).toHaveURL(/\/search$/);
	});
});
```

### 4. Settings Management Tests

**File: `e2e/settings.test.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Settings Management', () => {
	test.beforeEach(async ({ page }) => {
		// Clear IndexedDB before each test
		await page.goto('/settings');
		await page.evaluate(() => {
			return new Promise<void>((resolve) => {
				const deleteReq = indexedDB.deleteDatabase('GithubStarsDB');
				deleteReq.onsuccess = () => resolve();
				deleteReq.onerror = () => resolve();
			});
		});
		await page.reload();
	});

	test('should save GitHub credentials', async ({ page }) => {
		await page.goto('/settings');

		// Fill in credentials
		await page.fill('#username', 'testuser');
		await page.fill('#token', 'github_pat_test_token');

		// Save settings
		await page.click('button[type="submit"]');

		// Verify success message
		await expect(page.locator('.bg-green-50')).toContainText('Settings saved successfully');

		// Verify fields retain values after reload
		await page.reload();
		await expect(page.locator('#username')).toHaveValue('testuser');
		await expect(page.locator('#token')).toHaveValue('github_pat_test_token');
	});

	test('should show validation errors for empty fields', async ({ page }) => {
		await page.goto('/settings');

		// Try to save without filling fields
		await page.click('button[type="submit"]');

		// Button should remain disabled for empty form
		await expect(page.locator('button[type="submit"]')).toBeDisabled();
	});

	test('should indicate unsaved changes', async ({ page }) => {
		await page.goto('/settings');

		// Make changes
		await page.fill('#username', 'testuser');

		// Should show dirty state indicator
		await expect(page.locator('text=You have unsaved changes')).toBeVisible();

		// Should enable save button
		await expect(page.locator('button[type="submit"]')).toBeEnabled();
	});

	test('should handle settings load errors gracefully', async ({ page }) => {
		// Mock IndexedDB to throw an error
		await page.addInitScript(() => {
			const originalOpen = indexedDB.open;
			indexedDB.open = function () {
				throw new Error('IndexedDB unavailable');
			};
		});

		await page.goto('/settings');

		// Should show error message
		await expect(page.locator('.bg-red-50')).toBeVisible();
	});
});
```

### 5. Repository Fetching Tests

**File: `e2e/repository-fetching.test.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Repository Fetching', () => {
	test.beforeEach(async ({ page }) => {
		// Setup mocks for GitHub API
		await setupGitHubMocks(page);

		// Setup user credentials
		await setupUserCredentials(page);
	});

	test('should fetch starred repositories successfully', async ({ page }) => {
		await page.goto('/search');

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
		// Mock multi-page response
		await page.route('https://api.github.com/users/*/starred*', async (route) => {
			const url = route.request().url();
			const pageMatch = url.match(/page=(\d+)/);
			const page = pageMatch ? parseInt(pageMatch[1]) : 1;

			if (page === 1) {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify(mockPage1),
					headers: {
						Link: '<https://api.github.com/user/starred?page=2>; rel="next", <https://api.github.com/user/starred?page=2>; rel="last"'
					}
				});
			} else {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify(mockPage2)
				});
			}
		});

		await page.goto('/search');
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

		await page.goto('/search');
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

		await page.goto('/search');
		await page.click('button:has-text("Fetch Stars")');

		// Should eventually show error
		await expect(page.locator('.bg-red-50')).toContainText('error', { timeout: 15000 });
	});
});
```

### 6. Search and Filtering Tests

**File: `e2e/search-filtering.test.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Search and Filtering', () => {
	test.beforeEach(async ({ page }) => {
		await setupGitHubMocks(page);
		await setupUserCredentials(page);

		// Pre-populate with repositories
		await page.goto('/search');
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
		await page.goto('/settings');
		await page.goto('/search');

		// State should be preserved
		await expect(page.locator('#search')).toHaveValue('project');
		await expect(page.locator('#sort')).toHaveValue('stars');
	});
});
```

### 7. UI Component Tests

**File: `e2e/ui-components.test.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('UI Components', () => {
	test.beforeEach(async ({ page }) => {
		await setupGitHubMocks(page);
		await setupUserCredentials(page);
	});

	test('should display repository cards correctly', async ({ page }) => {
		await page.goto('/search');
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
		await page.goto('/search');
		await page.click('button:has-text("Fetch Stars")');

		// Find minimal-repo card
		const card = page.locator('[data-testid="repo-card"]:has-text("minimal-repo")');

		// Should not show description section
		await expect(card.locator('p')).not.toBeVisible();
	});

	test('should handle repositories without language', async ({ page }) => {
		await page.goto('/search');
		await page.click('button:has-text("Fetch Stars")');

		// Find docs-only card
		const card = page.locator('[data-testid="repo-card"]:has-text("docs-only")');

		// Should show "No language"
		await expect(card.locator('text=No language')).toBeVisible();
	});

	test('should open GitHub links in new tab', async ({ page }) => {
		await page.goto('/search');
		await page.click('button:has-text("Fetch Stars")');

		const link = page.locator('a:has-text("View on GitHub")').first();

		// Verify link attributes
		await expect(link).toHaveAttribute('href', 'https://github.com/user/awesome-project');
		await expect(link).toHaveAttribute('target', '_blank');
		await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
	});

	test('should display progress bar during fetch', async ({ page }) => {
		await page.goto('/search');

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
		await page.goto('/search');

		// Should show empty state message
		await expect(page.locator('text=No repositories available')).toBeVisible();
		await expect(page.locator('text=Click "Fetch Stars" to load')).toBeVisible();
	});
});
```

### 8. Data Persistence Tests

**File: `e2e/data-persistence.test.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Data Persistence', () => {
	test.beforeEach(async ({ page }) => {
		await setupGitHubMocks(page);
	});

	test('should persist fetched repositories across sessions', async ({ page }) => {
		// First session: setup and fetch
		await setupUserCredentials(page);
		await page.goto('/search');
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
		await page.goto('/search');
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
			delete (window as any).indexedDB;
		});

		await page.goto('/settings');

		// Should show graceful degradation
		await expect(page.locator('.bg-red-50')).toContainText('storage unavailable');
	});

	test('should refresh cached data when explicitly requested', async ({ page }) => {
		await setupUserCredentials(page);
		await page.goto('/search');

		// Initial fetch
		await page.click('button:has-text("Fetch Stars")');
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(3);

		// Mock different response for refresh
		await page.route('https://api.github.com/users/*/starred*', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([mockRepositories[0]]) // Only one repo
			});
		});

		// Refresh
		await page.click('button:has-text("Fetch Stars")');
		await expect(page.locator('[data-testid="repo-card"]')).toHaveCount(1);
	});
});
```

### 9. Error Handling Tests

**File: `e2e/error-handling.test.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
	test('should handle missing credentials gracefully', async ({ page }) => {
		await page.goto('/search');

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

		await page.goto('/search');
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

		await page.goto('/search');
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

		await page.goto('/search');
		await page.click('button:has-text("Fetch Stars")');

		await expect(page.locator('.bg-red-50')).toContainText('server error');
	});

	test('should allow error dismissal', async ({ page }) => {
		await setupUserCredentials(page);

		// Mock error
		await page.route('https://api.github.com/users/*/starred*', async (route) => {
			await route.fulfill({ status: 500 });
		});

		await page.goto('/search');
		await page.click('button:has-text("Fetch Stars")');

		// Error should appear
		await expect(page.locator('.bg-red-50')).toBeVisible();

		// Dismiss error
		await page.click('button:has-text("Dismiss")');

		// Error should disappear
		await expect(page.locator('.bg-red-50')).not.toBeVisible();
	});
});
```

### 10. Accessibility Tests

**File: `e2e/accessibility.test.ts`**

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
	test('should have no accessibility violations on search page', async ({ page }) => {
		await setupGitHubMocks(page);
		await setupUserCredentials(page);

		await page.goto('/search');
		await page.click('button:has-text("Fetch Stars")');

		const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('should have no accessibility violations on settings page', async ({ page }) => {
		await page.goto('/settings');

		const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('should support keyboard navigation', async ({ page }) => {
		await setupGitHubMocks(page);
		await setupUserCredentials(page);

		await page.goto('/search');

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
		await page.goto('/search');

		// Verify form labels
		await expect(page.locator('label[for="search"]')).toBeVisible();
		await expect(page.locator('label[for="sort"]')).toBeVisible();

		// Verify button accessibility
		const fetchButton = page.locator('button:has-text("Fetch Stars")');
		await expect(fetchButton).toHaveAttribute('type', 'button');
	});
});
```

## Test Infrastructure Setup

### 11. Helper Functions

**File: `e2e/helpers/setup.ts`**

```typescript
import type { Page } from '@playwright/test';

export const mockRepositories = [
	{
		id: 1,
		name: 'awesome-project',
		description: 'An amazing JavaScript library for building UIs',
		html_url: 'https://github.com/user/awesome-project',
		language: 'JavaScript',
		stargazers_count: 15420,
		updated_at: '2024-01-15T10:30:00Z',
		owner: { login: 'user' }
	},
	{
		id: 2,
		name: 'minimal-repo',
		description: null,
		html_url: 'https://github.com/user/minimal-repo',
		language: 'Python',
		stargazers_count: 5,
		updated_at: '2024-01-10T14:20:00Z',
		owner: { login: 'user' }
	},
	{
		id: 3,
		name: 'docs-only',
		description: 'Documentation repository',
		html_url: 'https://github.com/user/docs-only',
		language: null,
		stargazers_count: 123,
		updated_at: '2024-01-08T09:15:00Z',
		owner: { login: 'user' }
	}
];

export async function setupGitHubMocks(page: Page) {
	await page.route('https://api.github.com/users/*/starred*', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(mockRepositories),
			headers: {
				Link: '<https://api.github.com/user/starred?page=1>; rel="first", <https://api.github.com/user/starred?page=1>; rel="last"'
			}
		});
	});
}

export async function setupUserCredentials(page: Page, token = 'github_pat_test_token') {
	await page.goto('/settings');
	await page.fill('#username', 'testuser');
	await page.fill('#token', token);
	await page.click('button[type="submit"]');
	await page.waitForSelector('.bg-green-50'); // Wait for success message
}

export async function clearIndexedDB(page: Page) {
	await page.evaluate(() => {
		return new Promise<void>((resolve) => {
			const deleteReq = indexedDB.deleteDatabase('GithubStarsDB');
			deleteReq.onsuccess = () => resolve();
			deleteReq.onerror = () => resolve();
		});
	});
}
```

### 12. Test Configuration Updates

**Update to `playwright.config.ts`:**

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		reuseExistingServer: !process.env.CI
	},
	testDir: 'e2e',
	timeout: 30000,
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'html',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] }
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] }
		}
	]
});
```

## Test Execution Strategy

### 13. Test Suites Organization

1. **Smoke Tests** (`smoke.test.ts`): Critical path tests for basic functionality
2. **Core Features** (`navigation.test.ts`, `settings.test.ts`, `repository-fetching.test.ts`, `search-filtering.test.ts`): Main user workflows
3. **Edge Cases** (`error-handling.test.ts`, `data-persistence.test.ts`): Error scenarios and data handling
4. **UI/UX** (`ui-components.test.ts`, `accessibility.test.ts`): Interface and accessibility validation

### 14. Continuous Integration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### 15. Performance Considerations

- Use `page.route()` to mock all external requests
- Clear IndexedDB between tests to ensure isolation
- Use `waitForSelector()` and `waitForURL()` for reliable timing
- Implement proper test data setup and teardown
- Use parallel execution where possible

### 16. Coverage Goals

This test suite aims to achieve:

- **100%** coverage of critical user paths
- **95%** coverage of error scenarios
- **100%** coverage of API integration points
- **90%** coverage of UI interactions
- **100%** coverage of data persistence flows

## Maintenance Guidelines

1. **Update mock data** when GitHub API responses change
2. **Add new test cases** for new features
3. **Review flaky tests** regularly and fix timing issues
4. **Keep accessibility tests updated** with new UI components
5. **Monitor test execution time** and optimize slow tests

This comprehensive testing strategy ensures Stargazer's core functionality works reliably without dependency on external services, while covering all major user workflows and edge cases.
