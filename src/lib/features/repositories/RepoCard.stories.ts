import type { Meta, StoryObj } from '@storybook/svelte';
import RepoCard from './RepoCard.svelte';

const meta = {
	title: 'Features/Repositories/RepoCard',
	component: RepoCard,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component:
					'A card component for displaying repository information with stars, language, and description.'
			}
		}
	},
	tags: ['autodocs'],
	argTypes: {
		repo: {
			description: 'Repository object containing all repository information',
			control: { type: 'object' }
		}
	}
} satisfies Meta<RepoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

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

export const Default: Story = {
	args: {
		repo: sampleRepo
	}
};

export const WithoutDescription: Story = {
	args: {
		repo: {
			...sampleRepo,
			description: null
		}
	}
};

export const WithoutLanguage: Story = {
	args: {
		repo: {
			...sampleRepo,
			language: null
		}
	}
};

export const HighStarCount: Story = {
	args: {
		repo: {
			...sampleRepo,
			name: 'popular-project',
			stargazers_count: 42567,
			description: 'A highly popular project with many stars and contributors.'
		}
	}
};

export const LongDescription: Story = {
	args: {
		repo: {
			...sampleRepo,
			name: 'detailed-project',
			description:
				'This is a project with a very long description that might wrap to multiple lines. It contains detailed information about the project features, capabilities, and intended use cases for developers who want to understand what this repository is all about.'
		}
	}
};

export const JavaScript: Story = {
	args: {
		repo: {
			...sampleRepo,
			name: 'js-project',
			language: 'JavaScript',
			description: 'A JavaScript project showcasing modern web development practices.'
		}
	}
};

export const Python: Story = {
	args: {
		repo: {
			...sampleRepo,
			name: 'python-project',
			language: 'Python',
			description: 'A Python project for data science and machine learning applications.'
		}
	}
};
