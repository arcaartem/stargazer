import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRepositories, type RepositoryState } from './useRepositories';
import { ServiceManager } from '../../services';
import type { Repository } from '../../types';

// Mock the ServiceManager
vi.mock('../../services', () => ({
	ServiceManager: {
		getInstance: vi.fn()
	}
}));

// Mock the search function
vi.mock('../search', () => ({
	searchRepositories: vi.fn((repos, term) => {
		if (!term) return repos;
		return repos.filter((repo: Repository) => repo.name.toLowerCase().includes(term.toLowerCase()));
	})
}));

describe('useRepositories', () => {
	const mockStarsDb = {
		getCachedStars: vi.fn(),
		saveStars: vi.fn()
	};

	const mockSettingsDb = {
		getUsername: vi.fn(),
		getToken: vi.fn()
	};

	const mockGithub = {
		fetchAllStarredRepos: vi.fn()
	};

	const mockServiceManager = {
		getService: vi.fn((service: string) => {
			switch (service) {
				case 'starsDb':
					return mockStarsDb;
				case 'settingsDb':
					return mockSettingsDb;
				case 'github':
					return mockGithub;
				default:
					throw new Error(`Unknown service: ${service}`);
			}
		}),
		setGitHubToken: vi.fn()
	};

	const mockRepositories: Repository[] = [
		{
			id: 1,
			name: 'test-repo',
			description: 'A test repository',
			html_url: 'https://github.com/user/test-repo',
			language: 'TypeScript',
			stargazers_count: 100,
			updated_at: '2023-01-01T00:00:00Z',
			owner: { login: 'user' }
		},
		{
			id: 2,
			name: 'another-repo',
			description: 'Another repository',
			html_url: 'https://github.com/user/another-repo',
			language: 'JavaScript',
			stargazers_count: 50,
			updated_at: '2023-01-02T00:00:00Z',
			owner: { login: 'user' }
		}
	];

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(ServiceManager.getInstance).mockReturnValue(
			mockServiceManager as unknown as ServiceManager
		);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should initialize with correct defaults', () => {
		const repositories = useRepositories();
		const state = repositories.get();

		expect(state).toEqual({
			repositories: [],
			loading: false,
			error: null,
			searchTerm: '',
			sortBy: 'relevance'
		});
	});

	it('should load repositories from database successfully', async () => {
		mockStarsDb.getCachedStars.mockResolvedValue(mockRepositories);

		const repositories = useRepositories();
		await repositories.load();

		const state = repositories.get();

		expect(mockStarsDb.getCachedStars).toHaveBeenCalledOnce();
		expect(state.repositories).toEqual(mockRepositories);
		expect(state.loading).toBe(false);
		expect(state.error).toBe(null);
	});

	it('should handle database load errors', async () => {
		const errorMessage = 'Database connection failed';
		mockStarsDb.getCachedStars.mockRejectedValue(new Error(errorMessage));

		const repositories = useRepositories();
		await repositories.load();

		const state = repositories.get();

		expect(state.repositories).toEqual([]);
		expect(state.loading).toBe(false);
		expect(state.error).toBe(errorMessage);
	});

	it('should refresh repositories from GitHub successfully', async () => {
		mockSettingsDb.getUsername.mockResolvedValue('testuser');
		mockSettingsDb.getToken.mockResolvedValue('test-token');
		mockGithub.fetchAllStarredRepos.mockResolvedValue(mockRepositories);
		mockStarsDb.saveStars.mockResolvedValue(undefined);

		const repositories = useRepositories();
		const progressCallback = vi.fn();

		await repositories.refresh(progressCallback);

		const state = repositories.get();

		expect(mockSettingsDb.getUsername).toHaveBeenCalledOnce();
		expect(mockSettingsDb.getToken).toHaveBeenCalledOnce();
		expect(mockServiceManager.setGitHubToken).toHaveBeenCalledWith('test-token');
		expect(mockGithub.fetchAllStarredRepos).toHaveBeenCalledWith('testuser', progressCallback);
		expect(mockStarsDb.saveStars).toHaveBeenCalledWith(mockRepositories);
		expect(state.repositories).toEqual(mockRepositories);
		expect(state.loading).toBe(false);
		expect(state.error).toBe(null);
	});

	it('should handle missing credentials during refresh', async () => {
		mockSettingsDb.getUsername.mockResolvedValue(null);
		mockSettingsDb.getToken.mockResolvedValue(null);

		const repositories = useRepositories();
		await repositories.refresh();

		const state = repositories.get();

		expect(state.error).toBe('Please configure your GitHub credentials in Settings');
		expect(state.loading).toBe(false);
		expect(mockGithub.fetchAllStarredRepos).not.toHaveBeenCalled();
	});

	it('should handle GitHub API errors during refresh', async () => {
		mockSettingsDb.getUsername.mockResolvedValue('testuser');
		mockSettingsDb.getToken.mockResolvedValue('test-token');
		mockGithub.fetchAllStarredRepos.mockRejectedValue(new Error('API rate limit exceeded'));

		const repositories = useRepositories();
		await repositories.refresh();

		const state = repositories.get();

		expect(state.error).toBe('API rate limit exceeded');
		expect(state.loading).toBe(false);
	});

	it('should update search term correctly', () => {
		const repositories = useRepositories();

		repositories.setSearchTerm('test');
		const state = repositories.get();

		expect(state.searchTerm).toBe('test');
	});

	it('should update sort by correctly', () => {
		const repositories = useRepositories();

		repositories.setSortBy('stars');
		const state = repositories.get();

		expect(state.sortBy).toBe('stars');
	});

	it('should clear error correctly', () => {
		const repositories = useRepositories();

		// Set an error first
		mockStarsDb.getCachedStars.mockRejectedValue(new Error('Test error'));
		repositories.load();

		// Clear the error
		repositories.clearError();
		const state = repositories.get();

		expect(state.error).toBe(null);
	});

	it('should reset state correctly', () => {
		const repositories = useRepositories();

		// Modify state
		repositories.setSearchTerm('test');
		repositories.setSortBy('stars');

		// Reset
		repositories.reset();
		const state = repositories.get();

		expect(state).toEqual({
			repositories: [],
			loading: false,
			error: null,
			searchTerm: '',
			sortBy: 'relevance'
		});
	});

	it('should handle state updates correctly', () => {
		const repositories = useRepositories();
		const stateUpdates: RepositoryState[] = [];

		repositories.subscribe((state) => {
			stateUpdates.push(state);
		});

		repositories.setSearchTerm('test');
		repositories.setSortBy('stars');

		expect(stateUpdates.length).toBeGreaterThan(0);
		expect(stateUpdates[stateUpdates.length - 1].searchTerm).toBe('test');
		expect(stateUpdates[stateUpdates.length - 1].sortBy).toBe('stars');
	});

	it('should refresh with default progress callback when none provided', async () => {
		mockSettingsDb.getUsername.mockResolvedValue('testuser');
		mockSettingsDb.getToken.mockResolvedValue('test-token');
		mockGithub.fetchAllStarredRepos.mockResolvedValue(mockRepositories);
		mockStarsDb.saveStars.mockResolvedValue(undefined);

		const repositories = useRepositories();
		await repositories.refresh(); // No progress callback provided

		expect(mockGithub.fetchAllStarredRepos).toHaveBeenCalledWith('testuser', expect.any(Function));
	});
});
