<script lang="ts">
	import type { Repository } from '$lib/types';
	import { A, Card, Heading } from 'flowbite-svelte';

	export let repo: Repository;
	$: formattedDate = new Date(repo.updated_at).toLocaleDateString();
</script>

<Card class="w-full" size="lg">
	<!-- <div class="repo-card"> -->
	<Heading tag="h3">
		<A href={repo.html_url} target="_blank" rel="noopener noreferrer">
			{repo.owner.login} / {repo.name}
		</A>
	</Heading>
	<p>{repo.description || 'No description available'}</p>
	<div>
		<span>⭐ {repo.stargazers_count.toLocaleString()} stars</span>
		<span>🔄 Updated: {formattedDate}</span>
		<span>🔠 {repo.language || 'Not specified'}</span>
	</div>
	<!-- </div> -->
</Card>

<style>
</style>
