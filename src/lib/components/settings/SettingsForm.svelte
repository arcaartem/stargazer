<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';

	let {
		username = $bindable(''),
		token = $bindable(''),
		usernameError = null,
		tokenError = null,
		isDirty = false,
		isSaving = false,
		isValid = false,
		onSave,
		onUsernameChange,
		onTokenChange
	}: {
		username?: string;
		token?: string;
		usernameError?: string | null;
		tokenError?: string | null;
		isDirty?: boolean;
		isSaving?: boolean;
		isValid?: boolean;
		onSave?: () => void;
		onUsernameChange?: (value: string) => void;
		onTokenChange?: (value: string) => void;
	} = $props();
</script>

<div class="space-y-6">
	<div class="space-y-2">
		<Label for="username">GitHub Username</Label>
		<Input
			id="username"
			placeholder="octocat"
			value={username}
			oninput={(e) => onUsernameChange?.((e.target as HTMLInputElement).value)}
		/>
		{#if usernameError}
			<p class="text-destructive text-sm">{usernameError}</p>
		{/if}
	</div>

	<div class="space-y-2">
		<Label for="token">Personal Access Token</Label>
		<Input
			id="token"
			type="password"
			placeholder="ghp_..."
			value={token}
			oninput={(e) => onTokenChange?.((e.target as HTMLInputElement).value)}
		/>
		{#if tokenError}
			<p class="text-destructive text-sm">{tokenError}</p>
		{/if}
		<p class="text-muted-foreground text-xs">
			Create a token at GitHub → Settings → Developer settings → Personal access tokens. No scopes
			required for public repos.
		</p>
	</div>

	<Button onclick={onSave} disabled={!isDirty || !isValid || isSaving}>
		{isSaving ? 'Saving...' : 'Save Settings'}
	</Button>
</div>
