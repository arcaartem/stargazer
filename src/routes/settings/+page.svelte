<script lang="ts">
	import { onMount } from 'svelte';
	import SettingsForm from '$lib/components/settings/SettingsForm.svelte';
	import SyncButton from '$lib/components/settings/SyncButton.svelte';
	import SyncProgress from '$lib/components/settings/SyncProgress.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { settingsStore } from '$lib/stores/settings-store.svelte';
	import { syncStore } from '$lib/stores/sync-store.svelte';
	import { formatDate } from '$lib/utils/formatting';

	let showClearConfirm = $state(false);

	onMount(async () => {
		await settingsStore.load();
		await syncStore.loadSyncStatus();
	});

	async function handleSave() {
		await settingsStore.save();
	}

	async function handleSync() {
		await settingsStore.save();
		syncStore.startSync();
	}

	async function handleClearData() {
		await settingsStore.clearData();
		showClearConfirm = false;
		syncStore.repoCount = 0;
		syncStore.readmeCount = 0;
		syncStore.lastSyncedAt = null;
	}
</script>

<div class="mx-auto max-w-2xl space-y-8 p-3 sm:p-6">
	<div>
		<h1 class="text-2xl font-bold">Settings</h1>
		<p class="text-muted-foreground mt-1 text-sm">
			Configure your GitHub credentials and sync your starred repositories.
		</p>
	</div>

	<!-- Credentials -->
	<section class="space-y-4">
		<h2 class="text-lg font-semibold">GitHub Credentials</h2>
		<SettingsForm
			bind:username={settingsStore.username}
			bind:token={settingsStore.token}
			usernameError={settingsStore.usernameError}
			tokenError={settingsStore.tokenError}
			isDirty={settingsStore.isDirty}
			isSaving={settingsStore.isSaving}
			isValid={settingsStore.isValid}
			onSave={handleSave}
			onUsernameChange={(v) => settingsStore.setUsername(v)}
			onTokenChange={(v) => settingsStore.setToken(v)}
		/>
	</section>

	<Separator />

	<!-- Sync -->
	<section class="space-y-4">
		<h2 class="text-lg font-semibold">Sync</h2>

		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
			<SyncButton
				isSyncing={syncStore.isSyncing}
				disabled={!settingsStore.isValid}
				onSync={handleSync}
			/>

			{#if syncStore.isSyncing}
				<Button variant="outline" size="sm" onclick={() => syncStore.cancel()}>Cancel</Button>
			{/if}

			{#if syncStore.error}
				<p class="text-destructive text-sm">{syncStore.error}</p>
			{/if}
		</div>

		<SyncProgress progress={syncStore.progress} />

		<!-- Stats -->
		{#if syncStore.lastSyncedAt || syncStore.repoCount > 0}
			<div class="rounded-lg border p-4">
				<div class="grid grid-cols-1 gap-4 text-center sm:grid-cols-2 md:grid-cols-3">
					<div>
						<div class="text-2xl font-bold">{syncStore.repoCount}</div>
						<div class="text-muted-foreground text-sm">Repositories</div>
					</div>
					<div>
						<div class="text-2xl font-bold">{syncStore.readmeCount}</div>
						<div class="text-muted-foreground text-sm">READMEs</div>
					</div>
					<div>
						<div class="text-sm font-medium">
							{#if syncStore.lastSyncedAt}
								{formatDate(syncStore.lastSyncedAt)}
							{:else}
								Never
							{/if}
						</div>
						<div class="text-muted-foreground text-sm">Last synced</div>
					</div>
				</div>
			</div>
		{/if}
	</section>

	<Separator />

	<!-- Clear data -->
	<section class="space-y-4">
		<h2 class="text-lg font-semibold">Data</h2>
		{#if showClearConfirm}
			<div class="border-destructive rounded-lg border p-4">
				<p class="text-sm">Are you sure? This will delete all synced data and settings.</p>
				<div class="mt-3 flex gap-2">
					<Button variant="destructive" size="sm" onclick={handleClearData}>
						Yes, clear all data
					</Button>
					<Button variant="outline" size="sm" onclick={() => (showClearConfirm = false)}>
						Cancel
					</Button>
				</div>
			</div>
		{:else}
			<Button variant="outline" onclick={() => (showClearConfirm = true)}>Clear All Data</Button>
		{/if}
	</section>
</div>
