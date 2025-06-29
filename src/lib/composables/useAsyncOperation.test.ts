import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { useAsyncOperation } from './useAsyncOperation';
import type { AsyncState } from '../types';

// Mock the useErrorHandler
vi.mock('./useErrorHandler', () => ({
	useErrorHandler: () => ({
		handleAsyncError: vi.fn(),
		clearCurrentError: vi.fn()
	})
}));

describe('useAsyncOperation', () => {
	let mockOperation: ReturnType<typeof vi.fn>;
	let mockFailingOperation: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockOperation = vi.fn().mockResolvedValue('test result');
		mockFailingOperation = vi.fn().mockRejectedValue(new Error('Test error'));
	});

	describe('initialization', () => {
		it('should initialize with correct default state', () => {
			const asyncOp = useAsyncOperation();
			const state = get(asyncOp);

			expect(state).toEqual({
				data: null,
				loading: false,
				error: null
			});
		});

		it('should initialize with custom options', () => {
			const asyncOp = useAsyncOperation({
				throwOnError: true,
				errorContext: 'Custom Operation'
			});

			expect(asyncOp.get()).toEqual({
				data: null,
				loading: false,
				error: null
			});
		});
	});

	describe('execute method', () => {
		it('should execute successful operation and update state correctly', async () => {
			const asyncOp = useAsyncOperation();

			const result = await asyncOp.execute(mockOperation);

			expect(result).toBe('test result');
			expect(mockOperation).toHaveBeenCalledOnce();

			const finalState = asyncOp.get();
			expect(finalState).toEqual({
				data: 'test result',
				loading: false,
				error: null
			});
		});

		it('should handle operation errors gracefully', async () => {
			const asyncOp = useAsyncOperation();

			const result = await asyncOp.execute(mockFailingOperation);

			expect(result).toBeNull();
			expect(mockFailingOperation).toHaveBeenCalledOnce();

			const finalState = asyncOp.get();
			expect(finalState).toEqual({
				data: null,
				loading: false,
				error: 'Test error'
			});
		});

		it('should throw error when throwOnError is true', async () => {
			const asyncOp = useAsyncOperation({ throwOnError: true });

			await expect(asyncOp.execute(mockFailingOperation)).rejects.toThrow('Test error');

			const finalState = asyncOp.get();
			expect(finalState.error).toBe('Test error');
		});

		it('should set loading state during operation execution', async () => {
			const asyncOp = useAsyncOperation();
			let loadingDuringExecution = false;

			const slowOperation = async () => {
				loadingDuringExecution = asyncOp.isLoading();
				return 'result';
			};

			await asyncOp.execute(slowOperation);

			expect(loadingDuringExecution).toBe(true);
			expect(asyncOp.isLoading()).toBe(false);
		});

		it('should handle string errors', async () => {
			const stringErrorOperation = vi.fn().mockRejectedValue('String error');
			const asyncOp = useAsyncOperation();

			await asyncOp.execute(stringErrorOperation);

			const state = asyncOp.get();
			expect(state.error).toBe('String error');
		});

		it('should handle unknown error types', async () => {
			const unknownErrorOperation = vi.fn().mockRejectedValue({ some: 'object' });
			const asyncOp = useAsyncOperation();

			await asyncOp.execute(unknownErrorOperation);

			const state = asyncOp.get();
			expect(state.error).toBe('Unknown error occurred');
		});
	});

	describe('executeMany method', () => {
		it('should execute multiple operations concurrently', async () => {
			const asyncOp = useAsyncOperation<string>();
			const operations = [
				() => Promise.resolve('result1'),
				() => Promise.resolve('result2'),
				() => Promise.resolve('result3')
			];

			const results = await asyncOp.executeMany(operations);

			expect(results).toEqual(['result1', 'result2', 'result3']);
			expect(asyncOp.isLoading()).toBe(false);
		});

		it('should handle errors in multiple operations', async () => {
			const asyncOp = useAsyncOperation();
			const operations = [
				() => Promise.resolve('result1'),
				() => Promise.reject(new Error('Operation failed')),
				() => Promise.resolve('result3')
			];

			const results = await asyncOp.executeMany(operations);

			expect(results).toEqual([]);
			const state = asyncOp.get();
			expect(state.error).toBe('Operation failed');
		});

		it('should set loading state during multiple operations', async () => {
			const asyncOp = useAsyncOperation();
			let loadingDuringExecution = false;

			const operations = [
				async () => {
					loadingDuringExecution = asyncOp.isLoading();
					return 'result';
				}
			];

			await asyncOp.executeMany(operations);

			expect(loadingDuringExecution).toBe(true);
			expect(asyncOp.isLoading()).toBe(false);
		});
	});

	describe('state management methods', () => {
		it('should reset state correctly', () => {
			const asyncOp = useAsyncOperation();

			// Set some state
			asyncOp.setData('test data');
			asyncOp.reset();

			const state = asyncOp.get();
			expect(state).toEqual({
				data: null,
				loading: false,
				error: null
			});
		});

		it('should clear error correctly', async () => {
			const asyncOp = useAsyncOperation();

			// Create an error
			await asyncOp.execute(mockFailingOperation);
			expect(asyncOp.hasError()).toBe(true);

			// Clear the error
			asyncOp.clearError();

			const state = asyncOp.get();
			expect(state.error).toBeNull();
			expect(asyncOp.hasError()).toBe(false);
		});

		it('should set data correctly', () => {
			const asyncOp = useAsyncOperation();

			asyncOp.setData('custom data');

			const state = asyncOp.get();
			expect(state.data).toBe('custom data');
			expect(state.loading).toBe(false);
			expect(state.error).toBeNull();
		});
	});

	describe('utility methods', () => {
		it('should return correct loading state', () => {
			const asyncOp = useAsyncOperation();

			expect(asyncOp.isLoading()).toBe(false);

			// The isLoading() method gets current state correctly
			// We can't test it during execution without complex async setup
			// This test verifies the initial state is correct
		});

		it('should return correct error state', async () => {
			const asyncOp = useAsyncOperation();

			expect(asyncOp.hasError()).toBe(false);

			await asyncOp.execute(mockFailingOperation);
			expect(asyncOp.hasError()).toBe(true);
		});

		it('should return current data', async () => {
			const asyncOp = useAsyncOperation();

			expect(asyncOp.getData()).toBeNull();

			await asyncOp.execute(mockOperation);
			expect(asyncOp.getData()).toBe('test result');
		});
	});

	describe('store subscription', () => {
		it('should allow subscribing to state changes', () => {
			const asyncOp = useAsyncOperation<string>();
			const stateUpdates: AsyncState<string>[] = [];

			const unsubscribe = asyncOp.subscribe((state) => {
				stateUpdates.push(state);
			});

			asyncOp.setData('test');

			unsubscribe();

			expect(stateUpdates.length).toBeGreaterThan(0);
			expect(stateUpdates[stateUpdates.length - 1].data).toBe('test');
		});
	});
});
