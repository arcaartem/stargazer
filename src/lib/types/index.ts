export interface StarredRepo {
	id: number;
	nodeId: string;
	name: string;
	fullName: string;
	description: string | null;
	readme: string;

	ownerLogin: string;
	ownerAvatarUrl: string;
	ownerType: string;

	htmlUrl: string;
	homepageUrl: string | null;
	gitUrl: string;
	sshUrl: string;
	cloneUrl: string;

	language: string | null;
	topics: string[];
	license: string | null;
	archived: boolean;
	fork: boolean;
	isTemplate: boolean;
	private: boolean;

	stargazersCount: number;
	watchersCount: number;
	forksCount: number;
	openIssuesCount: number;
	size: number;

	starredAt: string;
	createdAt: string;
	updatedAt: string;
	pushedAt: string;

	hasIssues: boolean;
	hasProjects: boolean;
	hasWiki: boolean;
	hasPages: boolean;
	hasDiscussions: boolean;
	hasDownloads: boolean;

	defaultBranch: string;

	licenseName: string | null;
	licenseUrl: string | null;

	lastSyncedAt: string;
}

export interface AppSettings {
	githubUsername: string;
	githubToken: string;
	lastSyncedAt: string | null;
	repoCount: number;
	readmeCount: number;
}

export interface SyncProgress {
	phase:
		| 'idle'
		| 'fetching-repos'
		| 'fetching-readmes'
		| 'indexing'
		| 'persisting'
		| 'done'
		| 'error';
	current: number;
	total: number;
	message: string;
}

export interface SearchFilters {
	languages: string[];
	topics: string[];
	licenses: string[];
	owners: string[];
	ownerTypes: string[];
	archived: boolean | null;
	fork: boolean | null;
	isTemplate: boolean | null;
	isPrivate: boolean | null;
	hasIssues: boolean | null;
	hasWiki: boolean | null;
	hasPages: boolean | null;
	hasDiscussions: boolean | null;
	starsMin: number | null;
	starsMax: number | null;
	forksMin: number | null;
	forksMax: number | null;
	sizeMin: number | null;
	sizeMax: number | null;
	createdAfter: string | null;
	createdBefore: string | null;
	updatedAfter: string | null;
	updatedBefore: string | null;
	starredAfter: string | null;
	starredBefore: string | null;
}

export type SortOption =
	| 'relevance'
	| 'stars-desc'
	| 'stars-asc'
	| 'name-asc'
	| 'name-desc'
	| 'updated-desc'
	| 'starred-desc'
	| 'created-desc'
	| 'forks-desc'
	| 'size-desc';

export interface SearchResult {
	repos: StarredRepo[];
	totalCount: number;
}

export interface GitHubApiRepo {
	id: number;
	node_id: string;
	name: string;
	full_name: string;
	description: string | null;
	owner: {
		login: string;
		avatar_url: string;
		type: string;
	};
	html_url: string;
	homepage: string | null;
	git_url: string;
	ssh_url: string;
	clone_url: string;
	language: string | null;
	topics: string[];
	license: {
		spdx_id: string;
		name: string;
		url: string | null;
	} | null;
	archived: boolean;
	fork: boolean;
	is_template: boolean;
	private: boolean;
	stargazers_count: number;
	watchers_count: number;
	forks_count: number;
	open_issues_count: number;
	size: number;
	created_at: string;
	updated_at: string;
	pushed_at: string;
	has_issues: boolean;
	has_projects: boolean;
	has_wiki: boolean;
	has_pages: boolean;
	has_discussions: boolean;
	has_downloads: boolean;
	default_branch: string;
}

export interface GitHubStarResponse {
	starred_at: string;
	repo: GitHubApiRepo;
}
