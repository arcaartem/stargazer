<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	onMount(() => {
		goto(base + '/search');
	});
</script>

<div class="flex h-screen items-center justify-center">
	<div class="text-center">
		<h1 class="mb-4 text-2xl font-bold">Welcome to Stargazer</h1>
		<p>Redirecting to search page...</p>
	</div>
</div>

<svelte:head>
	<title>GitHub Stars Search</title>
</svelte:head>
