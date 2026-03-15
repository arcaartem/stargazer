<script lang="ts">
	import type { SearchFilters } from '$lib/types';
	import { Input } from '$lib/components/ui/input';
	import FilterChips from './FilterChips.svelte';
	import SyntaxHelp from './SyntaxHelp.svelte';

	let {
		query = $bindable(),
		parsedFilters = {},
		readmeOnly = false,
		hasActiveFilters = false,
		onSearch,
		onRemoveFilter,
		onClearFilters
	}: {
		query: string;
		parsedFilters?: Partial<SearchFilters>;
		readmeOnly?: boolean;
		hasActiveFilters?: boolean;
		onSearch: (query: string) => void;
		onRemoveFilter?: (key: string, value?: string) => void;
		onClearFilters?: () => void;
	} = $props();

	let debounceTimer: ReturnType<typeof setTimeout>;

	function handleInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		query = value;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => onSearch(value), 300);
	}
</script>

<div class="space-y-2">
	<div class="flex items-center gap-1">
		<Input
			type="text"
			placeholder="Search repos... (try language:rust stars:>100)"
			value={query}
			oninput={handleInput}
			class="flex-1"
		/>
		<SyntaxHelp />
	</div>

	{#if hasActiveFilters}
		<FilterChips
			filters={parsedFilters}
			{readmeOnly}
			onRemove={(key, value) => onRemoveFilter?.(key, value)}
			onClearAll={() => onClearFilters?.()}
		/>
	{/if}
</div>
