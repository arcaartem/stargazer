<script lang="ts">
	import { base } from '$app/paths';
</script>

<nav class="bg-gray-800 text-white">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<h1 class="text-xl font-bold">Stargazer</h1>
				</div>
			</div>
			<div class="flex space-x-4">
				<a href="{base}/search" class="rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-700">
					Search
				</a>
				<a
					href="{base}/settings"
					class="rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-700"
				>
					Settings
				</a>
			</div>
		</div>
	</div>
</nav>
