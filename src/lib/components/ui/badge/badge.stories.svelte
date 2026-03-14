<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Badge from './badge.svelte';

	const { Story } = defineMeta({
		title: 'UI/Badge',
		component: Badge,
		tags: ['autodocs'],
		argTypes: {
			variant: {
				control: 'select',
				options: ['default', 'secondary', 'destructive', 'outline']
			}
		}
	});
</script>

<Story name="Default">
	<Badge>Badge</Badge>
</Story>

<Story name="Secondary">
	<Badge variant="secondary">Badge</Badge>
</Story>

<Story name="Destructive">
	<Badge variant="destructive">Badge</Badge>
</Story>

<Story name="Outline">
	<Badge variant="outline">Badge</Badge>
</Story>

<Story name="AsLink">
	<Badge href="https://example.com">Badge</Badge>
</Story>
