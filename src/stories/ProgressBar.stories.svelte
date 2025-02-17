<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ProgressBar from '../lib/components/ProgressBar.svelte';

	import { progress } from '../lib/stores';

	const resetProgress = (newProgress) => {
		progress.update(() => newProgress);
	};

	const withProgressReset = () => {
		return (args) => {
			resetProgress(args.progress);
			return { template: undefined };
		};
	};

	const { Story } = defineMeta({
		title: 'Stargazer/Components/ProgressBar',
		component: ProgressBar,
		decorators: [
			(Story, context) => {
				progress.set(context.args.progress);
				return Story;
			}
		],
		tags: ['autodocs'],
		args: {
			progress: {
				visible: true,
				current: 50,
				total: 100
			}
		}
	});
</script>

<Story name="Default" />
