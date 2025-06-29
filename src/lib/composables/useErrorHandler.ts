import { writable } from 'svelte/store';
import type { AppError, ErrorSeverity } from '../types';

interface ErrorHandlerState {
	errors: AppError[];
	currentError: AppError | null;
}

const initialState: ErrorHandlerState = {
	errors: [],
	currentError: null
};

export function useErrorHandler() {
	const state = writable<ErrorHandlerState>(initialState);

	/**
	 * Generate a unique error ID
	 */
	const generateErrorId = (): string => {
		return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	};

	/**
	 * Extract meaningful error message from unknown error
	 */
	const extractErrorMessage = (error: unknown): string => {
		if (error instanceof Error) {
			return error.message;
		}
		if (typeof error === 'string') {
			return error;
		}
		if (error && typeof error === 'object' && 'message' in error) {
			return String(error.message);
		}
		return 'An unknown error occurred';
	};

	/**
	 * Extract stack trace from error if available
	 */
	const extractStackTrace = (error: unknown): string | undefined => {
		if (error instanceof Error && error.stack) {
			return error.stack;
		}
		return undefined;
	};

	/**
	 * Handle an error with proper categorization and logging
	 */
	const handleError = (
		error: unknown,
		severity: ErrorSeverity = 'error',
		context?: Record<string, unknown>
	): AppError => {
		const appError: AppError = {
			id: generateErrorId(),
			severity,
			message: extractErrorMessage(error),
			details: error instanceof Error ? error.toString() : undefined,
			timestamp: Date.now(),
			context,
			stack: extractStackTrace(error)
		};

		state.update((s) => ({
			...s,
			errors: [...s.errors, appError],
			currentError: appError
		}));

		// Log to console based on severity
		switch (severity) {
			case 'info':
				console.info('App Error:', appError);
				break;
			case 'warning':
				console.warn('App Warning:', appError);
				break;
			case 'error':
				console.error('App Error:', appError);
				break;
			case 'critical':
				console.error('CRITICAL App Error:', appError);
				break;
		}

		return appError;
	};

	/**
	 * Handle common async operation errors
	 */
	const handleAsyncError = (
		error: unknown,
		operation: string,
		context?: Record<string, unknown>
	): AppError => {
		const enhancedContext = {
			operation,
			...context
		};

		return handleError(error, 'error', enhancedContext);
	};

	/**
	 * Handle API errors with specific formatting
	 */
	const handleApiError = (error: unknown, endpoint: string, method: string = 'GET'): AppError => {
		const context = {
			type: 'api_error',
			endpoint,
			method
		};

		return handleError(error, 'error', context);
	};

	/**
	 * Handle database errors
	 */
	const handleDbError = (error: unknown, operation: string, tableName?: string): AppError => {
		const context = {
			type: 'database_error',
			operation,
			tableName
		};

		return handleError(error, 'error', context);
	};

	/**
	 * Clear the current error
	 */
	const clearCurrentError = (): void => {
		state.update((s) => ({
			...s,
			currentError: null
		}));
	};

	/**
	 * Clear all errors
	 */
	const clearAllErrors = (): void => {
		state.update((s) => ({
			...s,
			errors: [],
			currentError: null
		}));
	};

	/**
	 * Remove a specific error by ID
	 */
	const removeError = (errorId: string): void => {
		state.update((s) => {
			const filteredErrors = s.errors.filter((err) => err.id !== errorId);
			return {
				...s,
				errors: filteredErrors,
				currentError: s.currentError?.id === errorId ? null : s.currentError
			};
		});
	};

	/**
	 * Get errors by severity
	 */
	const getErrorsBySeverity = (severity: ErrorSeverity): AppError[] => {
		let errors: AppError[] = [];
		state.subscribe((s) => {
			errors = s.errors.filter((err) => err.severity === severity);
		})();
		return errors;
	};

	/**
	 * Check if there are any critical errors
	 */
	const hasCriticalErrors = (): boolean => {
		return getErrorsBySeverity('critical').length > 0;
	};

	/**
	 * Create an error boundary wrapper for async operations
	 */
	const withErrorBoundary = async <T>(
		operation: () => Promise<T>,
		operationName: string,
		context?: Record<string, unknown>
	): Promise<T | null> => {
		try {
			return await operation();
		} catch (error) {
			handleAsyncError(error, operationName, context);
			return null;
		}
	};

	return {
		// State subscription
		subscribe: state.subscribe,

		// Error handling methods
		handleError,
		handleAsyncError,
		handleApiError,
		handleDbError,

		// Error management
		clearCurrentError,
		clearAllErrors,
		removeError,

		// Error querying
		getErrorsBySeverity,
		hasCriticalErrors,

		// Error boundary
		withErrorBoundary
	};
}
