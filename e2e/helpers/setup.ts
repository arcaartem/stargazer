import { Page } from '@playwright/test';

// Mock repository data for consistent testing
export const mockRepositories = [
	{
		id: 1,
		name: 'awesome-project',
		full_name: 'user/awesome-project',
		description: 'An amazing project that does cool stuff',
		language: 'JavaScript',
		stargazers_count: 1337,
		updated_at: '2024-01-15T10:30:00Z',
		html_url: 'https://github.com/user/awesome-project',
		owner: {
			login: 'user',
			avatar_url: 'https://github.com/user.png'
		}
	},
	{
		id: 2,
		name: 'super-library',
		full_name: 'dev/super-library',
		description: 'A powerful library for developers',
		language: 'TypeScript',
		stargazers_count: 2500,
		updated_at: '2024-01-10T14:22:00Z',
		html_url: 'https://github.com/dev/super-library',
		owner: {
			login: 'dev',
			avatar_url: 'https://github.com/dev.png'
		}
	},
	{
		id: 3,
		name: 'minimal-tool',
		full_name: 'creator/minimal-tool',
		description: null,
		language: null,
		stargazers_count: 42,
		updated_at: '2024-01-05T09:15:00Z',
		html_url: 'https://github.com/creator/minimal-tool',
		owner: {
			login: 'creator',
			avatar_url: 'https://github.com/creator.png'
		}
	}
];

export const mockPage1 = [mockRepositories[0], mockRepositories[1], mockRepositories[2]];

export const mockPage2 = [
	{
		id: 4,
		name: 'another-repo',
		full_name: 'user/another-repo',
		description: 'Another repository for testing pagination',
		language: 'Python',
		stargazers_count: 890,
		updated_at: '2024-01-01T12:00:00Z',
		html_url: 'https://github.com/user/another-repo',
		owner: {
			login: 'user',
			avatar_url: 'https://github.com/user.png'
		}
	}
];

// Mock data for testing large datasets
export const mockLargeDataset = Array.from({ length: 1000 }, (_, i) => ({
	id: i + 1000,
	name: `repo-${i}`,
	full_name: `user/repo-${i}`,
	description: `Repository number ${i} for performance testing`,
	language: ['JavaScript', 'TypeScript', 'Python', 'Go'][i % 4],
	stargazers_count: Math.floor(Math.random() * 10000),
	updated_at: '2024-01-01T00:00:00Z',
	html_url: `https://github.com/user/repo-${i}`,
	owner: {
		login: 'user',
		avatar_url: 'https://github.com/user.png'
	}
}));

/**
 * Set up GitHub API mocks for standard repository responses
 */
export async function setupGitHubMocks(page: Page) {
	// Mock single page response
	await page.route('https://api.github.com/users/*/starred*', async (route) => {
		const url = route.request().url();

		if (url.includes('page=2')) {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(mockPage2),
				headers: {
					Link: '<https://api.github.com/users/testuser/starred?page=1>; rel="prev"'
				}
			});
		} else {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(mockPage1),
				headers: {
					Link: '<https://api.github.com/users/testuser/starred?page=2>; rel="next"'
				}
			});
		}
	});
}

/**
 * Set up multi-page GitHub API mocks for pagination testing
 */
export async function setupMultiPageMocks(page: Page) {
	await page.route('https://api.github.com/users/*/starred*', async (route) => {
		const url = route.request().url();

		if (url.includes('page=2')) {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(mockPage2),
				headers: {
					Link: '<https://api.github.com/users/testuser/starred?page=1>; rel="prev", <https://api.github.com/users/testuser/starred?page=1>; rel="first"'
				}
			});
		} else {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(mockPage1),
				headers: {
					Link: '<https://api.github.com/users/testuser/starred?page=2>; rel="next", <https://api.github.com/users/testuser/starred?page=2>; rel="last"'
				}
			});
		}
	});
}

/**
 * Set up user credentials in the page context for testing
 */
export async function setupUserCredentials(page: Page, token: string = 'ghp_test_token') {
	// Store credentials in localStorage as a fallback for tests
	await page.addInitScript(
		({ token }) => {
			localStorage.setItem('github-token', token);
			localStorage.setItem('github-username', 'testuser');
		},
		{ token }
	);
}

/**
 * Clear IndexedDB safely, handling security restrictions
 */
export async function clearIndexedDB(page: Page) {
	try {
		await page.evaluate(() => {
			// Try to clear IndexedDB, but handle security errors gracefully
			try {
				return new Promise<void>((resolve) => {
					const deleteReq = indexedDB.deleteDatabase('GithubStarsDB');
					deleteReq.onsuccess = () => resolve();
					deleteReq.onerror = () => resolve(); // Resolve even on error
					deleteReq.onblocked = () => resolve(); // Resolve even if blocked

					// Timeout after 1 second
					setTimeout(resolve, 1000);
				});
			} catch {
				// Ignore security errors and continue with test
				return Promise.resolve();
			}
		});
	} catch {
		// Ignore all errors - test can continue without IndexedDB clearing
		console.log('Could not clear IndexedDB (this is expected in some security contexts)');
	}
}
