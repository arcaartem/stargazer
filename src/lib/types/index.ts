export interface Repository {
	id: number;
	name: string;
	description: string | null;
	html_url: string;
	language: string | null;
	stargazers_count: number;
	updated_at: string;
	owner: {
		login: string;
	};
}

export interface ProgressState {
	current: number;
	total: number;
	visible: boolean;
}

export interface SettingsRecord {
	name: string;
	value?: string;
	timestamp: number;
}

export interface RepositoryRecord {
	id: number;
	repository: Repository;
	timestamp: number;
}

export type SortOption = 'stars' | 'name' | 'updated' | 'relevance';

// New utility types for Phase 4
export type AsyncState<T> = {
	data: T | null;
	loading: boolean;
	error: string | null;
};

export interface SearchFilters {
	term: string;
	sortBy: SortOption;
	language?: string;
}

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
}

export interface ErrorInfo {
	message: string;
	timestamp: number;
	context?: Record<string, unknown>;
}

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
	id: string;
	severity: ErrorSeverity;
	message: string;
	details?: string;
	timestamp: number;
	context?: Record<string, unknown>;
	stack?: string;
}

// Type guards for runtime validation
export type TypeGuard<T> = (value: unknown) => value is T;

// Common form state pattern
export interface FormState<T> {
	values: T;
	errors: Partial<Record<keyof T, string>>;
	isValid: boolean;
	isDirty: boolean;
	isSubmitting: boolean;
}
