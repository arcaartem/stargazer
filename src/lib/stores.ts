import { writable } from 'svelte/store';
import type { Repository, ProgressState } from './types';

export const allRepos = writable<Repository[]>([]);
export const progress = writable<ProgressState>({
	current: 0,
	total: 0,
	visible: false
});
