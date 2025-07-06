# End-to-End Test Suite for Stargazer

This comprehensive E2E test suite covers all major user workflows and edge cases for the Stargazer GitHub stars search application.

## Overview

The test suite is built with Playwright and includes:

- **Smoke Tests** - Critical path validation
- **Navigation Tests** - Routing and page transitions
- **Settings Management** - Configuration persistence
- **Repository Fetching** - GitHub API integration
- **Search & Filtering** - Repository search functionality
- **UI Components** - Interface validation
- **Data Persistence** - Local storage and caching
- **Error Handling** - Error scenarios and recovery
- **Accessibility** - A11y compliance
- **Performance** - Load times and responsiveness

## Test Structure

```
e2e/
├── helpers/
│   └── setup.ts                    # Mock data and utility functions
├── accessibility.test.ts           # Accessibility compliance tests
├── data-persistence.test.ts        # Data storage and caching tests
├── error-handling.test.ts          # Error scenarios and recovery
├── navigation.test.ts              # Routing and navigation tests
├── performance.test.ts             # Performance and load tests
├── repository-fetching.test.ts     # GitHub API integration tests
├── search-filtering.test.ts        # Search and filtering functionality
├── settings.test.ts                # Settings management tests
├── smoke.test.ts                   # Critical path smoke tests
├── ui-components.test.ts           # UI component validation
└── README.md                       # This file
```

## Prerequisites

1. **Install Dependencies**

   ```bash
   npm install
   npx playwright install
   ```

2. **Build the Application**

   ```bash
   npm run build
   ```

3. **Start the Preview Server**
   ```bash
   npm run preview
   ```
   This will start the application on `http://localhost:4173`

## Running Tests

### All Tests

```bash
npm run test:e2e
```

### Smoke Tests (Quick Validation)

```bash
npm run test:e2e:smoke
```

### Individual Test Suites

```bash
# Navigation tests
npx playwright test navigation.test.ts

# Settings tests
npx playwright test settings.test.ts

# Repository fetching tests
npx playwright test repository-fetching.test.ts

# Search and filtering tests
npx playwright test search-filtering.test.ts

# UI component tests
npx playwright test ui-components.test.ts

# Data persistence tests
npx playwright test data-persistence.test.ts

# Error handling tests
npx playwright test error-handling.test.ts

# Accessibility tests
npx playwright test accessibility.test.ts

# Performance tests
npx playwright test performance.test.ts
```

### Debug Mode

```bash
npm run test:e2e:debug
```

### Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

### UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

### View Test Report

```bash
npm run test:e2e:report
```

## Mock Strategy

The test suite uses Playwright's request interception to mock all GitHub API calls, ensuring:

- **No real API calls** - Tests run without internet dependency
- **Consistent data** - Predictable test outcomes
- **Fast execution** - No network latency
- **Error simulation** - Test error scenarios safely

### Mock Data

The `helpers/setup.ts` file contains:

```typescript
// Standard mock repositories
export const mockRepositories = [
	{
		id: 1,
		name: 'awesome-project',
		description: 'An amazing JavaScript library for building UIs',
		language: 'JavaScript',
		stargazers_count: 15420
		// ... more fields
	}
	// ... more repositories
];

// Helper functions
export async function setupGitHubMocks(page: Page);
export async function setupUserCredentials(page: Page, token?: string);
export async function clearIndexedDB(page: Page);
```

## Test Data Scenarios

The mock data covers various repository types:

1. **Popular Repository** - High star count, full metadata
2. **Minimal Repository** - No description, low stars
3. **Documentation Repository** - No programming language
4. **Multi-page Results** - Testing pagination
5. **Empty Results** - No starred repositories
6. **Error Responses** - API failures and rate limits

## Expected Application Elements

Tests expect the following elements to exist in the application:

### Settings Page (`/settings`)

- `#username` - Username input field
- `#token` - GitHub token input field
- `button[type="submit"]` - Save button
- `.bg-green-50` - Success message container
- `.bg-red-50` - Error message container

### Search Page (`/search`)

- `#search` - Search input field
- `#sort` - Sort dropdown
- `button:has-text("Fetch Stars")` - Fetch button
- `[data-testid="repo-card"]` - Repository cards
- `[data-testid="progress-bar"]` - Progress indicator

### Repository Cards

- `h3` - Repository name
- `text=⭐ X` - Star count display
- `a:has-text("View on GitHub")` - GitHub link
- Language and description text

### Navigation

- `[href="/settings"]` - Settings navigation link
- `[href="/search"]` - Search navigation link

## Common Test Patterns

### Setup Pattern

```typescript
test.beforeEach(async ({ page }) => {
	await setupGitHubMocks(page);
	await setupUserCredentials(page);
});
```

### API Mocking Pattern

```typescript
await page.route('https://api.github.com/users/*/starred*', async (route) => {
	await route.fulfill({
		status: 200,
		contentType: 'application/json',
		body: JSON.stringify(mockRepositories)
	});
});
```

### Error Testing Pattern

```typescript
await page.route('https://api.github.com/users/*/starred*', async (route) => {
	await route.fulfill({
		status: 401,
		contentType: 'application/json',
		body: JSON.stringify({ message: 'Bad credentials' })
	});
});
```

## CI/CD Integration

The test suite is configured for CI environments:

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
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Tests Timing Out

- Ensure the preview server is running on port 4173
- Check that the application builds successfully
- Verify element selectors match the actual DOM

### Element Not Found

- Use `npx playwright codegen http://localhost:4173` to generate selectors
- Check the application's actual HTML structure
- Verify the element appears after expected user actions

### API Mock Issues

- Ensure the route pattern matches the actual API calls
- Check network tab in browser dev tools for actual request URLs
- Verify mock data structure matches expected format

### IndexedDB Tests Failing

- Clear browser data between test runs
- Check that the database name matches the application
- Verify the application handles storage errors gracefully

## Coverage Goals

The test suite aims for:

- **100%** critical user path coverage
- **95%** error scenario coverage
- **100%** API integration coverage
- **90%** UI interaction coverage
- **100%** data persistence coverage

## Maintenance

When updating the application:

1. **Update selectors** if DOM structure changes
2. **Add new test cases** for new features
3. **Update mock data** if API responses change
4. **Review flaky tests** and fix timing issues
5. **Monitor test execution time** and optimize

## Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Mock all external dependencies** for test isolation
3. **Test user workflows** not implementation details
4. **Keep tests focused** - one concern per test
5. **Use descriptive test names** that explain the scenario
6. **Clean up between tests** to ensure isolation

This comprehensive test suite ensures Stargazer works reliably across all supported browsers and scenarios while maintaining fast execution times and clear failure reporting.
