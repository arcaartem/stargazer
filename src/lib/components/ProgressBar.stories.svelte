<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ProgressBar from './ProgressBar.svelte';

	const { Story } = defineMeta({
		title: 'Stargazer/Components/ProgressBar',
		component: ProgressBar,
		tags: ['autodocs'],
		args: {
			progress: {
				visible: true,
				current: 50,
				total: 100
			}
		},
		argTypes: {
			progress: {
				control: {
					type: 'object'
				}
			}
		}
	});
</script>

<Story name="Default" />
