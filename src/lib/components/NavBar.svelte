<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';
</script>

<nav class="bg-gray-800 p-4">
	<div class="container mx-auto flex items-center justify-between">
		<div class="text-xl font-bold text-white">Stargazer</div>
		<div class="flex space-x-4">
			<a
				href="{base}/search"
				class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:text-white"
				class:text-white={$page.url.pathname === base + '/search'}
			>
				Search
			</a>
			<a
				href="{base}/settings"
				class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:text-white"
				class:text-white={$page.url.pathname === base + '/settings'}
			>
				Settings
			</a>
		</div>
	</div>
</nav>
