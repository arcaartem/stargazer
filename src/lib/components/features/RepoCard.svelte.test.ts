import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import RepoCard from './RepoCard.svelte';
import type { Repository } from '$lib/types';

// Mock repository data for testing
const mockRepo: Repository = {
	id: 123,
	name: 'test-repo',
	description: 'A test repository for unit testing',
	html_url: 'https://github.com/testuser/test-repo',
	language: 'TypeScript',
	stargazers_count: 42,
	updated_at: '2023-01-01T00:00:00Z',
	owner: {
		login: 'testuser'
	}
};

const mockRepoWithoutDescription: Repository = {
	...mockRepo,
	description: null
};

const mockRepoWithoutLanguage: Repository = {
	...mockRepo,
	language: null
};

describe('RepoCard component', () => {
	it('should render repository name', () => {
		const { getByText } = render(RepoCard, { props: { repo: mockRepo } });
		expect(getByText('test-repo')).toBeTruthy();
	});

	it('should render star count with proper formatting', () => {
		const { getByText } = render(RepoCard, { props: { repo: mockRepo } });
		expect(getByText('⭐ 42')).toBeTruthy();
	});

	it('should render description when present', () => {
		const { getByText } = render(RepoCard, { props: { repo: mockRepo } });
		expect(getByText('A test repository for unit testing')).toBeTruthy();
	});

	it('should not render description when null', () => {
		const { queryByText } = render(RepoCard, { props: { repo: mockRepoWithoutDescription } });
		expect(queryByText('A test repository for unit testing')).toBeFalsy();
	});

	it('should render language when present', () => {
		const { getByText } = render(RepoCard, { props: { repo: mockRepo } });
		expect(getByText('TypeScript')).toBeTruthy();
	});

	it('should render "No language" when language is null', () => {
		const { getByText } = render(RepoCard, { props: { repo: mockRepoWithoutLanguage } });
		expect(getByText('No language')).toBeTruthy();
	});

	it('should render GitHub link with correct URL', () => {
		const { getByText } = render(RepoCard, { props: { repo: mockRepo } });
		const link = getByText('View on GitHub');
		expect(link.getAttribute('href')).toBe('https://github.com/testuser/test-repo');
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.getAttribute('rel')).toBe('noopener noreferrer');
	});

	it('should format large star counts with commas', () => {
		const repoWithManyStars = { ...mockRepo, stargazers_count: 1234567 };
		const { getByText } = render(RepoCard, { props: { repo: repoWithManyStars } });
		expect(getByText('⭐ 1,234,567')).toBeTruthy();
	});

	it('should truncate long repository names', () => {
		const repoWithLongName = {
			...mockRepo,
			name: 'this-is-a-very-long-repository-name-that-should-be-truncated'
		};
		const { container } = render(RepoCard, { props: { repo: repoWithLongName } });
		const nameElement = container.querySelector('.truncate');
		expect(nameElement).toBeTruthy();
	});

	it('should apply correct styling classes', () => {
		const { container } = render(RepoCard, { props: { repo: mockRepo } });
		const card = container.querySelector('.bg-white.shadow.rounded-lg');
		expect(card).toBeTruthy();
	});

	it('should handle zero star count', () => {
		const repoWithZeroStars = { ...mockRepo, stargazers_count: 0 };
		const { getByText } = render(RepoCard, { props: { repo: repoWithZeroStars } });
		expect(getByText('⭐ 0')).toBeTruthy();
	});

	it('should render star emoji', () => {
		const { getByText } = render(RepoCard, { props: { repo: mockRepo } });
		expect(getByText('⭐ 42')).toBeTruthy();
	});

	it('should apply line-clamp to description', () => {
		const { container } = render(RepoCard, { props: { repo: mockRepo } });
		const description = container.querySelector('.line-clamp-2');
		expect(description).toBeTruthy();
	});

	it('should handle special characters in repository name', () => {
		const repoWithSpecialChars = { ...mockRepo, name: 'repo-with-special_chars.and.dots' };
		const { getByText } = render(RepoCard, { props: { repo: repoWithSpecialChars } });
		expect(getByText('repo-with-special_chars.and.dots')).toBeTruthy();
	});

	it('should handle empty description gracefully', () => {
		const repoWithEmptyDescription = { ...mockRepo, description: '' };
		const { container } = render(RepoCard, { props: { repo: repoWithEmptyDescription } });
		const descriptionElement = container.querySelector('.line-clamp-2');
		expect(descriptionElement).toBeFalsy();
	});
});
