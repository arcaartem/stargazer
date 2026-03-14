import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatNumber, formatDate, formatRelativeDate, formatBytes } from './formatting';

describe('formatNumber', () => {
	it('formats numbers below 1000', () => {
		expect(formatNumber(0)).toBe('0');
		expect(formatNumber(42)).toBe('42');
		expect(formatNumber(999)).toBe('999');
	});

	it('formats thousands', () => {
		expect(formatNumber(1000)).toBe('1.0k');
		expect(formatNumber(1500)).toBe('1.5k');
		expect(formatNumber(42300)).toBe('42.3k');
		expect(formatNumber(999999)).toBe('1000.0k');
	});

	it('formats millions', () => {
		expect(formatNumber(1000000)).toBe('1.0M');
		expect(formatNumber(2500000)).toBe('2.5M');
	});
});

describe('formatDate', () => {
	it('formats ISO date strings', () => {
		const result = formatDate('2024-03-14T12:00:00Z');
		expect(result).toContain('Mar');
		expect(result).toContain('14');
		expect(result).toContain('2024');
	});
});

describe('formatRelativeDate', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns "just now" for recent timestamps', () => {
		const now = new Date('2024-03-14T12:00:00Z').getTime();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(formatRelativeDate('2024-03-14T11:59:30Z')).toBe('just now');
	});

	it('returns minutes ago', () => {
		const now = new Date('2024-03-14T12:00:00Z').getTime();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(formatRelativeDate('2024-03-14T11:55:00Z')).toBe('5m ago');
	});

	it('returns hours ago', () => {
		const now = new Date('2024-03-14T12:00:00Z').getTime();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(formatRelativeDate('2024-03-14T09:00:00Z')).toBe('3h ago');
	});

	it('returns days ago', () => {
		const now = new Date('2024-03-14T12:00:00Z').getTime();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(formatRelativeDate('2024-03-07T12:00:00Z')).toBe('7d ago');
	});

	it('returns months ago', () => {
		const now = new Date('2024-03-14T12:00:00Z').getTime();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(formatRelativeDate('2023-12-14T12:00:00Z')).toBe('3mo ago');
	});

	it('returns years ago', () => {
		const now = new Date('2024-03-14T12:00:00Z').getTime();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(formatRelativeDate('2021-03-14T12:00:00Z')).toBe('3y ago');
	});
});

describe('formatBytes', () => {
	it('formats KB', () => {
		expect(formatBytes(500)).toBe('500 KB');
	});

	it('formats MB', () => {
		expect(formatBytes(1500)).toBe('1.5 MB');
		expect(formatBytes(42000)).toBe('42.0 MB');
	});

	it('formats GB', () => {
		expect(formatBytes(1500000)).toBe('1.5 GB');
	});
});
