import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import SearchInput from './SearchInput.svelte';

describe('SearchInput', () => {
	it('renders search input with new placeholder', () => {
		const { getByPlaceholderText } = render(SearchInput, {
			props: { query: '', onSearch: vi.fn() }
		});
		expect(getByPlaceholderText(/Search repos/)).toBeTruthy();
	});

	it('renders syntax help button', () => {
		const { getByLabelText } = render(SearchInput, {
			props: { query: '', onSearch: vi.fn() }
		});
		expect(getByLabelText('Search syntax help')).toBeTruthy();
	});

	it('calls onSearch after debounce', async () => {
		vi.useFakeTimers();
		const onSearch = vi.fn();
		const { getByPlaceholderText } = render(SearchInput, {
			props: { query: '', onSearch }
		});

		const input = getByPlaceholderText(/Search repos/);
		await fireEvent.input(input, { target: { value: 'test' } });

		expect(onSearch).not.toHaveBeenCalled();
		vi.advanceTimersByTime(300);
		expect(onSearch).toHaveBeenCalledWith('test');

		vi.useRealTimers();
	});

	it('shows filter chips when hasActiveFilters is true', () => {
		const { getByText } = render(SearchInput, {
			props: {
				query: 'language:rust',
				onSearch: vi.fn(),
				parsedFilters: { languages: ['rust'] },
				hasActiveFilters: true,
				onRemoveFilter: vi.fn(),
				onClearFilters: vi.fn()
			}
		});
		expect(getByText(/language: rust/)).toBeTruthy();
	});

	it('does not show chips when hasActiveFilters is false', () => {
		const { queryByText } = render(SearchInput, {
			props: {
				query: 'hello',
				onSearch: vi.fn(),
				hasActiveFilters: false
			}
		});
		expect(queryByText('Clear all')).toBeNull();
	});
});
