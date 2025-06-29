import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSettings, type SettingsState } from './useSettings';
import { ServiceManager } from '../../services';

// Mock the ServiceManager
vi.mock('../../services', () => ({
	ServiceManager: {
		getInstance: vi.fn()
	}
}));

describe('useSettings', () => {
	const mockSettingsDb = {
		getUsername: vi.fn(),
		getToken: vi.fn(),
		saveUsername: vi.fn(),
		saveToken: vi.fn()
	};

	const mockServiceManager = {
		getService: vi.fn((service: string) => {
			if (service === 'settingsDb') return mockSettingsDb;
			throw new Error(`Unknown service: ${service}`);
		}),
		setGitHubToken: vi.fn()
	};

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
		const settings = useSettings();
		const state = settings.get();

		expect(state).toEqual({
			username: '',
			token: '',
			loading: false,
			error: null,
			isDirty: false
		});
	});

	it('should load settings successfully', async () => {
		mockSettingsDb.getUsername.mockResolvedValue('testuser');
		mockSettingsDb.getToken.mockResolvedValue('test-token');

		const settings = useSettings();
		await settings.load();

		const state = settings.get();

		expect(mockSettingsDb.getUsername).toHaveBeenCalledOnce();
		expect(mockSettingsDb.getToken).toHaveBeenCalledOnce();
		expect(state.username).toBe('testuser');
		expect(state.token).toBe('test-token');
		expect(state.loading).toBe(false);
		expect(state.error).toBe(null);
		expect(state.isDirty).toBe(false);
	});

	it('should handle null values when loading settings', async () => {
		mockSettingsDb.getUsername.mockResolvedValue(null);
		mockSettingsDb.getToken.mockResolvedValue(null);

		const settings = useSettings();
		await settings.load();

		const state = settings.get();

		expect(state.username).toBe('');
		expect(state.token).toBe('');
		expect(state.loading).toBe(false);
		expect(state.error).toBe(null);
	});

	it('should handle load errors', async () => {
		const errorMessage = 'Database connection failed';
		mockSettingsDb.getUsername.mockRejectedValue(new Error(errorMessage));

		const settings = useSettings();
		await settings.load();

		const state = settings.get();

		expect(state.error).toBe(errorMessage);
		expect(state.loading).toBe(false);
	});

	it('should save settings successfully', async () => {
		mockSettingsDb.saveUsername.mockResolvedValue(undefined);
		mockSettingsDb.saveToken.mockResolvedValue(undefined);

		const settings = useSettings();
		settings.setUsername('newuser');
		settings.setToken('new-token');

		await settings.save();

		const state = settings.get();

		expect(mockSettingsDb.saveUsername).toHaveBeenCalledWith('newuser');
		expect(mockSettingsDb.saveToken).toHaveBeenCalledWith('new-token');
		expect(mockServiceManager.setGitHubToken).toHaveBeenCalledWith('new-token');
		expect(state.loading).toBe(false);
		expect(state.error).toBe(null);
		expect(state.isDirty).toBe(false);
	});

	it('should not update GitHub token if token is empty', async () => {
		mockSettingsDb.saveUsername.mockResolvedValue(undefined);
		mockSettingsDb.saveToken.mockResolvedValue(undefined);

		const settings = useSettings();
		settings.setUsername('newuser');
		settings.setToken(''); // Empty token

		await settings.save();

		expect(mockServiceManager.setGitHubToken).not.toHaveBeenCalled();
	});

	it('should handle save errors', async () => {
		const errorMessage = 'Failed to save to database';
		mockSettingsDb.saveUsername.mockRejectedValue(new Error(errorMessage));

		const settings = useSettings();
		settings.setUsername('newuser');

		await settings.save();

		const state = settings.get();

		expect(state.error).toBe(errorMessage);
		expect(state.loading).toBe(false);
	});

	it('should set username and mark as dirty', () => {
		const settings = useSettings();

		settings.setUsername('testuser');
		const state = settings.get();

		expect(state.username).toBe('testuser');
		expect(state.isDirty).toBe(true);
	});

	it('should set token and mark as dirty', () => {
		const settings = useSettings();

		settings.setToken('test-token');
		const state = settings.get();

		expect(state.token).toBe('test-token');
		expect(state.isDirty).toBe(true);
	});

	it('should clear error correctly', () => {
		const settings = useSettings();

		// Simulate an error
		mockSettingsDb.getUsername.mockRejectedValue(new Error('Test error'));
		settings.load();

		// Clear the error
		settings.clearError();
		const state = settings.get();

		expect(state.error).toBe(null);
	});

	it('should reset state correctly', () => {
		const settings = useSettings();

		// Modify state
		settings.setUsername('testuser');
		settings.setToken('test-token');

		// Reset
		settings.reset();
		const state = settings.get();

		expect(state).toEqual({
			username: '',
			token: '',
			loading: false,
			error: null,
			isDirty: false
		});
	});

	it('should validate settings correctly', () => {
		const settings = useSettings();

		// Initially invalid
		expect(settings.isValid()).toBe(false);
		expect(settings.hasCredentials()).toBe(false);

		// Set username only
		settings.setUsername('testuser');
		expect(settings.isValid()).toBe(false);

		// Set token only
		settings.reset();
		settings.setToken('test-token');
		expect(settings.isValid()).toBe(false);

		// Set both
		settings.setUsername('testuser');
		expect(settings.isValid()).toBe(true);
		expect(settings.hasCredentials()).toBe(true);
	});

	it('should handle empty/whitespace values in validation', () => {
		const settings = useSettings();

		// Set whitespace values
		settings.setUsername('   ');
		settings.setToken('   ');

		expect(settings.isValid()).toBe(false);
		expect(settings.hasCredentials()).toBe(false);
	});

	it('should handle state subscription correctly', () => {
		const settings = useSettings();
		const stateUpdates: SettingsState[] = [];

		settings.subscribe((state) => {
			stateUpdates.push(state);
		});

		settings.setUsername('testuser');
		settings.setToken('test-token');

		expect(stateUpdates.length).toBeGreaterThan(0);

		const finalState = stateUpdates[stateUpdates.length - 1];
		expect(finalState.username).toBe('testuser');
		expect(finalState.token).toBe('test-token');
		expect(finalState.isDirty).toBe(true);
	});
});
