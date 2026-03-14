<script>
	import '../app.css';
	import NavBar from '$lib/components/layout/NavBar.svelte';
	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<NavBar />
	<main class="flex-1">
		{@render children()}
	</main>
</div>
