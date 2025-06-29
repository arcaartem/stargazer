<script lang="ts">
	import '../app.css';
	import NavBar from '$lib/components/NavBar.svelte';

	export let data: { pathname: string };
</script>

<NavBar pathname={data.pathname} />

<main class="container mx-auto p-4">
	<slot />
</main>
