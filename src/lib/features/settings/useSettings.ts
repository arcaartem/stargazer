import { writable, get } from 'svelte/store';
import { ServiceManager } from '../../services';

export interface SettingsState {
	username: string;
	token: string;
	loading: boolean;
	error: string | null;
	isDirty: boolean;
}

export function useSettings() {
	const initialState: SettingsState = {
		username: '',
		token: '',
		loading: false,
		error: null,
		isDirty: false
	};

	const state = writable<SettingsState>(initialState);

	const load = async (): Promise<void> => {
		const serviceManager = ServiceManager.getInstance();
		const settingsDb = serviceManager.getService('settingsDb');

		try {
			state.update((s) => ({ ...s, loading: true, error: null }));

			const [username, token] = await Promise.all([
				settingsDb.getUsername(),
				settingsDb.getToken()
			]);

			state.update((s) => ({
				...s,
				username: username || '',
				token: token || '',
				loading: false,
				isDirty: false
			}));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load settings';
			state.update((s) => ({ ...s, error: errorMessage, loading: false }));
		}
	};

	const save = async (): Promise<void> => {
		const serviceManager = ServiceManager.getInstance();
		const settingsDb = serviceManager.getService('settingsDb');
		const currentState = get(state);

		try {
			state.update((s) => ({ ...s, loading: true, error: null }));

			await Promise.all([
				settingsDb.saveUsername(currentState.username),
				settingsDb.saveToken(currentState.token)
			]);

			// Update GitHub service with new token if provided
			if (currentState.token) {
				serviceManager.setGitHubToken(currentState.token);
			}

			state.update((s) => ({ ...s, loading: false, isDirty: false }));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
			state.update((s) => ({ ...s, error: errorMessage, loading: false }));
		}
	};

	const setUsername = (username: string): void => {
		state.update((s) => ({ ...s, username, isDirty: true }));
	};

	const setToken = (token: string): void => {
		state.update((s) => ({ ...s, token, isDirty: true }));
	};

	const clearError = (): void => {
		state.update((s) => ({ ...s, error: null }));
	};

	const reset = (): void => {
		state.set(initialState);
	};

	// Validation helpers
	const isValid = (): boolean => {
		const { username, token } = get(state);
		return username.trim() !== '' && token.trim() !== '';
	};

	const hasCredentials = (): boolean => {
		return isValid();
	};

	return {
		// Store subscription
		subscribe: state.subscribe,

		// Actions
		load,
		save,
		setUsername,
		setToken,
		clearError,
		reset,

		// Validation
		isValid,
		hasCredentials,

		// Getter for current state
		get: () => get(state)
	};
}
