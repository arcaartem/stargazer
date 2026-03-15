<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import SyncIndicator from './SyncIndicator.svelte';

	const searchHref = resolve('/search');
	const settingsHref = resolve('/settings');

	const navItems = [
		{ href: searchHref, label: 'Search' },
		{ href: settingsHref, label: 'Settings' }
	];
</script>

<nav class="bg-background border-b">
	<div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
		<a href={searchHref} class="text-lg font-semibold tracking-tight">Stargazer</a>
		<SyncIndicator />
		<div class="flex gap-1">
			{#each navItems as item (item.href)}
				<Button
					variant={$page.url.pathname === item.href ? 'secondary' : 'ghost'}
					href={item.href}
					size="sm"
				>
					{item.label}
				</Button>
			{/each}
		</div>
	</div>
</nav>
