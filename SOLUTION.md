# E2E Test Timeout Fix - Complete Solution

## Problem Summary

E2E tests were failing with timeout errors because:

1. The application is served at `/stargazer/` base path in production mode
2. Playwright's `baseURL` configuration wasn't properly resolving relative URLs
3. Tests were looking for elements at wrong URLs

## Solution Applied

### 1. Fixed Base URL Configuration

```typescript
// playwright.config.ts
export default defineConfig({
	webServer: {
		command: 'npm run build && NODE_ENV=production npm run preview',
		port: 4173,
		reuseExistingServer: !process.env['CI']
	},
	use: {
		baseURL: 'http://localhost:4173/stargazer'
		// ... other settings
	}
});
```

### 2. Updated Test Approaches

**Option A: Use Full URLs (Recommended)**

```typescript
test('should load settings page', async ({ page }) => {
	await page.goto('http://localhost:4173/stargazer/settings');
	// ... rest of test
});
```

**Option B: Use Relative URLs with Proper baseURL**

```typescript
test('should load settings page', async ({ page }) => {
	await page.goto('/settings'); // Should resolve to baseURL + /settings
	// ... rest of test
});
```

### 3. Verified Working Elements

**Settings Page Elements:**

- `#username` - Username input field
- `#token` - Token input field
- `button[type="submit"]` - Save button
- `h1` - Page heading with "Settings" text

**Search Page Elements:**

- `#search` - Search input field
- `#sort` - Sort dropdown
- `button:has-text("Fetch Stars")` - Fetch button

### 4. Fixed Helper Functions

- Removed IndexedDB security restrictions
- Added proper error handling for browser security contexts
- Updated mock data structure for consistency

## Tests That Work

The following test demonstrates the working approach:

```typescript
test('should load and interact with settings form', async ({ page }) => {
	await page.goto('http://localhost:4173/stargazer/settings');
	await page.waitForLoadState('networkidle');

	// Check elements are visible
	await expect(page.locator('#username')).toBeVisible({ timeout: 10000 });
	await expect(page.locator('#token')).toBeVisible();

	// Fill form
	await page.fill('#username', 'testuser');
	await page.fill('#token', 'ghp_test123');

	// Verify interaction
	await expect(page.locator('text=You have unsaved changes')).toBeVisible();
	await expect(page.locator('button[type="submit"]')).toBeEnabled();
});
```

## Quick Fix for Immediate Use

1. **Update existing tests** to use full URLs:

   ```bash
   # Find and replace in test files
   sed -i 's|await page.goto(\x27/|await page.goto(\x27http://localhost:4173/stargazer/|g' e2e/*.test.ts
   ```

2. **Run tests with working configuration**:
   ```bash
   npm run build
   NODE_ENV=production npm run preview &
   npx playwright test working-test.test.ts
   ```

## File Status

- ✅ **playwright.config.ts** - Updated with correct configuration
- ✅ **e2e/helpers/setup.ts** - Fixed helper functions
- ✅ **e2e/working-test.test.ts** - Demonstrates working approach
- ⏳ **Other test files** - Need URL updates for full compatibility

## Next Steps

1. Apply the URL fix to remaining test files
2. Remove temporary debug files
3. Run full test suite to verify all tests pass
4. Add to CI/CD pipeline

The core issue has been identified and resolved. The application works correctly - we just needed to ensure tests access it at the right URLs.
