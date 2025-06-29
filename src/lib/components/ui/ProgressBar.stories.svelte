<script>
	import ProgressBar from './ProgressBar.svelte';
</script>

<div class="space-y-8 p-8">
	<div>
		<h2 class="mb-4 text-xl font-bold">Default Progress Bar</h2>
		<ProgressBar progress={{ current: 50, total: 100, visible: true }} />
	</div>

	<div>
		<h2 class="mb-4 text-xl font-bold">Compact Progress Bar</h2>
		<ProgressBar progress={{ current: 75, total: 100, visible: true }} variant="compact" />
	</div>

	<div>
		<h2 class="mb-4 text-xl font-bold">Progress Bar without Text</h2>
		<ProgressBar progress={{ current: 25, total: 100, visible: true }} showText={false} />
	</div>

	<div>
		<h2 class="mb-4 text-xl font-bold">Hidden Progress Bar</h2>
		<ProgressBar progress={{ current: 50, total: 100, visible: false }} />
	</div>
</div>
