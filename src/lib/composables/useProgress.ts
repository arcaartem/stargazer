import { writable, get } from 'svelte/store';
import type { ProgressState } from '../types';

export interface ProgressManager {
	visible: boolean;
	current: number;
	total: number;
}

export function useProgress() {
	const initialState: ProgressState = {
		current: 0,
		total: 0,
		visible: false
	};

	const progress = writable<ProgressState>(initialState);

	const show = (): void => {
		progress.update((state) => ({ ...state, visible: true }));
	};

	const hide = (): void => {
		progress.update((state) => ({ ...state, visible: false }));
	};

	const update = (current: number, total: number): void => {
		progress.update((state) => ({ ...state, current, total }));
	};

	const set = (newProgress: Partial<ProgressState>): void => {
		progress.update((state) => ({ ...state, ...newProgress }));
	};

	const reset = (): void => {
		progress.set(initialState);
	};

	// Create a progress callback function for external APIs
	const createCallback = () => {
		return (current: number, total: number) => {
			update(current, total);
		};
	};

	// Start progress tracking (show and reset)
	const start = (): void => {
		progress.set({ current: 0, total: 1, visible: true });
	};

	// Complete progress tracking (hide and reset)
	const complete = (): void => {
		progress.set({ current: 0, total: 0, visible: false });
	};

	return {
		// Store subscription
		subscribe: progress.subscribe,

		// Actions
		show,
		hide,
		update,
		set,
		reset,
		start,
		complete,
		createCallback,

		// Getter for current state
		get: () => get(progress)
	};
}
