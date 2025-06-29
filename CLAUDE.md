# Stargazer Refactoring Plan

## Overview

This document outlines a comprehensive refactoring plan for the Stargazer GitHub Stars Search application. The plan focuses on improving code simplification, readability, and maintainability while preserving existing functionality.

## Current Architecture Issues

### 1. **Duplicate Functionality**

- **Problem**: The main page (`src/routes/+page.svelte`) contains duplicate functionality that exists in the search page
- **Impact**: Code duplication, maintenance overhead, confusion about entry points
- **Current State**: Main page has full implementation but only redirects to search

### 2. **Inconsistent Service Management**

- **Problem**: Services (`StarsDbService`, `SettingsDbService`, `GitHubService`) are instantiated multiple times across components
- **Impact**: No centralized configuration, potential memory leaks, difficult testing
- **Current State**: Each component creates its own service instances

### 3. **Mixed Component Responsibilities**

- **Problem**: Components handle UI, business logic, and data fetching simultaneously
- **Impact**: Poor separation of concerns, difficult testing, reduced reusability
- **Current State**: Search and settings pages manage their own data operations

### 4. **Database Service Implementation Issues**

- **Problem**: `StarsDbService.saveStars()` uses `forEach` with `async/await` incorrectly
- **Impact**: Race conditions, incomplete data saving, unpredictable behavior
- **Current State**: `forEach(async (star) => await this.put(...))` won't await properly

### 5. **Inconsistent Component APIs**

- **Problem**: `ProgressBar` component receives different prop types in different contexts
- **Impact**: Type confusion, inconsistent usage patterns
- **Current State**: Sometimes receives `ProgressState`, sometimes just `number`

### 6. **Styling Inconsistency**

- **Problem**: Mix of Tailwind CSS and custom CSS throughout the application
- **Impact**: Inconsistent visual design, larger bundle size, maintenance overhead
- **Current State**: Some components use Tailwind, others use scoped CSS

## Testing Strategy

### Current Test Coverage

The project has comprehensive unit tests covering:

- **Database Services**: Data transformation and validation logic (`src/lib/db.svelte.test.ts`)
- **GitHub API Service**: API interactions with mocking (`src/lib/github.test.ts`)
- **Search Functionality**: Fuzzy search and sorting algorithms (`src/lib/search.test.ts`)
- **Svelte Stores**: Store reactivity and state management (`src/lib/stores.test.ts`)
- **Component Logic**: Data formatting and validation (`src/lib/components/RepoCard.svelte.test.ts`)

### Test-Driven Refactoring Approach

#### Pre-Refactoring Setup

```bash
# Establish baseline - all tests must pass before starting
npm run test:unit
npm run test:e2e
```

#### Testing Requirements for Each Phase

1. **All existing tests must continue to pass** after each refactoring step
2. **New functionality must have corresponding tests** before implementation
3. **Test coverage must not decrease** during refactoring
4. **Integration tests must validate end-to-end workflows** remain functional

### Testing Commands for Each Phase

#### Continuous Testing During Refactoring

```bash
# Run tests in watch mode during development
npm run test:unit -- --watch

# Run specific test files
npm run test:unit -- src/lib/db.svelte.test.ts
npm run test:unit -- src/lib/github.test.ts

# Run tests with coverage
npm run test:unit -- --coverage

# Run E2E tests for integration verification
npm run test:e2e
```

#### Phase Completion Verification

After each phase, run the complete test suite:

```bash
# Full test suite
npm run test

# Type checking
npm run check

# Linting
npm run lint

# Build verification
npm run build
```

## Refactoring Plan

### Phase 1: Architecture & Service Layer

#### 1.1 Create Service Registry Pattern

```typescript
// src/lib/services/index.ts
interface ServiceRegistry {
	starsDb: StarsDbService;
	settingsDb: SettingsDbService;
	github: GitHubService;
}

export class ServiceManager {
	private static instance: ServiceManager;
	private services: ServiceRegistry;

	static getInstance(): ServiceManager {
		/* singleton */
	}
	getService<T extends keyof ServiceRegistry>(name: T): ServiceRegistry[T] {
		/* typed getter */
	}
}
```

#### 1.2 Fix Database Service Implementation

