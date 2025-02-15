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
