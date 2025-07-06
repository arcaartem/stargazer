import type { Meta, StoryObj } from '@storybook/svelte';
import ProgressBar from './ProgressBar.svelte';

const meta = {
	title: 'UI/ProgressBar',
	component: ProgressBar,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component:
					'A progress bar component for displaying task progress with customizable variants and text display options.'
			}
		}
	},
	tags: ['autodocs'],
	argTypes: {
		progress: {
			description: 'Progress state object with current, total, and visibility',
			control: { type: 'object' }
		},
		variant: {
			description: 'Progress bar variant',
			control: { type: 'select' },
			options: ['default', 'compact']
		},
		showText: {
			description: 'Whether to show progress text',
			control: { type: 'boolean' }
		}
	}
} satisfies Meta<ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		progress: { current: 50, total: 100, visible: true },
		variant: 'default',
		showText: true
	}
};

export const Compact: Story = {
	args: {
		progress: { current: 75, total: 100, visible: true },
		variant: 'compact',
		showText: true
	}
};

export const WithoutText: Story = {
	args: {
		progress: { current: 25, total: 100, visible: true },
		variant: 'default',
		showText: false
	}
};

export const Hidden: Story = {
	args: {
		progress: { current: 50, total: 100, visible: false },
		variant: 'default',
		showText: true
	}
};

export const Complete: Story = {
	args: {
		progress: { current: 100, total: 100, visible: true },
		variant: 'default',
		showText: true
	}
};

export const StartingProgress: Story = {
	args: {
		progress: { current: 5, total: 100, visible: true },
		variant: 'default',
		showText: true
	}
};

export const LargeNumbers: Story = {
	args: {
		progress: { current: 1250, total: 2500, visible: true },
		variant: 'default',
		showText: true
	}
};

export const CompactWithoutText: Story = {
	args: {
		progress: { current: 80, total: 100, visible: true },
		variant: 'compact',
		showText: false
	}
};