```typescript
// Fix StarsDbService.saveStars()
async saveStars(stars: Repository[]): Promise<void> {
  await Promise.all(
    stars.map(star =>
      this.put({ id: star.id, repository: star, timestamp: Date.now() })
    )
  );
}
```

#### 1.3 Create Application State Store

```typescript
// src/lib/stores/app.ts
interface AppState {
	repositories: Repository[];
	loading: boolean;
	error: string | null;
	progress: ProgressState;
	searchTerm: string;
	sortBy: SortOption;
}

export const appStore = writable<AppState>(/* initial state */);
```

### Phase 2: Component Architecture

#### 2.1 Create Composition-based Architecture

```
src/lib/
├── composables/
│   ├── useRepositories.ts    # Repository data management
│   ├── useSearch.ts          # Search functionality
│   ├── useSettings.ts        # Settings management
│   └── useProgress.ts        # Progress tracking
├── components/
│   ├── ui/                   # Pure UI components
│   ├── features/             # Feature-specific components
│   └── layout/               # Layout components
└── services/
    ├── api/                  # API services
    ├── storage/              # Storage services
    └── index.ts              # Service registry
```

#### 2.2 Standardize Component Props

```typescript
// Standardize ProgressBar props
interface ProgressBarProps {
	progress: ProgressState;
	variant?: 'default' | 'compact';
	showText?: boolean;
}
```

#### 2.3 Create Composable Hooks

```typescript
// src/lib/composables/useRepositories.ts
export function useRepositories() {
	const { subscribe, set, update } = writable<Repository[]>([]);

	return {
		subscribe,
		load: async () => {
			/* load logic */
		},
		refresh: async () => {
			/* refresh logic */
		},
		search: (term: string) => {
			/* search logic */
		}
	};
}
```

### Phase 3: Code Organization

#### 3.1 Remove Duplicate Route Handler

- **Action**: Simplify `src/routes/+page.svelte` to only show welcome/redirect
- **Remove**: All business logic, keep only redirect functionality
- **Benefit**: Single source of truth for main functionality

#### 3.2 Create Feature Modules

```
src/lib/features/
├── search/
│   ├── SearchView.svelte
│   ├── SearchFilters.svelte
│   ├── useSearch.ts
│   └── index.ts
├── settings/
│   ├── SettingsView.svelte
│   ├── SettingsForm.svelte
│   ├── useSettings.ts
│   └── index.ts
└── repositories/
    ├── RepositoryList.svelte
    ├── RepositoryCard.svelte
    ├── useRepositories.ts
    └── index.ts
```

#### 3.3 Consolidate Styling

- **Action**: Choose single styling approach (recommend full Tailwind CSS)
- **Remove**: Custom CSS where Tailwind equivalents exist
- **Standardize**: Component styling patterns

### Phase 4: Type Safety & Error Handling

#### 4.1 Improve Type Definitions

```typescript
// src/lib/types/index.ts
export type SortOption = 'stars' | 'name' | 'updated' | 'relevance';

export interface SearchFilters {
	term: string;
	sortBy: SortOption;
	language?: string;
}

export type AsyncState<T> = {
	data: T | null;
	loading: boolean;
	error: string | null;
};
```

#### 4.2 Implement Error Boundary Pattern

```typescript
// src/lib/composables/useErrorHandler.ts
export function useErrorHandler() {
	const errorStore = writable<string | null>(null);

	return {
		error: { subscribe: errorStore.subscribe },
		handleError: (error: unknown) => {
			/* standardized error handling */
		},
		clearError: () => errorStore.set(null)
	};
}
```

#### 4.3 Add Input Validation

```typescript
// src/lib/utils/validation.ts
export const validators = {
	githubUsername: (username: string) => {
		/* validation logic */
	},
	githubToken: (token: string) => {
		/* validation logic */
	},
	searchTerm: (term: string) => {
		/* validation logic */
	}
};
```

### Phase 5: Performance & UX

#### 5.1 Implement Proper Loading States

```typescript
// src/lib/composables/useAsyncOperation.ts
export function useAsyncOperation<T>() {
	const state = writable<AsyncState<T>>({ data: null, loading: false, error: null });

	const execute = async (operation: () => Promise<T>) => {
		// Proper loading state management
	};

	return { state, execute };
}
```

