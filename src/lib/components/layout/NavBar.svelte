<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { Button } from '$lib/components/ui/button';

	const navItems = [
		{ href: `${base}/search`, label: 'Search' },
		{ href: `${base}/settings`, label: 'Settings' }
	];
</script>

<nav class="bg-background border-b">
	<div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
		<a href="{base}/search" class="text-lg font-semibold tracking-tight">Stargazer</a>
		<div class="flex gap-1">
			{#each navItems as item}
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
