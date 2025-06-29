<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { useSettings } from '$lib/composables';
	import { SettingsForm } from '$lib/components';

	// Initialize composables
	const settings = useSettings();

	// Reactive state
	$: settingsState = $settings;

	let errorMessage = '';

	onMount(async () => {
		if (browser) {
			await settings.load();
		}
	});

	async function handleSave() {
		try {
			errorMessage = '';
			await settings.save();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
		}
	}

	function handleChange(event: CustomEvent<{ username: string; token: string }>) {
		const { username, token } = event.detail;
		settings.setUsername(username);
		settings.setToken(token);
	}

	function clearError() {
		errorMessage = '';
		settings.clearError();
	}
</script>

{#if errorMessage || settingsState.error}
	<div class="mb-6 rounded-md bg-red-50 p-4">
		<div class="flex">
			<div class="ml-3">
				<h3 class="text-sm font-medium text-red-800">Error</h3>
				<div class="mt-2 text-sm text-red-700">
					{errorMessage || settingsState.error}
				</div>
				<button
					on:click={clearError}
					class="mt-2 text-sm font-medium text-red-800 hover:text-red-600"
				>
					Dismiss
				</button>
			</div>
		</div>
	</div>
{/if}

{#if settingsState.loading === false && !settingsState.error && !errorMessage}
	<div class="mb-6 rounded-md bg-green-50 p-4">
		<div class="text-sm text-green-700">Settings saved successfully!</div>
	</div>
{/if}

<SettingsForm
	username={settingsState.username}
	token={settingsState.token}
	loading={settingsState.loading}
	isDirty={settingsState.isDirty}
	on:save={handleSave}
	on:change={handleChange}
/>
