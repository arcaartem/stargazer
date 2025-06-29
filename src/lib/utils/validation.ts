import type { ValidationResult, TypeGuard, Repository, SettingsRecord } from '../types';

/**
 * Create a validation result object
 */
export const createValidationResult = (
	isValid: boolean,
	errors: string[] = []
): ValidationResult => ({
	isValid,
	errors
});

/**
 * Combine multiple validation results
 */
export const combineValidationResults = (...results: ValidationResult[]): ValidationResult => {
	const isValid = results.every((result) => result.isValid);
	const errors = results.flatMap((result) => result.errors);
	return createValidationResult(isValid, errors);
};

/**
 * GitHub username validation
 * Rules: 1-39 characters, alphanumeric + hyphens, cannot start/end with hyphen
 */
export const validateGitHubUsername = (username: string): ValidationResult => {
	const errors: string[] = [];

	if (username === null || username === undefined || typeof username !== 'string') {
		errors.push('Username is required');
		return createValidationResult(false, errors);
	}

	const trimmed = username.trim();

	if (trimmed.length === 0) {
		errors.push('Username cannot be empty');
		return createValidationResult(false, errors);
	}

	if (trimmed.length > 39) {
		errors.push('Username cannot be longer than 39 characters');
	}

	if (!/^[a-zA-Z0-9-]+$/.test(trimmed)) {
		errors.push('Username can only contain alphanumeric characters and hyphens');
	}

	if (trimmed.startsWith('-') || trimmed.endsWith('-')) {
		errors.push('Username cannot start or end with a hyphen');
	}

	if (trimmed.includes('--')) {
		errors.push('Username cannot contain consecutive hyphens');
	}

	return createValidationResult(errors.length === 0, errors);
};

/**
 * GitHub personal access token validation
 * Basic format validation - tokens are typically 40+ characters, alphanumeric + underscore
 */
export const validateGitHubToken = (token: string): ValidationResult => {
	const errors: string[] = [];

	if (token === null || token === undefined || typeof token !== 'string') {
		errors.push('Token is required');
		return createValidationResult(false, errors);
	}

	const trimmed = token.trim();

	if (trimmed.length === 0) {
		errors.push('Token cannot be empty');
		return createValidationResult(false, errors);
	}

	if (trimmed.length < 40) {
		errors.push('Token must be at least 40 characters long');
	}

	if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
		errors.push('Token contains invalid characters');
	}

	// Check for common token prefixes
	const validPrefixes = ['ghp_', 'gho_', 'ghu_', 'ghs_', 'ghr_'];
	const hasValidPrefix = validPrefixes.some((prefix) => trimmed.startsWith(prefix));

	if (trimmed.length >= 40 && !hasValidPrefix) {
		// This is a warning, not an error - older tokens might not have prefixes
		// We'll still mark it as valid but log a warning
	}

	return createValidationResult(errors.length === 0, errors);
};

/**
 * Search term validation
 */
export const validateSearchTerm = (term: string): ValidationResult => {
	const errors: string[] = [];

	if (term === null || term === undefined || typeof term !== 'string') {
		errors.push('Search term is required');
		return createValidationResult(false, errors);
	}

	const trimmed = term.trim();

	if (trimmed.length === 0) {
		errors.push('Search term cannot be empty');
		return createValidationResult(false, errors);
	}

	if (trimmed.length > 256) {
		errors.push('Search term cannot be longer than 256 characters');
	}

	// Check for potentially problematic characters
	if (/[<>"'&]/.test(trimmed)) {
		errors.push('Search term contains invalid characters');
	}

	return createValidationResult(errors.length === 0, errors);
};

/**
 * Email validation (basic)
 */
export const validateEmail = (email: string): ValidationResult => {
	const errors: string[] = [];

	if (email === null || email === undefined || typeof email !== 'string') {
		errors.push('Email is required');
		return createValidationResult(false, errors);
	}

	const trimmed = email.trim();

	if (trimmed.length === 0) {
		errors.push('Email cannot be empty');
		return createValidationResult(false, errors);
	}

	// Basic email regex - not perfect but covers most cases
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(trimmed)) {
		errors.push('Please enter a valid email address');
	}

	if (trimmed.length > 254) {
		errors.push('Email address is too long');
	}

	return createValidationResult(errors.length === 0, errors);
};

