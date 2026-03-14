<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';

	let {
		query = $bindable(''),
		readmeOnly = $bindable(false),
		onSearch
	}: {
		query?: string;
		readmeOnly?: boolean;
		onSearch?: (query: string) => void;
	} = $props();

	let debounceTimer: ReturnType<typeof setTimeout>;

	function handleInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		query = value;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			onSearch?.(value);
		}, 300);
	}

	function handleToggle(checked: boolean | 'indeterminate') {
		readmeOnly = checked === true;
		onSearch?.(query);
	}
</script>

<div class="flex flex-col gap-3">
	<Input
		type="search"
		placeholder="Search repositories..."
		value={query}
		oninput={handleInput}
		class="w-full"
	/>
	<div class="flex items-center gap-2">
		<Checkbox id="readme-only" checked={readmeOnly} onCheckedChange={handleToggle} />
		<Label for="readme-only" class="text-muted-foreground text-sm">Search READMEs only</Label>
	</div>
</div>
