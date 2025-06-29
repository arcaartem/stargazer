<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let username: string = '';
	export let token: string = '';
	export let loading: boolean = false;
	export let isDirty: boolean = false;

	const dispatch = createEventDispatcher<{
		save: void;
		change: { username: string; token: string };
	}>();

	function handleSubmit() {
		dispatch('save');
	}

	function handleChange() {
		dispatch('change', { username, token });
	}
</script>

<div class="mx-auto max-w-2xl">
	<h1 class="mb-8 text-3xl font-bold">Settings</h1>

	{#if loading}
		<div class="text-center">Loading...</div>
	{:else}
		<form on:submit|preventDefault={handleSubmit} class="space-y-6">
			<div>
				<label for="username" class="block text-sm font-medium text-gray-700">
					GitHub Username
				</label>
				<input
					type="text"
					id="username"
					bind:value={username}
					on:input={handleChange}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					placeholder="Enter your GitHub username"
				/>
			</div>

			<div>
				<label for="token" class="block text-sm font-medium text-gray-700">
					GitHub Personal Access Token
				</label>
				<input
					type="password"
					id="token"
					bind:value={token}
					on:input={handleChange}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					placeholder="Enter your GitHub token"
				/>
				<p class="mt-2 text-sm text-gray-500">
					Your GitHub personal access token is stored securely in your browser's IndexedDB.
					<a
						href="https://github.com/settings/tokens"
						target="_blank"
						rel="noopener noreferrer"
						class="text-indigo-600 hover:text-indigo-500"
					>
						Create a token here
					</a>
				</p>
			</div>

			<button
				type="submit"
				disabled={loading || !isDirty}
				class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
			>
				{loading ? 'Saving...' : 'Save Settings'}
			</button>

			{#if isDirty}
				<p class="text-sm text-amber-600">You have unsaved changes.</p>
			{/if}
		</form>
	{/if}
</div>
