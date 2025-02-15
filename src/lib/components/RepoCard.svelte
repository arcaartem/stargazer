<script lang="ts">
	import type { Repository } from '$lib/types';

	export let repo: Repository;
	$: formattedDate = new Date(repo.updated_at).toLocaleDateString();
</script>

<div class="repo-card">
	<h3>
		<a href={repo.html_url} target="_blank" rel="noopener noreferrer">
			{repo.owner.login} / {repo.name}
		</a>
	</h3>
	<p>{repo.description || 'No description available'}</p>
	<div class="repo-meta">
		<span>⭐ {repo.stargazers_count.toLocaleString()} stars</span>
		<span>🔄 Updated: {formattedDate}</span>
		<span>🔠 {repo.language || 'Not specified'}</span>
	</div>
</div>

<style>
	.repo-card {
		border: 1px solid #e1e4e8;
		padding: 15px;
		border-radius: 6px;
		background: white;
		margin-bottom: 15px;
	}

	.repo-card h3 {
		margin-bottom: 8px;
	}

	.repo-card a {
		color: #0366d6;
		text-decoration: none;
	}

	.repo-card a:hover {
		text-decoration: underline;
	}

	.repo-meta {
		display: flex;
		gap: 15px;
		font-size: 14px;
		color: #586069;
	}
</style>
