<script lang="ts">
	import { page } from '$app/stores';
</script>

<nav class="bg-gray-800 p-4">
	<div class="container mx-auto flex items-center justify-between">
		<div class="text-xl font-bold text-white">Stargazer</div>
		<div class="flex space-x-4">
			<a
				href="/search"
				class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:text-white"
				class:text-white={$page.url.pathname === '/search'}
			>
				Search
			</a>
			<a
				href="/settings"
				class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:text-white"
				class:text-white={$page.url.pathname === '/settings'}
			>
				Settings
			</a>
		</div>
	</div>
</nav>
