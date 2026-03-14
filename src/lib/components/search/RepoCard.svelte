<script lang="ts">
	import type { StarredRepo } from '$lib/types';
	import { Badge } from '$lib/components/ui/badge';
	import { formatNumber, formatRelativeDate } from '$lib/utils/formatting';

	let {
		repo,
		selected = false,
		onclick
	}: {
		repo: StarredRepo;
		selected?: boolean;
		onclick?: () => void;
	} = $props();
</script>

<button
	class="hover:bg-accent/50 w-full rounded-lg border p-4 text-left transition-colors {selected
		? 'border-primary bg-accent/30'
		: 'border-border'}"
	{onclick}
>
	<div class="flex items-start justify-between gap-2">
		<div class="min-w-0 flex-1">
			<h3 class="text-foreground truncate font-medium">{repo.fullName}</h3>
			{#if repo.description}
				<p class="text-muted-foreground mt-1 line-clamp-2 text-sm">{repo.description}</p>
			{/if}
		</div>
	</div>

	<div class="text-muted-foreground mt-3 flex flex-wrap items-center gap-2 text-xs">
		{#if repo.language}
			<span class="flex items-center gap-1">
				<span class="bg-primary inline-block h-2.5 w-2.5 rounded-full"></span>
				{repo.language}
			</span>
		{/if}
		<span>&#9733; {formatNumber(repo.stargazersCount)}</span>
		<span>&#9906; {formatNumber(repo.forksCount)}</span>
		<span>Updated {formatRelativeDate(repo.updatedAt)}</span>
	</div>

	{#if repo.topics.length > 0}
		<div class="mt-2 flex flex-wrap gap-1">
			{#each repo.topics.slice(0, 5) as topic (topic)}
				<Badge variant="secondary" class="text-xs">{topic}</Badge>
			{/each}
			{#if repo.topics.length > 5}
				<Badge variant="outline" class="text-xs">+{repo.topics.length - 5}</Badge>
			{/if}
		</div>
	{/if}
</button>
