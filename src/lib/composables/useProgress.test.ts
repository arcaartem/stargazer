import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useProgress } from './useProgress';
import type { ProgressState } from '$lib/types';

describe('useProgress', () => {
	let progress: ReturnType<typeof useProgress>;

	beforeEach(() => {
		progress = useProgress();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should initialize with correct defaults', () => {
		const state = progress.get();

		expect(state).toEqual({
			current: 0,
			total: 0,
			visible: false
		});
	});

	it('should show progress correctly', () => {
		progress.show();
		const state = progress.get();

		expect(state.visible).toBe(true);
	});

	it('should hide progress correctly', () => {
		progress.show();
		progress.hide();
		const state = progress.get();

		expect(state.visible).toBe(false);
	});

	it('should update progress values correctly', () => {
		progress.update(50, 100);
		const state = progress.get();

		expect(state.current).toBe(50);
		expect(state.total).toBe(100);
	});

	it('should set partial progress state correctly', () => {
		progress.set({ current: 25, visible: true });
		const state = progress.get();

		expect(state.current).toBe(25);
		expect(state.visible).toBe(true);
		expect(state.total).toBe(0); // Should preserve existing value
	});

	it('should reset progress correctly', () => {
		progress.update(50, 100);
		progress.show();
		progress.reset();
		const state = progress.get();

		expect(state).toEqual({
			current: 0,
			total: 0,
			visible: false
		});
	});

	it('should start progress correctly', () => {
		progress.start();
		const state = progress.get();

		expect(state).toEqual({
			current: 0,
			total: 1,
			visible: true
		});
	});

	it('should complete progress correctly', () => {
		progress.start();
		progress.update(50, 100);
		progress.complete();
		const state = progress.get();

		expect(state).toEqual({
			current: 0,
			total: 0,
			visible: false
		});
	});

	it('should create progress callback correctly', () => {
		const callback = progress.createCallback();

		expect(typeof callback).toBe('function');

		callback(25, 50);
		const state = progress.get();

		expect(state.current).toBe(25);
		expect(state.total).toBe(50);
	});

	it('should handle state subscription correctly', () => {
		const stateUpdates: ProgressState[] = [];

		progress.subscribe((state) => {
			stateUpdates.push(state);
		});

		progress.show();
		progress.update(10, 20);
		progress.hide();

		expect(stateUpdates.length).toBeGreaterThan(0);

		// Check the final state
		const finalState = stateUpdates[stateUpdates.length - 1];
		expect(finalState.current).toBe(10);
		expect(finalState.total).toBe(20);
		expect(finalState.visible).toBe(false);
	});

	it('should preserve other state when updating specific values', () => {
		progress.set({ current: 10, total: 20, visible: true });

		// Update only current
		progress.update(15, 20);
		const state = progress.get();

		expect(state.current).toBe(15);
		expect(state.total).toBe(20);
		expect(state.visible).toBe(true); // Should be preserved
	});

	it('should handle multiple quick updates correctly', () => {
		progress.update(10, 100);
		progress.update(20, 100);
		progress.update(30, 100);

		const state = progress.get();

		expect(state.current).toBe(30);
		expect(state.total).toBe(100);
	});
});
