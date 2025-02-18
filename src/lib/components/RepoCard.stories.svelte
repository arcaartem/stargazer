<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import RepoCard from './RepoCard.svelte';

	const { Story } = defineMeta({
		title: 'Stargazer/Components/RepoCard',
		component: RepoCard,
		tags: ['autodocs'],
		argTypes: {
			repo: { control: 'object' }
		}
	});
</script>

<Story
	name="Default"
	args={{
		repo: {
			id: 123,
			name: 'Repo Name',
			description: 'Repo Description',
			html_url: 'https://github.com',
			language: 'JavaScript',
			stargazers_count: 100,
			updated_at: '2025-05-01T00:00:00Z',
			owner: {
				login: 'owner'
			}
		}
	}}
/>
