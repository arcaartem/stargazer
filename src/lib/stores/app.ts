import { writable } from 'svelte/store';
import type { Repository, ProgressState } from '../types';

export type SortOption = 'stars' | 'name' | 'updated' | 'relevance';

export interface AppState {
	repositories: Repository[];
	loading: boolean;
	error: string | null;
	progress: ProgressState;
	searchTerm: string;
	sortBy: SortOption;
}

const initialState: AppState = {
	repositories: [],
	loading: false,
	error: null,
	progress: { current: 0, total: 0, visible: false },
	searchTerm: '',
	sortBy: 'relevance'
};

function createAppStore() {
	const { subscribe, set, update } = writable<AppState>(initialState);

	return {
		subscribe,
		// Reset to initial state
		reset: () => set(initialState),

		// Repository management
		setRepositories: (repositories: Repository[]) =>
			update((state) => ({ ...state, repositories })),

		// Loading state management
		setLoading: (loading: boolean) => update((state) => ({ ...state, loading })),

		// Error management
		setError: (error: string | null) => update((state) => ({ ...state, error })),
		clearError: () => update((state) => ({ ...state, error: null })),

		// Progress management
		setProgress: (progress: Partial<ProgressState>) =>
			update((state) => ({
				...state,
				progress: { ...state.progress, ...progress }
			})),
		showProgress: () =>
			update((state) => ({
				...state,
				progress: { ...state.progress, visible: true }
			})),
		hideProgress: () =>
			update((state) => ({
				...state,
				progress: { ...state.progress, visible: false }
			})),

		// Search management
		setSearchTerm: (searchTerm: string) => update((state) => ({ ...state, searchTerm })),
		setSortBy: (sortBy: SortOption) => update((state) => ({ ...state, sortBy })),

		// Bulk updates
		updateState: (updates: Partial<AppState>) => update((state) => ({ ...state, ...updates }))
	};
}

export const appStore = createAppStore();