#### 5.2 Add Caching Strategy

```typescript
// src/lib/services/cache.ts
export class CacheService {
	private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

	get<T>(key: string): T | null {
		/* cache logic */
	}
	set<T>(key: string, data: T, ttl = 300000): void {
		/* cache logic */
	}
}
```

#### 5.3 Optimize Search Performance

```typescript
// Debounced search with proper cleanup
export function useDebouncedSearch(delay = 300) {
	let timeoutId: NodeJS.Timeout;

	return (searchFn: () => void) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(searchFn, delay);
	};
}
```

## Implementation Priority with Testing

### High Priority (Week 1) - Critical Fixes with Testing

#### 1. Fix `StarsDbService.saveStars()` Database Issue

**Pre-Implementation Testing:**

```typescript
// Add test case to verify parallel saving works correctly
it('should save multiple stars concurrently without race conditions', async () => {
	const starsDb = new StarsDbService();
	const mockRepos = Array.from({ length: 100 }, (_, i) => ({
		id: i,
		repository: mockRepo,
		timestamp: Date.now()
	}));

	await expect(starsDb.saveStars(mockRepos)).resolves.not.toThrow();
	const saved = await starsDb.getCachedStars();
	expect(saved).toHaveLength(100);
});
```

**Implementation:**

- Update `saveStars()` method to use `Promise.all()` instead of `forEach`
- **Test Requirement**: All existing db tests must pass + new concurrency test

**Post-Implementation Verification:**

```bash
npm run test:unit -- src/lib/db.svelte.test.ts
npm run test:e2e # Verify end-to-end functionality
```

#### 2. Remove Duplicate Route Handler

**Pre-Implementation Testing:**

- Create test to verify main page redirects correctly
- Test that search page maintains all functionality

**Implementation:**

- Simplify `src/routes/+page.svelte` to redirect-only
- **Test Requirement**: E2E tests must show proper navigation flow

**Post-Implementation Verification:**

```bash
npm run test:e2e -- demo.test.ts
```

#### 3. Standardize `ProgressBar` Component API

**Pre-Implementation Testing:**

```typescript
// Add comprehensive ProgressBar tests
describe('ProgressBar standardized API', () => {
	it('should handle ProgressState object', () => {
		const progress: ProgressState = { current: 5, total: 10, visible: true };
		// Test component with standardized props
	});

	it('should handle different variants', () => {
		// Test default and compact variants
	});
});
```

**Implementation:**

- Update all ProgressBar usage to consistent API
- **Test Requirement**: All progress-related tests must pass

#### 4. Create Service Registry Pattern

**Pre-Implementation Testing:**

```typescript
// Add ServiceManager tests
describe('ServiceManager', () => {
	it('should provide singleton instance', () => {
		const instance1 = ServiceManager.getInstance();
		const instance2 = ServiceManager.getInstance();
		expect(instance1).toBe(instance2);
	});

	it('should provide typed service access', () => {
		const manager = ServiceManager.getInstance();
		const starsDb = manager.getService('starsDb');
		expect(starsDb).toBeInstanceOf(StarsDbService);
	});
});
```

**Implementation:**

- Create service registry with proper TypeScript types
- **Test Requirement**: All service instantiation must work through registry

### Medium Priority (Week 2) - Architecture with Testing

#### 1. Implement Composable Hooks Architecture

**Pre-Implementation Testing:**

```typescript
// Test composable hooks
describe('useRepositories composable', () => {
	it('should provide reactive repository management', () => {
		const { subscribe, load, refresh, search } = useRepositories();
		// Test hook functionality
	});
});

describe('useSearch composable', () => {
	it('should provide debounced search functionality', () => {
		const { searchTerm, results, isSearching } = useSearch();
		// Test search debouncing and reactivity
	});
});
```

**Implementation:**

- Create composable hooks for repository, search, settings, and progress management
- **Test Requirement**: Each composable must have comprehensive unit tests

#### 2. Consolidate Styling to Tailwind CSS

**Pre-Implementation Testing:**

- Visual regression tests to ensure UI consistency
- Component snapshot tests for styling

**Implementation:**

