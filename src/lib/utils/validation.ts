export function validateGithubUsername(username: string): string | null {
	if (!username.trim()) return 'Username is required';
	if (username.length > 39) return 'Username must be 39 characters or less';
	if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(username)) {
		return 'Username may only contain alphanumeric characters or hyphens, and cannot begin or end with a hyphen';
	}
	return null;
}

export function validateGithubToken(token: string): string | null {
	if (!token.trim()) return 'Token is required';
	if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
		return 'Token must start with "ghp_" or "github_pat_"';
	}
	if (token.length < 10) return 'Token is too short';
	return null;
}

export function validateSearchTerm(term: string): string | null {
	if (term.length > 200) return 'Search term is too long';
	return null;
}
