<script lang="ts">
	import type { Repository } from '$lib/types';

	export let repo: Repository;
</script>

<div class="rounded-lg bg-white p-6 shadow">
	<div class="mb-2 flex items-start justify-between">
		<h3 class="truncate text-lg font-semibold text-gray-900">
			{repo.name}
		</h3>
		<span class="flex items-center text-sm text-gray-500">
			⭐ {repo.stargazers_count.toLocaleString()}
		</span>
	</div>

	{#if repo.description}
		<p class="mb-3 line-clamp-2 text-sm text-gray-600">
			{repo.description}
		</p>
	{/if}

	<div class="flex items-center justify-between text-sm text-gray-500">
		<span class="rounded bg-gray-100 px-2 py-1">
			{repo.language || 'No language'}
		</span>
		<a
			href={repo.html_url}
			target="_blank"
			rel="noopener noreferrer"
			class="text-blue-600 hover:text-blue-800"
		>
			View on GitHub
		</a>
	</div>
</div>
