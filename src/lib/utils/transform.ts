import type { GitHubStarResponse, StarredRepo } from '$lib/types';

export function transformGitHubRepo(
	response: GitHubStarResponse,
	readme: string = ''
): StarredRepo {
	const { repo } = response;
	return {
		id: repo.id,
		nodeId: repo.node_id,
		name: repo.name,
		fullName: repo.full_name,
		description: repo.description,
		readme,
		ownerLogin: repo.owner.login,
		ownerAvatarUrl: repo.owner.avatar_url,
		ownerType: repo.owner.type,
		htmlUrl: repo.html_url,
		homepageUrl: repo.homepage,
		gitUrl: repo.git_url,
		sshUrl: repo.ssh_url,
		cloneUrl: repo.clone_url,
		language: repo.language,
		topics: repo.topics,
		license: repo.license?.spdx_id ?? null,
		archived: repo.archived,
		fork: repo.fork,
		isTemplate: repo.is_template,
		private: repo.private,
		stargazersCount: repo.stargazers_count,
		watchersCount: repo.watchers_count,
		forksCount: repo.forks_count,
		openIssuesCount: repo.open_issues_count,
		size: repo.size,
		starredAt: response.starred_at,
		createdAt: repo.created_at,
		updatedAt: repo.updated_at,
		pushedAt: repo.pushed_at,
		hasIssues: repo.has_issues,
		hasProjects: repo.has_projects,
		hasWiki: repo.has_wiki,
		hasPages: repo.has_pages,
		hasDiscussions: repo.has_discussions,
		hasDownloads: repo.has_downloads,
		defaultBranch: repo.default_branch,
		licenseName: repo.license?.name ?? null,
		licenseUrl: repo.license?.url ?? null,
		lastSyncedAt: new Date().toISOString()
	};
}

export function stripMarkdownForSearch(markdown: string): string {
	return markdown
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`[^`]*`/g, ' ')
		.replace(/!\[.*?\]\(.*?\)/g, ' ')
		.replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
		.replace(/#{1,6}\s*/g, '')
		.replace(/[*_~]+/g, '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/^>\s*/gm, '')
		.replace(/[-*+]\s+/g, '')
		.replace(/\d+\.\s+/g, '')
		.replace(/\|.*\|/g, ' ')
		.replace(/[-=]{3,}/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}