/**
 * URL validation
 */
export const validateUrl = (url: string): ValidationResult => {
	const errors: string[] = [];

	if (url === null || url === undefined || typeof url !== 'string') {
		errors.push('URL is required');
		return createValidationResult(false, errors);
	}

	const trimmed = url.trim();

	if (trimmed.length === 0) {
		errors.push('URL cannot be empty');
		return createValidationResult(false, errors);
	}

	try {
		new URL(trimmed);
	} catch {
		errors.push('Please enter a valid URL');
	}

	return createValidationResult(errors.length === 0, errors);
};

/**
 * Type guards for runtime type checking
 */

/**
 * Type guard for Repository objects
 */
export const isRepository: TypeGuard<Repository> = (value: unknown): value is Repository => {
	if (!value || typeof value !== 'object') return false;

	const repo = value as Record<string, unknown>;

	return (
		typeof repo.id === 'number' &&
		typeof repo.name === 'string' &&
		(repo.description === null || typeof repo.description === 'string') &&
		typeof repo.html_url === 'string' &&
		(repo.language === null || typeof repo.language === 'string') &&
		typeof repo.stargazers_count === 'number' &&
		typeof repo.updated_at === 'string' &&
		typeof repo.owner === 'object' &&
		repo.owner !== null &&
		typeof (repo.owner as Record<string, unknown>).login === 'string'
	);
};

/**
 * Type guard for SettingsRecord objects
 */
export const isSettingsRecord: TypeGuard<SettingsRecord> = (
	value: unknown
): value is SettingsRecord => {
	if (!value || typeof value !== 'object') return false;

	const settings = value as Record<string, unknown>;

	return (
		typeof settings.name === 'string' &&
		(settings.value === undefined || typeof settings.value === 'string') &&
		typeof settings.timestamp === 'number'
	);
};

/**
 * Validation utilities for common patterns
 */
export const validators = {
	githubUsername: validateGitHubUsername,
	githubToken: validateGitHubToken,
	searchTerm: validateSearchTerm,
	email: validateEmail,
	url: validateUrl
};

/**
 * Type guards collection
 */
export const typeGuards = {
	isRepository,
	isSettingsRecord
};

/**
 * Generic validation helpers
 */

/**
 * Validate that a value is not empty
 */
export const validateRequired = (value: unknown, fieldName: string): ValidationResult => {
	if (value === null || value === undefined || value === '') {
		return createValidationResult(false, [`${fieldName} is required`]);
	}
	return createValidationResult(true);
};

/**
 * Validate string length
 */
export const validateLength = (
	value: string,
	fieldName: string,
	min?: number,
	max?: number
): ValidationResult => {
	const errors: string[] = [];

	if (typeof value !== 'string') {
		errors.push(`${fieldName} must be a string`);
		return createValidationResult(false, errors);
	}

	if (min !== undefined && value.length < min) {
		errors.push(`${fieldName} must be at least ${min} characters long`);
	}

	if (max !== undefined && value.length > max) {
		errors.push(`${fieldName} cannot be longer than ${max} characters`);
	}

	return createValidationResult(errors.length === 0, errors);
};

/**
 * Validate numeric range
 */
export const validateRange = (
	value: number,
	fieldName: string,
	min?: number,
	max?: number
): ValidationResult => {
	const errors: string[] = [];

	if (typeof value !== 'number' || isNaN(value)) {
		errors.push(`${fieldName} must be a valid number`);
		return createValidationResult(false, errors);
	}

	if (min !== undefined && value < min) {
		errors.push(`${fieldName} must be at least ${min}`);
	}

	if (max !== undefined && value > max) {
		errors.push(`${fieldName} cannot be greater than ${max}`);
	}

	return createValidationResult(errors.length === 0, errors);
};
