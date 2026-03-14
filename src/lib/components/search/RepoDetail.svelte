<script lang="ts">
	import type { StarredRepo } from '$lib/types';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import * as Sheet from '$lib/components/ui/sheet';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { formatNumber, formatDate, formatBytes } from '$lib/utils/formatting';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';

	let {
		repo,
		open = $bindable(false)
	}: {
		repo: StarredRepo | null;
		open?: boolean;
	} = $props();

	let renderedReadme = $derived.by(() => {
		if (!repo?.readme) return '';
		const raw = marked.parse(repo.readme);
		if (typeof raw === 'string') {
			return DOMPurify.sanitize(raw);
		}
		return '';
	});
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full sm:max-w-xl md:max-w-2xl">
		{#if repo}
			<Sheet.Header>
				<Sheet.Title class="flex items-center gap-2">
					<img src={repo.ownerAvatarUrl} alt={repo.ownerLogin} class="h-6 w-6 rounded-full" />
					{repo.fullName}
				</Sheet.Title>
				{#if repo.description}
					<Sheet.Description>{repo.description}</Sheet.Description>
				{/if}
			</Sheet.Header>

			<ScrollArea class="h-[calc(100vh-8rem)] pr-4">
				<div class="space-y-4 py-4">
					<!-- Links -->
					<div class="flex gap-2">
						<Button variant="outline" size="sm" href={repo.htmlUrl} target="_blank" rel="noopener">
							GitHub
						</Button>
						{#if repo.homepageUrl}
							<Button
								variant="outline"
								size="sm"
								href={repo.homepageUrl}
								target="_blank"
								rel="noopener"
							>
								Website
							</Button>
						{/if}
					</div>

					<Separator />

					<!-- Stats -->
					<div class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
						<div>
							<div class="text-muted-foreground">Stars</div>
							<div class="font-medium">{formatNumber(repo.stargazersCount)}</div>
						</div>
						<div>
							<div class="text-muted-foreground">Forks</div>
							<div class="font-medium">{formatNumber(repo.forksCount)}</div>
						</div>
						<div>
							<div class="text-muted-foreground">Issues</div>
							<div class="font-medium">{formatNumber(repo.openIssuesCount)}</div>
						</div>
						<div>
							<div class="text-muted-foreground">Size</div>
							<div class="font-medium">{formatBytes(repo.size)}</div>
						</div>
					</div>

					<Separator />

					<!-- Metadata -->
					<div class="space-y-2 text-sm">
						{#if repo.language}
							<div class="flex justify-between">
								<span class="text-muted-foreground">Language</span>
								<span>{repo.language}</span>
							</div>
						{/if}
						{#if repo.license}
							<div class="flex justify-between">
								<span class="text-muted-foreground">License</span>
								<span>{repo.licenseName ?? repo.license}</span>
							</div>
						{/if}
						<div class="flex justify-between">
							<span class="text-muted-foreground">Default branch</span>
							<span>{repo.defaultBranch}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Created</span>
							<span>{formatDate(repo.createdAt)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Updated</span>
							<span>{formatDate(repo.updatedAt)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Starred</span>
							<span>{formatDate(repo.starredAt)}</span>
						</div>
					</div>

					<!-- Tags -->
					{#if repo.topics.length > 0}
						<Separator />
						<div class="flex flex-wrap gap-1">
							{#each repo.topics as topic}
								<Badge variant="secondary">{topic}</Badge>
							{/each}
						</div>
					{/if}

					<!-- Feature flags -->
					<Separator />
					<div class="flex flex-wrap gap-2">
						{#if repo.archived}<Badge variant="destructive">Archived</Badge>{/if}
						{#if repo.fork}<Badge variant="outline">Fork</Badge>{/if}
						{#if repo.isTemplate}<Badge variant="outline">Template</Badge>{/if}
						{#if repo.private}<Badge variant="outline">Private</Badge>{/if}
					</div>

					<!-- README -->
					{#if renderedReadme}
						<Separator />
						<div class="prose prose-sm dark:prose-invert max-w-none">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html renderedReadme}
						</div>
					{:else}
						<Separator />
						<p class="text-muted-foreground text-sm">No README available.</p>
					{/if}
				</div>
			</ScrollArea>
		{/if}
	</Sheet.Content>
</Sheet.Root>
