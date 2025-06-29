<script>
	import RepoCard from './RepoCard.svelte';

	const sampleRepo = {
		id: 1,
		name: 'awesome-project',
		description: 'This is an awesome project that does amazing things for developers.',
		html_url: 'https://github.com/user/awesome-project',
		language: 'TypeScript',
		stargazers_count: 1234,
		updated_at: '2023-01-01T00:00:00Z',
		owner: {
			login: 'user'
		}
	};

	const repoWithoutDescription = {
		...sampleRepo,
		description: null
	};

	const repoWithoutLanguage = {
		...sampleRepo,
		language: null
	};
</script>

<div class="space-y-6 bg-gray-100 p-6">
	<div>
		<h2 class="mb-4 text-xl font-bold">Standard Repository Card</h2>
		<div class="max-w-sm">
			<RepoCard repo={sampleRepo} />
		</div>
	</div>

	<div>
		<h2 class="mb-4 text-xl font-bold">Repository without Description</h2>
		<div class="max-w-sm">
			<RepoCard repo={repoWithoutDescription} />
		</div>
	</div>

	<div>
		<h2 class="mb-4 text-xl font-bold">Repository without Language</h2>
		<div class="max-w-sm">
			<RepoCard repo={repoWithoutLanguage} />
		</div>
	</div>
</div>
