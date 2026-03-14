import { describe, it, expect } from 'vitest';
import { validateGithubUsername, validateGithubToken, validateSearchTerm } from './validation';

describe('validateGithubUsername', () => {
	it('returns null for valid usernames', () => {
		expect(validateGithubUsername('octocat')).toBeNull();
		expect(validateGithubUsername('user-name')).toBeNull();
		expect(validateGithubUsername('a')).toBeNull();
		expect(validateGithubUsername('user123')).toBeNull();
	});

	it('rejects empty usernames', () => {
		expect(validateGithubUsername('')).toBe('Username is required');
		expect(validateGithubUsername('   ')).toBe('Username is required');
	});

	it('rejects usernames over 39 characters', () => {
		expect(validateGithubUsername('a'.repeat(40))).toBe('Username must be 39 characters or less');
	});

	it('rejects usernames with invalid characters', () => {
		expect(validateGithubUsername('user_name')).not.toBeNull();
		expect(validateGithubUsername('-username')).not.toBeNull();
		expect(validateGithubUsername('username-')).not.toBeNull();
		expect(validateGithubUsername('user name')).not.toBeNull();
	});
});

describe('validateGithubToken', () => {
	it('returns null for valid tokens', () => {
		expect(validateGithubToken('ghp_abcdefghij')).toBeNull();
		expect(validateGithubToken('github_pat_abcdefghij')).toBeNull();
	});

	it('rejects empty tokens', () => {
		expect(validateGithubToken('')).toBe('Token is required');
		expect(validateGithubToken('   ')).toBe('Token is required');
	});

	it('rejects tokens without proper prefix', () => {
		expect(validateGithubToken('abcdefghij')).toBe('Token must start with "ghp_" or "github_pat_"');
	});

	it('rejects short tokens', () => {
		expect(validateGithubToken('ghp_abc')).toBe('Token is too short');
	});
});

describe('validateSearchTerm', () => {
	it('returns null for valid search terms', () => {
		expect(validateSearchTerm('')).toBeNull();
		expect(validateSearchTerm('hello world')).toBeNull();
	});

	it('rejects overly long search terms', () => {
		expect(validateSearchTerm('a'.repeat(201))).toBe('Search term is too long');
	});
});
