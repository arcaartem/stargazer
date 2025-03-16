<script lang="ts">
	import { onMount } from 'svelte';
	import { SettingsDbService } from '$lib/db';

	let settingsDb: SettingsDbService;
	let username = '';
	let token = '';
	let loading = true;

	onMount(async () => {
		settingsDb = new SettingsDbService();
		username = (await settingsDb.getUsername()) || '';
		token = (await settingsDb.getToken()) || '';
		loading = false;
	});

	async function saveSettings() {
		loading = true;
		await settingsDb.saveUsername(username);
		await settingsDb.saveToken(token);
		loading = false;
	}
</script>

<div class="mx-auto max-w-2xl">
	<h1 class="mb-8 text-3xl font-bold">Settings</h1>

	{#if loading}
		<div class="text-center">Loading...</div>
	{:else}
		<form on:submit|preventDefault={saveSettings} class="space-y-6">
			<div>
				<label for="username" class="block text-sm font-medium text-gray-700">
					GitHub Username
				</label>
				<input
					type="text"
					id="username"
					bind:value={username}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
				/>
			</div>

			<div>
				<label for="token" class="block text-sm font-medium text-gray-700"> GitHub Token </label>
				<input
					type="password"
					id="token"
					bind:value={token}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
				/>
				<p class="mt-2 text-sm text-gray-500">
					Your GitHub personal access token is stored securely in your browser's IndexedDB.
				</p>
			</div>

			<button
				type="submit"
				class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
			>
				Save Settings
			</button>
		</form>
	{/if}
</div>