- Remove custom CSS and replace with Tailwind equivalents
- **Test Requirement**: Component tests must verify correct styling classes

#### 3. Add Proper Error Handling

**Pre-Implementation Testing:**

```typescript
describe('useErrorHandler composable', () => {
	it('should handle different error types', () => {
		const { handleError, error, clearError } = useErrorHandler();
		// Test error handling patterns
	});
});
```

#### 4. Create Feature Modules

**Pre-Implementation Testing:**

- Verify module boundaries and dependencies
- Test feature isolation and communication

### Low Priority (Week 3) - Performance with Testing

#### 1. Implement Caching Strategy

**Pre-Implementation Testing:**

```typescript
describe('CacheService', () => {
	it('should cache data with TTL', () => {
		const cache = new CacheService();
		cache.set('key', data, 1000);
		expect(cache.get('key')).toEqual(data);
	});

	it('should expire cached data', async () => {
		// Test cache expiration
	});
});
```

#### 2. Add Input Validation

**Pre-Implementation Testing:**

```typescript
describe('Input validation', () => {
	it('should validate GitHub usernames', () => {
		expect(validators.githubUsername('valid-user')).toBe(true);
		expect(validators.githubUsername('invalid_user!')).toBe(false);
	});
});
```

### New Test Creation Guidelines

#### 1. Unit Tests for New Composables

```typescript
// Template for composable tests
describe('useNewFeature', () => {
	it('should initialize with correct defaults', () => {});
	it('should handle state updates correctly', () => {});
	it('should clean up resources on unmount', () => {});
	it('should handle error states', () => {});
});
```

#### 2. Integration Tests for Service Registry

```typescript
// Template for service integration tests
describe('Service Integration', () => {
	it('should coordinate between services correctly', () => {});
	it('should maintain service state consistency', () => {});
	it('should handle service initialization order', () => {});
});
```

#### 3. Component Tests for UI Changes

```typescript
// Template for component logic tests
describe('ComponentName Logic', () => {
	it('should handle props correctly', () => {});
	it('should format data appropriately', () => {});
	it('should validate inputs', () => {});
	it('should emit events correctly', () => {});
});
```

### Test Coverage Targets

- **Unit Tests**: Maintain >90% code coverage
- **Integration Tests**: Cover all service interactions
- **E2E Tests**: Cover all user workflows
- **Component Tests**: Cover all prop variations and edge cases

### Regression Prevention

1. **Snapshot Testing**: For component output consistency
2. **Contract Testing**: For service interface stability
3. **Performance Testing**: To prevent performance regressions
4. **Visual Regression Testing**: For UI consistency

## Expected Benefits

### Code Quality

- **Reduced Duplication**: ~30% reduction in duplicate code
- **Improved Type Safety**: Full TypeScript coverage with proper types
- **Better Testing**: Separated concerns enable unit testing

### Maintainability

- **Single Responsibility**: Each module has clear, single purpose
- **Consistent Patterns**: Standardized composable and service patterns
- **Easier Debugging**: Centralized error handling and logging

### Performance

- **Faster Loading**: Reduced bundle size through code elimination
- **Better UX**: Proper loading states and error feedback
- **Optimized Rendering**: Reactive patterns with minimal re-renders

### Developer Experience

- **Better IDE Support**: Improved TypeScript definitions
- **Easier Onboarding**: Clear architecture patterns
- **Faster Development**: Reusable composables and components

## Risk Mitigation

### Breaking Changes

- Implement changes incrementally
- Maintain backward compatibility during transition
- Create comprehensive test coverage before refactoring

### Performance Regression

- Benchmark before and after changes
- Use browser dev tools to monitor bundle size
- Implement performance monitoring

### User Experience

- Maintain existing functionality throughout refactoring
- Add loading states to prevent UI confusion
- Implement proper error boundaries

## Conclusion

This refactoring plan addresses the core architectural issues while improving code quality, maintainability, and user experience. The phased approach minimizes risk while delivering incremental improvements. The focus on modern patterns (composables, service registry, proper TypeScript) positions the codebase for future scalability and developer productivity.

The comprehensive testing strategy ensures that all refactoring maintains functionality while improving code structure. Each phase requires passing tests before proceeding, preventing regressions and maintaining code quality throughout the process.
