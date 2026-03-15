<script lang="ts">
	import type { SearchFilters } from '$lib/types';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		filters,
		readmeOnly = false,
		onRemove,
		onClearAll
	}: {
		filters: Partial<SearchFilters>;
		readmeOnly?: boolean;
		onRemove: (key: string, value?: string) => void;
		onClearAll: () => void;
	} = $props();

	interface Chip {
		key: string;
		label: string;
		value?: string;
	}

	const FILTER_LABELS: Record<string, string> = {
		languages: 'language',
		topics: 'topic',
		licenses: 'license',
		owners: 'owner',
		archived: 'archived',
		fork: 'fork',
		isTemplate: 'template',
		isPrivate: 'private',
		hasIssues: 'issues',
		hasWiki: 'wiki',
		hasPages: 'pages',
		hasDiscussions: 'discussions',
		starsMin: 'stars >=',
		starsMax: 'stars <=',
		forksMin: 'forks >=',
		forksMax: 'forks <=',
		sizeMin: 'size >=',
		sizeMax: 'size <=',
		createdAfter: 'created after',
		createdBefore: 'created before',
		updatedAfter: 'updated after',
		updatedBefore: 'updated before',
		starredAfter: 'starred after',
		starredBefore: 'starred before'
	};

	let chips = $derived.by(() => {
		const result: Chip[] = [];

		for (const [key, val] of Object.entries(filters)) {
			if (val === null || val === undefined) continue;

			if (Array.isArray(val)) {
				for (const v of val) {
					result.push({ key, label: `${FILTER_LABELS[key] ?? key}: ${v}`, value: v });
				}
			} else if (typeof val === 'boolean') {
				result.push({ key, label: `${FILTER_LABELS[key] ?? key}: ${val ? 'yes' : 'no'}` });
			} else {
				result.push({ key, label: `${FILTER_LABELS[key] ?? key} ${val}` });
			}
		}

		if (readmeOnly) {
			result.push({ key: '__readmeOnly', label: 'in: readme' });
		}

		return result;
	});

	let hasChips = $derived(chips.length > 0);
</script>

{#if hasChips}
	<div class="flex flex-wrap items-center gap-1.5">
		{#each chips as chip (chip.label)}
			<span
				class="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
			>
				{chip.label}
				<button
					class="text-muted-foreground hover:text-foreground -mr-0.5 rounded p-0.5"
					onclick={() => onRemove(chip.key, chip.value)}
					aria-label="Remove {chip.label} filter"
				>
					<XIcon class="h-3 w-3" />
				</button>
			</span>
		{/each}
		<button
			class="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
			onclick={onClearAll}
		>
			Clear all
		</button>
	</div>
{/if}
