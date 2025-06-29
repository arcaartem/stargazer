import { writable, get } from 'svelte/store';
import type { AsyncState } from '../types';
import { useErrorHandler } from './useErrorHandler';

export interface AsyncOperationOptions {
	throwOnError?: boolean;
	errorContext?: string;
}

/**
 * Composable for managing async operations with proper loading states and error handling
 */
export function useAsyncOperation<T>(options: AsyncOperationOptions = {}) {
	const { throwOnError = false, errorContext = 'Async Operation' } = options;

	const initialState: AsyncState<T> = {
		data: null,
		loading: false,
		error: null
	};

	const state = writable<AsyncState<T>>(initialState);
	const errorHandler = useErrorHandler();

	/**
	 * Execute an async operation with proper loading state management
	 */
	const execute = async (operation: () => Promise<T>): Promise<T | null> => {
		// Clear previous state
		state.update((s) => ({
			...s,
			loading: true,
			error: null
		}));

		try {
			const result = await operation();

			state.update((s) => ({
				...s,
				data: result,
				loading: false,
				error: null
			}));

			return result;
		} catch (error) {
			const errorMessage =
				typeof error === 'string'
					? error
					: error instanceof Error
						? error.message
						: 'Unknown error occurred';

			state.update((s) => ({
				...s,
				data: null,
				loading: false,
				error: errorMessage
			}));

			// Handle error through error handler
			errorHandler.handleAsyncError(error, errorContext);

			if (throwOnError) {
				throw error;
			}

			return null;
		}
	};

	/**
	 * Execute multiple async operations concurrently
	 */
	const executeMany = async <R>(operations: (() => Promise<R>)[]): Promise<R[]> => {
		state.update((s) => ({
			...s,
			loading: true,
			error: null
		}));

		try {
			const results = await Promise.all(operations.map((op) => op()));

			state.update((s) => ({
				...s,
				loading: false,
				error: null
			}));

			return results;
		} catch (error) {
			const errorMessage =
				typeof error === 'string'
					? error
					: error instanceof Error
						? error.message
						: 'Unknown error occurred';

			state.update((s) => ({
				...s,
				loading: false,
				error: errorMessage
			}));

			errorHandler.handleAsyncError(error, `${errorContext} (Multiple Operations)`);

			if (throwOnError) {
				throw error;
			}

			return [];
		}
	};

	/**
	 * Reset the async operation state
	 */
	const reset = (): void => {
		state.set(initialState);
		errorHandler.clearCurrentError();
	};

	/**
	 * Clear only the error state
	 */
	const clearError = (): void => {
		state.update((s) => ({ ...s, error: null }));
		errorHandler.clearCurrentError();
	};

	/**
	 * Update the data without triggering loading state
	 */
	const setData = (data: T | null): void => {
		state.update((s) => ({ ...s, data }));
	};

	return {
		// Store subscription
		subscribe: state.subscribe,

		// Actions
		execute,
		executeMany,
		reset,
		clearError,
		setData,

		// State getters
		get: () => get(state),
		isLoading: () => get(state).loading,
		hasError: () => get(state).error !== null,
		getData: () => get(state).data
	};
}
