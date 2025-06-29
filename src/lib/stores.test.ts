import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { allRepos, progress } from './stores';
import type { Repository, ProgressState } from './types';

describe('Stores', () => {
	beforeEach(() => {
		// Reset stores to initial state
		allRepos.set([]);
		progress.set({
			current: 0,
			total: 0,
			visible: false
		});
	});

	describe('allRepos store', () => {
		const mockRepos: Repository[] = [
			{
				id: 1,
				name: 'test-repo-1',
				description: 'First test repository',
				html_url: 'https://github.com/user/test-repo-1',
				language: 'TypeScript',
				stargazers_count: 100,
				updated_at: '2023-01-01T00:00:00Z',
				owner: { login: 'user' }
			},
			{
				id: 2,
				name: 'test-repo-2',
				description: 'Second test repository',
				html_url: 'https://github.com/user/test-repo-2',
				language: 'JavaScript',
				stargazers_count: 200,
				updated_at: '2023-01-02T00:00:00Z',
				owner: { login: 'user' }
			}
		];

		it('should initialize with empty array', () => {
			const repos = get(allRepos);
			expect(repos).toEqual([]);
		});

		it('should update with new repositories', () => {
			allRepos.set(mockRepos);
			const repos = get(allRepos);

			expect(repos).toEqual(mockRepos);
			expect(repos).toHaveLength(2);
		});

		it('should update individual repositories', () => {
			allRepos.set(mockRepos);

			allRepos.update((repos) =>
				repos.map((repo) => (repo.id === 1 ? { ...repo, stargazers_count: 150 } : repo))
			);

			const updatedRepos = get(allRepos);
			expect(updatedRepos[0].stargazers_count).toBe(150);
			expect(updatedRepos[1].stargazers_count).toBe(200);
		});

		it('should handle adding new repositories', () => {
			allRepos.set(mockRepos);

			const newRepo: Repository = {
				id: 3,
				name: 'test-repo-3',
				description: 'Third test repository',
				html_url: 'https://github.com/user/test-repo-3',
				language: 'Python',
				stargazers_count: 300,
				updated_at: '2023-01-03T00:00:00Z',
				owner: { login: 'user' }
			};

			allRepos.update((repos) => [...repos, newRepo]);

			const updatedRepos = get(allRepos);
			expect(updatedRepos).toHaveLength(3);
			expect(updatedRepos[2]).toEqual(newRepo);
		});

		it('should handle removing repositories', () => {
			allRepos.set(mockRepos);

			allRepos.update((repos) => repos.filter((repo) => repo.id !== 1));

			const updatedRepos = get(allRepos);
			expect(updatedRepos).toHaveLength(1);
			expect(updatedRepos[0].id).toBe(2);
		});

		it('should handle clearing all repositories', () => {
			allRepos.set(mockRepos);
			allRepos.set([]);

			const repos = get(allRepos);
			expect(repos).toEqual([]);
		});

		it('should maintain reactivity', () => {
			let storeValue: Repository[] = [];

			const unsubscribe = allRepos.subscribe((value) => {
				storeValue = value;
			});

			allRepos.set(mockRepos);
			expect(storeValue).toEqual(mockRepos);

			allRepos.update((repos) => [...repos.slice(1)]);
			expect(storeValue).toHaveLength(1);

			unsubscribe();
		});
	});

	describe('progress store', () => {
		it('should initialize with correct default state', () => {
			const progressState = get(progress);

			expect(progressState).toEqual({
				current: 0,
				total: 0,
				visible: false
			});
		});

		it('should update progress values', () => {
			const newProgress: ProgressState = {
				current: 5,
				total: 10,
				visible: true
			};

			progress.set(newProgress);
			const progressState = get(progress);

			expect(progressState).toEqual(newProgress);
		});

		it('should update individual progress properties', () => {
			progress.update((p) => ({ ...p, visible: true }));

			let progressState = get(progress);
			expect(progressState.visible).toBe(true);
			expect(progressState.current).toBe(0);
			expect(progressState.total).toBe(0);

			progress.update((p) => ({ ...p, current: 3, total: 10 }));

			progressState = get(progress);
			expect(progressState.current).toBe(3);
			expect(progressState.total).toBe(10);
			expect(progressState.visible).toBe(true);
		});

		it('should handle progress completion', () => {
			progress.set({
				current: 10,
				total: 10,
				visible: true
			});

			progress.update((p) => ({ ...p, visible: false }));

			const progressState = get(progress);
			expect(progressState.current).toBe(10);
			expect(progressState.total).toBe(10);
			expect(progressState.visible).toBe(false);
		});

		it('should handle progress reset', () => {
			progress.set({
				current: 5,
				total: 10,
				visible: true
			});

			progress.set({
				current: 0,
				total: 0,
				visible: false
			});

			const progressState = get(progress);
			expect(progressState).toEqual({
				current: 0,
				total: 0,
				visible: false
			});
		});

		it('should maintain reactivity', () => {
			let storeValue: ProgressState = {
				current: 0,
				total: 0,
				visible: false
			};

			const unsubscribe = progress.subscribe((value) => {
				storeValue = value;
			});

			progress.set({
				current: 3,
				total: 10,
				visible: true
			});

			expect(storeValue).toEqual({
				current: 3,
				total: 10,
				visible: true
			});

			progress.update((p) => ({ ...p, current: 7 }));
			expect(storeValue.current).toBe(7);

			unsubscribe();
		});

		it('should handle edge cases', () => {
			// Test with negative values (shouldn't happen in real use but good to test)
			progress.set({
				current: -1,
				total: -5,
				visible: true
			});

			const progressState = get(progress);
			expect(progressState.current).toBe(-1);
			expect(progressState.total).toBe(-5);

			// Test with current > total
			progress.set({
				current: 15,
				total: 10,
				visible: true
			});

			const progressState2 = get(progress);
			expect(progressState2.current).toBe(15);
			expect(progressState2.total).toBe(10);
		});
	});

	describe('Store interactions', () => {
		it('should allow independent updates to both stores', () => {
			const mockRepos: Repository[] = [
				{
					id: 1,
					name: 'test-repo',
					description: 'Test repository',
					html_url: 'https://github.com/user/test-repo',
					language: 'TypeScript',
					stargazers_count: 100,
					updated_at: '2023-01-01T00:00:00Z',
					owner: { login: 'user' }
				}
			];

			allRepos.set(mockRepos);
			progress.set({
				current: 1,
				total: 1,
				visible: true
			});

			const repos = get(allRepos);
			const progressState = get(progress);

			expect(repos).toEqual(mockRepos);
			expect(progressState).toEqual({
				current: 1,
				total: 1,
				visible: true
			});

			// Update one store shouldn't affect the other
			allRepos.set([]);

			const updatedRepos = get(allRepos);
			const unchangedProgress = get(progress);

			expect(updatedRepos).toEqual([]);
			expect(unchangedProgress).toEqual({
				current: 1,
				total: 1,
				visible: true
			});
		});

		it('should handle simultaneous subscriptions', () => {
			let repoCount = 0;
			let progressVisible = false;

			const unsubscribeRepos = allRepos.subscribe((repos) => {
				repoCount = repos.length;
			});

			const unsubscribeProgress = progress.subscribe((p) => {
				progressVisible = p.visible;
			});

			allRepos.set([
				{
					id: 1,
					name: 'test',
					description: 'test',
					html_url: 'https://github.com/test/test',
					language: 'TypeScript',
					stargazers_count: 0,
					updated_at: '2023-01-01T00:00:00Z',
					owner: { login: 'test' }
				}
			]);

			progress.update((p) => ({ ...p, visible: true }));

			expect(repoCount).toBe(1);
			expect(progressVisible).toBe(true);

			unsubscribeRepos();
			unsubscribeProgress();
		});
	});
});
