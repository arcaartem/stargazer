<script lang="ts">
	import type { SearchFilters } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Checkbox } from '$lib/components/ui/checkbox';

	let {
		filters = $bindable(),
		availableLanguages = [],
		availableTopics = [],
		availableLicenses = [],
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		availableOwners = [],
		onFilterChange,
		onClearAll
	}: {
		filters: SearchFilters;
		availableLanguages?: string[];
		availableTopics?: string[];
		availableLicenses?: string[];
		availableOwners?: string[];
		onFilterChange?: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
		onClearAll?: () => void;
	} = $props();

	let expandedSections = $state<Record<string, boolean>>({
		language: true,
		topics: false,
		license: false,
		owner: false,
		stars: false,
		dates: false,
		flags: false
	});

	function toggleSection(section: string) {
		expandedSections[section] = !expandedSections[section];
	}

	function toggleArrayFilter(key: 'languages' | 'topics' | 'licenses' | 'owners', value: string) {
		const current = filters[key];
		const updated = current.includes(value)
			? current.filter((v) => v !== value)
			: [...current, value];
		onFilterChange?.(key, updated);
	}

	function toggleBooleanFilter(key: keyof SearchFilters, current: boolean | null) {
		const next = current === null ? true : current === true ? false : null;
		onFilterChange?.(key, next as never);
	}

	let hasActiveFilters = $derived(
		filters.languages.length > 0 ||
			filters.topics.length > 0 ||
			filters.licenses.length > 0 ||
			filters.owners.length > 0 ||
			filters.archived !== null ||
			filters.fork !== null ||
			filters.isTemplate !== null ||
			filters.isPrivate !== null ||
			filters.starsMin !== null ||
			filters.starsMax !== null
	);
</script>

<div class="space-y-3 p-4">
	<div class="flex items-center justify-between">
		<h2 class="text-sm font-semibold">Filters</h2>
		{#if hasActiveFilters}
			<Button variant="ghost" size="sm" onclick={onClearAll} class="h-auto px-2 py-1 text-xs">
				Clear all
			</Button>
		{/if}
	</div>

	<Separator />

	<!-- Language -->
	<div>
		<button
			class="flex w-full items-center justify-between py-1 text-sm font-medium"
			onclick={() => toggleSection('language')}
		>
			Language
			<span class="text-muted-foreground text-xs">{expandedSections.language ? '−' : '+'}</span>
		</button>
		{#if expandedSections.language}
			<div class="mt-1 max-h-40 space-y-1 overflow-y-auto">
				{#each availableLanguages as lang (lang)}
					<label
						class="hover:bg-accent flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm"
					>
						<Checkbox
							checked={filters.languages.includes(lang)}
							onCheckedChange={() => toggleArrayFilter('languages', lang)}
						/>
						{lang}
					</label>
				{/each}
			</div>
		{/if}
	</div>

	<Separator />

	<!-- Topics -->
	<div>
		<button
			class="flex w-full items-center justify-between py-1 text-sm font-medium"
			onclick={() => toggleSection('topics')}
		>
			Topics
			<span class="text-muted-foreground text-xs">{expandedSections.topics ? '−' : '+'}</span>
		</button>
		{#if expandedSections.topics}
			<div class="mt-1 max-h-40 space-y-1 overflow-y-auto">
				{#each availableTopics.slice(0, 30) as topic (topic)}
					<label
						class="hover:bg-accent flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm"
					>
						<Checkbox
							checked={filters.topics.includes(topic)}
							onCheckedChange={() => toggleArrayFilter('topics', topic)}
						/>
						{topic}
					</label>
				{/each}
			</div>
		{/if}
	</div>

	<Separator />

	<!-- License -->
	<div>
		<button
			class="flex w-full items-center justify-between py-1 text-sm font-medium"
			onclick={() => toggleSection('license')}
		>
			License
			<span class="text-muted-foreground text-xs">{expandedSections.license ? '−' : '+'}</span>
		</button>
		{#if expandedSections.license}
			<div class="mt-1 max-h-40 space-y-1 overflow-y-auto">
				{#each availableLicenses as lic (lic)}
					<label
						class="hover:bg-accent flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm"
					>
						<Checkbox
							checked={filters.licenses.includes(lic)}
							onCheckedChange={() => toggleArrayFilter('licenses', lic)}
						/>
						{lic}
					</label>
				{/each}
			</div>
		{/if}
	</div>

	<Separator />

	<!-- Flags -->
	<div>
		<button
			class="flex w-full items-center justify-between py-1 text-sm font-medium"
			onclick={() => toggleSection('flags')}
		>
			Flags
			<span class="text-muted-foreground text-xs">{expandedSections.flags ? '−' : '+'}</span>
		</button>
		{#if expandedSections.flags}
			<div class="mt-1 space-y-2">
				{#each [{ key: 'archived', label: 'Archived' }, { key: 'fork', label: 'Fork' }, { key: 'isTemplate', label: 'Template' }, { key: 'isPrivate', label: 'Private' }] as flag (flag.key)}
					<button
						class="hover:bg-accent flex w-full items-center justify-between rounded px-1 py-0.5 text-sm"
						onclick={() =>
							toggleBooleanFilter(
								flag.key as keyof SearchFilters,
								filters[flag.key as keyof SearchFilters] as boolean | null
							)}
					>
						<span>{flag.label}</span>
						<span class="text-muted-foreground text-xs">
							{#if filters[flag.key as keyof SearchFilters] === null}
								All
							{:else if filters[flag.key as keyof SearchFilters] === true}
								Yes
							{:else}
								No
							{/if}
						</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<Separator />

	<!-- Stars range -->
	<div>
		<button
			class="flex w-full items-center justify-between py-1 text-sm font-medium"
			onclick={() => toggleSection('stars')}
		>
			Stars
			<span class="text-muted-foreground text-xs">{expandedSections.stars ? '−' : '+'}</span>
		</button>
		{#if expandedSections.stars}
			<div class="mt-1 flex gap-2">
				<div class="flex-1">
					<Label class="text-xs">Min</Label>
					<Input
						type="number"
						placeholder="0"
						value={filters.starsMin ?? ''}
						oninput={(e) => {
							const v = (e.target as HTMLInputElement).value;
							onFilterChange?.('starsMin', v ? parseInt(v) : null);
						}}
						class="h-8"
					/>
				</div>
				<div class="flex-1">
					<Label class="text-xs">Max</Label>
					<Input
						type="number"
						placeholder="∞"
						value={filters.starsMax ?? ''}
						oninput={(e) => {
							const v = (e.target as HTMLInputElement).value;
							onFilterChange?.('starsMax', v ? parseInt(v) : null);
						}}
						class="h-8"
					/>
				</div>
			</div>
		{/if}
	</div>
</div>
