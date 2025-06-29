import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useErrorHandler } from './useErrorHandler';
import type { ErrorSeverity, AppError } from '../types';

interface ErrorHandlerState {
	errors: AppError[];
	currentError: AppError | null;
}

describe('useErrorHandler', () => {
	let errorHandler: ReturnType<typeof useErrorHandler>;
	let consoleSpies: {
		info: ReturnType<typeof vi.spyOn>;
		warn: ReturnType<typeof vi.spyOn>;
		error: ReturnType<typeof vi.spyOn>;
	};

	beforeEach(() => {
		errorHandler = useErrorHandler();

		// Spy on console methods
		consoleSpies = {
			info: vi.spyOn(console, 'info').mockImplementation(() => {}),
			warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
			error: vi.spyOn(console, 'error').mockImplementation(() => {})
		};
	});

	afterEach(() => {
		// Restore console methods
		Object.values(consoleSpies).forEach((spy) => spy.mockRestore());
	});

	describe('basic error handling', () => {
		it('should handle Error instances correctly', () => {
			const error = new Error('Test error message');
			const appError = errorHandler.handleError(error);

			expect(appError.message).toBe('Test error message');
			expect(appError.severity).toBe('error');
			expect(appError.stack).toBeDefined();
			expect(appError.id).toBeDefined();
			expect(appError.timestamp).toBeDefined();
		});

		it('should handle string errors', () => {
			const errorMessage = 'String error message';
			const appError = errorHandler.handleError(errorMessage);

			expect(appError.message).toBe(errorMessage);
			expect(appError.severity).toBe('error');
			expect(appError.stack).toBeUndefined();
		});

		it('should handle unknown error types', () => {
			const unknownError = { someProperty: 'value' };
			const appError = errorHandler.handleError(unknownError);

			expect(appError.message).toBe('An unknown error occurred');
			expect(appError.severity).toBe('error');
		});

		it('should handle objects with message property', () => {
			const errorObject = { message: 'Object error message', code: 500 };
			const appError = errorHandler.handleError(errorObject);

			expect(appError.message).toBe('Object error message');
		});

		it('should accept custom severity levels', () => {
			const severities: ErrorSeverity[] = ['info', 'warning', 'error', 'critical'];

			severities.forEach((severity) => {
				const appError = errorHandler.handleError('Test message', severity);
				expect(appError.severity).toBe(severity);
			});
		});

		it('should include custom context', () => {
			const context = { userId: '123', action: 'save' };
			const appError = errorHandler.handleError('Test error', 'error', context);

			expect(appError.context).toEqual(context);
		});
	});

	describe('console logging', () => {
		it('should log info messages correctly', () => {
			errorHandler.handleError('Info message', 'info');
			expect(consoleSpies.info).toHaveBeenCalledWith('App Error:', expect.any(Object));
		});

		it('should log warnings correctly', () => {
			errorHandler.handleError('Warning message', 'warning');
			expect(consoleSpies.warn).toHaveBeenCalledWith('App Warning:', expect.any(Object));
		});

		it('should log errors correctly', () => {
			errorHandler.handleError('Error message', 'error');
			expect(consoleSpies.error).toHaveBeenCalledWith('App Error:', expect.any(Object));
		});

		it('should log critical errors correctly', () => {
			errorHandler.handleError('Critical message', 'critical');
			expect(consoleSpies.error).toHaveBeenCalledWith('CRITICAL App Error:', expect.any(Object));
		});
	});

	describe('state management', () => {
		it('should track errors in state', () => {
			let state: ErrorHandlerState = { errors: [], currentError: null };
			errorHandler.subscribe((s) => {
				state = s;
			});

			expect(state.errors).toHaveLength(0);
			expect(state.currentError).toBeNull();

			errorHandler.handleError('First error');
			expect(state.errors).toHaveLength(1);
			expect(state.currentError).toBeDefined();

			errorHandler.handleError('Second error');
			expect(state.errors).toHaveLength(2);
		});

		it('should clear current error', () => {
			let state: ErrorHandlerState = { errors: [], currentError: null };
			errorHandler.subscribe((s) => {
				state = s;
			});

			errorHandler.handleError('Test error');
			expect(state.currentError).toBeDefined();

			errorHandler.clearCurrentError();
			expect(state.currentError).toBeNull();
			expect(state.errors).toHaveLength(1); // Should keep error history
		});

		it('should clear all errors', () => {
			let state: ErrorHandlerState = { errors: [], currentError: null };
			errorHandler.subscribe((s) => {
				state = s;
			});

			errorHandler.handleError('First error');
			errorHandler.handleError('Second error');
			expect(state.errors).toHaveLength(2);

			errorHandler.clearAllErrors();
			expect(state.errors).toHaveLength(0);
			expect(state.currentError).toBeNull();
		});

		it('should remove specific error by ID', () => {
			let state: ErrorHandlerState = { errors: [], currentError: null };
			errorHandler.subscribe((s) => {
				state = s;
			});

			const error1 = errorHandler.handleError('First error');
			const error2 = errorHandler.handleError('Second error');
			expect(state.errors).toHaveLength(2);

			errorHandler.removeError(error1.id);
			expect(state.errors).toHaveLength(1);
			expect(state.errors[0].id).toBe(error2.id);
		});

		it('should update current error when removing it', () => {
			let state: ErrorHandlerState = { errors: [], currentError: null };
			errorHandler.subscribe((s) => {
				state = s;
			});

			const currentError = errorHandler.handleError('Current error');
			expect(state.currentError?.id).toBe(currentError.id);

			errorHandler.removeError(currentError.id);
			expect(state.currentError).toBeNull();
		});
	});

	describe('specialized error handlers', () => {
		it('should handle async errors with operation context', () => {
			const error = new Error('Async operation failed');
			const appError = errorHandler.handleAsyncError(error, 'fetchData', { userId: '123' });

			expect(appError.context?.operation).toBe('fetchData');
			expect(appError.context?.userId).toBe('123');
		});

		it('should handle API errors with endpoint context', () => {
			const error = new Error('API call failed');
			const appError = errorHandler.handleApiError(error, '/api/users', 'POST');

			expect(appError.context?.type).toBe('api_error');
			expect(appError.context?.endpoint).toBe('/api/users');
			expect(appError.context?.method).toBe('POST');
		});

		it('should handle database errors with operation context', () => {
			const error = new Error('Database connection failed');
			const appError = errorHandler.handleDbError(error, 'insert', 'users');

			expect(appError.context?.type).toBe('database_error');
			expect(appError.context?.operation).toBe('insert');
			expect(appError.context?.tableName).toBe('users');
		});
	});

	describe('error querying', () => {
		beforeEach(() => {
			errorHandler.handleError('Info message', 'info');
			errorHandler.handleError('Warning message', 'warning');
			errorHandler.handleError('Error message', 'error');
			errorHandler.handleError('Critical message', 'critical');
			errorHandler.handleError('Another error', 'error');
		});

		it('should get errors by severity', () => {
			const infoErrors = errorHandler.getErrorsBySeverity('info');
			const errorMessages = errorHandler.getErrorsBySeverity('error');
			const criticalErrors = errorHandler.getErrorsBySeverity('critical');

			expect(infoErrors).toHaveLength(1);
			expect(errorMessages).toHaveLength(2);
			expect(criticalErrors).toHaveLength(1);
		});

		it('should detect critical errors', () => {
			expect(errorHandler.hasCriticalErrors()).toBe(true);

			errorHandler.clearAllErrors();
			errorHandler.handleError('Non-critical error', 'error');
			expect(errorHandler.hasCriticalErrors()).toBe(false);
		});
	});

	describe('error boundary', () => {
		it('should wrap successful async operations', async () => {
			const successfulOperation = vi.fn().mockResolvedValue('success');

			const result = await errorHandler.withErrorBoundary(successfulOperation, 'testOperation');

			expect(result).toBe('success');
			expect(successfulOperation).toHaveBeenCalled();
		});

		it('should catch and handle errors in async operations', async () => {
			const failingOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));

			const result = await errorHandler.withErrorBoundary(failingOperation, 'testOperation', {
				contextData: 'test'
			});

			expect(result).toBeNull();
			expect(failingOperation).toHaveBeenCalled();

			// Verify error was handled
			let state: ErrorHandlerState = { errors: [], currentError: null };
			errorHandler.subscribe((s) => {
				state = s;
			});
			expect(state.errors).toHaveLength(1);
			expect(state.errors[0].context?.operation).toBe('testOperation');
			expect(state.errors[0].context?.contextData).toBe('test');
		});
	});

	describe('error ID generation', () => {
		it('should generate unique error IDs', () => {
			const error1 = errorHandler.handleError('Error 1');
			const error2 = errorHandler.handleError('Error 2');

			expect(error1.id).toBeDefined();
			expect(error2.id).toBeDefined();
			expect(error1.id).not.toBe(error2.id);
		});

		it('should generate IDs with correct format', () => {
			const appError = errorHandler.handleError('Test error');

			expect(appError.id).toMatch(/^error_\d+_[a-z0-9]+$/);
		});
	});

	describe('timestamp handling', () => {
		it('should include timestamp in errors', () => {
			const beforeTime = Date.now();
			const appError = errorHandler.handleError('Test error');
			const afterTime = Date.now();

			expect(appError.timestamp).toBeGreaterThanOrEqual(beforeTime);
			expect(appError.timestamp).toBeLessThanOrEqual(afterTime);
		});
	});
});
