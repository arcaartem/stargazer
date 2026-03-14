import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import SearchInput from './SearchInput.svelte';

describe('SearchInput', () => {
	it('renders search input', () => {
		const { getByPlaceholderText } = render(SearchInput);
		expect(getByPlaceholderText('Search repositories...')).toBeTruthy();
	});

	it('renders readme-only checkbox', () => {
		const { getByText } = render(SearchInput);
		expect(getByText('Search READMEs only')).toBeTruthy();
	});

	it('calls onSearch after debounce', async () => {
		vi.useFakeTimers();
		const onSearch = vi.fn();
		const { getByPlaceholderText } = render(SearchInput, { props: { onSearch } });

		const input = getByPlaceholderText('Search repositories...');
		await fireEvent.input(input, { target: { value: 'test' } });

		expect(onSearch).not.toHaveBeenCalled();
		vi.advanceTimersByTime(300);
		expect(onSearch).toHaveBeenCalledWith('test');

		vi.useRealTimers();
	});
});
