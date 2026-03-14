<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	let {
		isSyncing = false,
		disabled = false,
		onSync
	}: {
		isSyncing?: boolean;
		disabled?: boolean;
		onSync?: () => void;
	} = $props();
</script>

<Button
	onclick={onSync}
	disabled={disabled || isSyncing}
	variant={isSyncing ? 'secondary' : 'default'}
	class="w-full sm:w-auto"
>
	{#if isSyncing}
		Syncing...
	{:else}
		Sync Now
	{/if}
</Button>
