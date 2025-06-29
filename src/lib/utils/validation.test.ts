import { describe, it, expect } from 'vitest';
import {
	validateGitHubUsername,
	validateGitHubToken,
	validateSearchTerm,
	validateEmail,
	validateUrl,
	validateRequired,
	validateLength,
	validateRange,
	createValidationResult,
	combineValidationResults,
	isRepository,
	isSettingsRecord,
	validators,
	typeGuards
} from './validation';

describe('validation utilities', () => {
	describe('createValidationResult', () => {
		it('should create valid result with no errors', () => {
			const result = createValidationResult(true);
			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		it('should create invalid result with errors', () => {
			const errors = ['Error 1', 'Error 2'];
			const result = createValidationResult(false, errors);
			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(errors);
		});
	});

	describe('combineValidationResults', () => {
		it('should combine valid results', () => {
			const result1 = createValidationResult(true);
			const result2 = createValidationResult(true);
			const combined = combineValidationResults(result1, result2);

			expect(combined.isValid).toBe(true);
			expect(combined.errors).toEqual([]);
		});

		it('should combine invalid results', () => {
			const result1 = createValidationResult(false, ['Error 1']);
			const result2 = createValidationResult(false, ['Error 2']);
			const combined = combineValidationResults(result1, result2);

			expect(combined.isValid).toBe(false);
			expect(combined.errors).toEqual(['Error 1', 'Error 2']);
		});

		it('should invalidate combined result if any input is invalid', () => {
			const result1 = createValidationResult(true);
			const result2 = createValidationResult(false, ['Error']);
			const combined = combineValidationResults(result1, result2);

			expect(combined.isValid).toBe(false);
			expect(combined.errors).toEqual(['Error']);
		});
	});

	describe('validateGitHubUsername', () => {
		it('should validate correct usernames', () => {
			const validUsernames = [
				'testuser',
				'test-user',
				'user123',
				'a',
				'a'.repeat(39) // max length
			];

			validUsernames.forEach((username) => {
				const result = validateGitHubUsername(username);
				expect(result.isValid).toBe(true);
				expect(result.errors).toEqual([]);
			});
		});

		it('should reject invalid usernames', () => {
			const testCases = [
				{ username: '', expectedError: 'Username cannot be empty' },
				{ username: '   ', expectedError: 'Username cannot be empty' },
				{ username: 'a'.repeat(40), expectedError: 'Username cannot be longer than 39 characters' },
				{ username: '-testuser', expectedError: 'Username cannot start or end with a hyphen' },
				{ username: 'testuser-', expectedError: 'Username cannot start or end with a hyphen' },
				{ username: 'test--user', expectedError: 'Username cannot contain consecutive hyphens' },
				{
					username: 'test_user',
					expectedError: 'Username can only contain alphanumeric characters and hyphens'
				},
				{
					username: 'test.user',
					expectedError: 'Username can only contain alphanumeric characters and hyphens'
				}
			];

			testCases.forEach(({ username, expectedError }) => {
				const result = validateGitHubUsername(username);
				expect(result.isValid).toBe(false);
				expect(result.errors).toContain(expectedError);
			});
		});

		it('should handle non-string inputs', () => {
			const result = validateGitHubUsername(null as unknown as string);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Username is required');
		});
	});

	describe('validateGitHubToken', () => {
		it('should validate correct tokens', () => {
			const validTokens = [
				'ghp_1234567890abcdef1234567890abcdef12345678',
				'gho_1234567890abcdef1234567890abcdef12345678',
				'a'.repeat(40), // minimum length without prefix
				'a'.repeat(100) // longer token
			];

			validTokens.forEach((token) => {
				const result = validateGitHubToken(token);
				expect(result.isValid).toBe(true);
				expect(result.errors).toEqual([]);
			});
		});

		it('should reject invalid tokens', () => {
			const testCases = [
				{ token: '', expectedError: 'Token cannot be empty' },
				{ token: '   ', expectedError: 'Token cannot be empty' },
				{ token: 'short', expectedError: 'Token must be at least 40 characters long' },
				{
					token: 'token-with-hyphens-123456789012345678901234',
					expectedError: 'Token contains invalid characters'
				}
			];

			testCases.forEach(({ token, expectedError }) => {
				const result = validateGitHubToken(token);
				expect(result.isValid).toBe(false);
				expect(result.errors).toContain(expectedError);
			});
		});

		it('should handle non-string inputs', () => {
			const result = validateGitHubToken(null as unknown as string);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Token is required');
		});
	});

	describe('validateSearchTerm', () => {
		it('should validate correct search terms', () => {
			const validTerms = [
				'react',
				'vue.js',
				'search term with spaces',
				'a',
				'a'.repeat(256) // max length
			];

			validTerms.forEach((term) => {
				const result = validateSearchTerm(term);
				expect(result.isValid).toBe(true);
				expect(result.errors).toEqual([]);
			});
		});

		it('should reject invalid search terms', () => {
			const testCases = [
				{ term: '', expectedError: 'Search term cannot be empty' },
				{ term: '   ', expectedError: 'Search term cannot be empty' },
				{
					term: 'a'.repeat(257),
					expectedError: 'Search term cannot be longer than 256 characters'
				},
				{ term: 'search<script>', expectedError: 'Search term contains invalid characters' },
				{ term: 'search"term', expectedError: 'Search term contains invalid characters' },
				{ term: "search'term", expectedError: 'Search term contains invalid characters' }
			];

			testCases.forEach(({ term, expectedError }) => {
				const result = validateSearchTerm(term);
				expect(result.isValid).toBe(false);
				expect(result.errors).toContain(expectedError);
			});
		});

		it('should handle non-string inputs', () => {
			const result = validateSearchTerm(null as unknown as string);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Search term is required');
		});
	});

	describe('validateEmail', () => {
		it('should validate correct emails', () => {
			const validEmails = [
				'test@example.com',
				'user.name@domain.co.uk',
				'test+tag@gmail.com',
				'a@b.c'
			];

			validEmails.forEach((email) => {
				const result = validateEmail(email);
				expect(result.isValid).toBe(true);
				expect(result.errors).toEqual([]);
			});
		});

		it('should reject invalid emails', () => {
			const testCases = [
				{ email: '', expectedError: 'Email cannot be empty' },
				{ email: '   ', expectedError: 'Email cannot be empty' },
				{ email: 'invalid-email', expectedError: 'Please enter a valid email address' },
				{ email: '@domain.com', expectedError: 'Please enter a valid email address' },
				{ email: 'user@', expectedError: 'Please enter a valid email address' },
				{ email: 'a'.repeat(250) + '@domain.com', expectedError: 'Email address is too long' }
			];

			testCases.forEach(({ email, expectedError }) => {
				const result = validateEmail(email);
				expect(result.isValid).toBe(false);
				expect(result.errors).toContain(expectedError);
			});
		});

		it('should handle non-string inputs', () => {
			const result = validateEmail(null as unknown as string);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Email is required');
		});
	});

	describe('validateUrl', () => {
		it('should validate correct URLs', () => {
			const validUrls = [
				'https://example.com',
				'http://localhost:3000',
				'https://subdomain.example.com/path?query=value',
				'ftp://files.example.com'
			];

			validUrls.forEach((url) => {
				const result = validateUrl(url);
				expect(result.isValid).toBe(true);
				expect(result.errors).toEqual([]);
			});
		});

		it('should reject invalid URLs', () => {
			const testCases = [
				{ url: '', expectedError: 'URL cannot be empty' },
				{ url: '   ', expectedError: 'URL cannot be empty' },
				{ url: 'invalid-url', expectedError: 'Please enter a valid URL' },
				{ url: 'not a url', expectedError: 'Please enter a valid URL' }
			];

			testCases.forEach(({ url, expectedError }) => {
				const result = validateUrl(url);
				expect(result.isValid).toBe(false);
				expect(result.errors).toContain(expectedError);
			});
		});

		it('should handle non-string inputs', () => {
			const result = validateUrl(null as unknown as string);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('URL is required');
		});
	});

	describe('validateRequired', () => {
		it('should validate present values', () => {
			const validValues = ['value', 0, false, [], {}];

			validValues.forEach((value) => {
				const result = validateRequired(value, 'field');
				expect(result.isValid).toBe(true);
			});
		});

		it('should reject empty values', () => {
			const emptyValues = [null, undefined, ''];

			emptyValues.forEach((value) => {
				const result = validateRequired(value, 'testField');
				expect(result.isValid).toBe(false);
				expect(result.errors).toContain('testField is required');
			});
		});
	});

	describe('validateLength', () => {
		it('should validate strings within length constraints', () => {
			const result1 = validateLength('hello', 'field', 3, 10);
			expect(result1.isValid).toBe(true);

			const result2 = validateLength('test', 'field', undefined, 10);
			expect(result2.isValid).toBe(true);

			const result3 = validateLength('test', 'field', 3, undefined);
			expect(result3.isValid).toBe(true);
		});

		it('should reject strings outside length constraints', () => {
			const result1 = validateLength('hi', 'field', 3, 10);
			expect(result1.isValid).toBe(false);
			expect(result1.errors).toContain('field must be at least 3 characters long');

			const result2 = validateLength('very long string', 'field', 3, 10);
			expect(result2.isValid).toBe(false);
			expect(result2.errors).toContain('field cannot be longer than 10 characters');
		});

		it('should reject non-string values', () => {
			const result = validateLength(123 as unknown as string, 'field', 3, 10);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('field must be a string');
		});
	});

	describe('validateRange', () => {
		it('should validate numbers within range', () => {
			const result1 = validateRange(5, 'field', 1, 10);
			expect(result1.isValid).toBe(true);

			const result2 = validateRange(5, 'field', undefined, 10);
			expect(result2.isValid).toBe(true);

			const result3 = validateRange(5, 'field', 1, undefined);
			expect(result3.isValid).toBe(true);
		});

		it('should reject numbers outside range', () => {
			const result1 = validateRange(0, 'field', 1, 10);
			expect(result1.isValid).toBe(false);
			expect(result1.errors).toContain('field must be at least 1');

			const result2 = validateRange(15, 'field', 1, 10);
			expect(result2.isValid).toBe(false);
			expect(result2.errors).toContain('field cannot be greater than 10');
		});

		it('should reject non-numeric values', () => {
			const result1 = validateRange('not a number' as unknown as number, 'field', 1, 10);
			expect(result1.isValid).toBe(false);
			expect(result1.errors).toContain('field must be a valid number');

			const result2 = validateRange(NaN, 'field', 1, 10);
			expect(result2.isValid).toBe(false);
			expect(result2.errors).toContain('field must be a valid number');
		});
	});

	describe('type guards', () => {
		describe('isRepository', () => {
			it('should validate correct repository objects', () => {
				const validRepo = {
					id: 123,
					name: 'test-repo',
					description: 'A test repository',
					html_url: 'https://github.com/user/test-repo',
					language: 'TypeScript',
					stargazers_count: 42,
					updated_at: '2023-01-01T00:00:00Z',
					owner: {
						login: 'testuser'
					}
				};

				expect(isRepository(validRepo)).toBe(true);

				// Test with null description and language
				const repoWithNulls = { ...validRepo, description: null, language: null };
				expect(isRepository(repoWithNulls)).toBe(true);
			});

			it('should reject invalid repository objects', () => {
				const invalidRepos = [
					null,
					undefined,
					{},
					{ id: 'string' }, // wrong type
					{ id: 123, name: 123 }, // wrong type for name
					{ id: 123, name: 'test', owner: null }, // null owner
					{ id: 123, name: 'test', owner: { login: 123 } } // wrong type for owner.login
				];

				invalidRepos.forEach((repo) => {
					expect(isRepository(repo)).toBe(false);
				});
			});
		});

		describe('isSettingsRecord', () => {
			it('should validate correct settings record objects', () => {
				const validRecord = {
					name: 'username',
					value: 'testuser',
					timestamp: Date.now()
				};

				expect(isSettingsRecord(validRecord)).toBe(true);

				// Test with undefined value
				const recordWithUndefinedValue = { ...validRecord, value: undefined };
				expect(isSettingsRecord(recordWithUndefinedValue)).toBe(true);
			});

			it('should reject invalid settings record objects', () => {
				const invalidRecords = [
					null,
					undefined,
					{},
					{ name: 123 }, // wrong type
					{ name: 'test', value: 123 }, // wrong type for value
					{ name: 'test', timestamp: 'string' } // wrong type for timestamp
				];

				invalidRecords.forEach((record) => {
					expect(isSettingsRecord(record)).toBe(false);
				});
			});
		});
	});

	describe('validators object', () => {
		it('should export all validation functions', () => {
			expect(validators.githubUsername).toBe(validateGitHubUsername);
			expect(validators.githubToken).toBe(validateGitHubToken);
			expect(validators.searchTerm).toBe(validateSearchTerm);
			expect(validators.email).toBe(validateEmail);
			expect(validators.url).toBe(validateUrl);
		});
	});

	describe('typeGuards object', () => {
		it('should export all type guard functions', () => {
			expect(typeGuards.isRepository).toBe(isRepository);
			expect(typeGuards.isSettingsRecord).toBe(isSettingsRecord);
		});
	});
});
