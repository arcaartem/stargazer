import { describe, it, expect } from 'vitest';
import { parseSearchQuery, buildSearchQuery } from './query-parser';

describe('parseSearchQuery', () => {
	it('returns free text with no filters for plain query', () => {
		const result = parseSearchQuery('web framework');
		expect(result.text).toBe('web framework');
		expect(result.filters).toEqual({});
		expect(result.readmeOnly).toBe(false);
	});

	it('extracts language filter', () => {
		const result = parseSearchQuery('language:rust');
		expect(result.text).toBe('');
		expect(result.filters.languages).toEqual(['rust']);
	});

	it('extracts multiple language filters', () => {
		const result = parseSearchQuery('language:rust language:go');
		expect(result.filters.languages).toEqual(['rust', 'go']);
	});

	it('extracts topic filter', () => {
		const result = parseSearchQuery('topic:cli');
		expect(result.filters.topics).toEqual(['cli']);
	});

	it('extracts license filter', () => {
		const result = parseSearchQuery('license:MIT');
		expect(result.filters.licenses).toEqual(['MIT']);
	});

	it('extracts owner filter', () => {
		const result = parseSearchQuery('owner:gajus');
		expect(result.filters.owners).toEqual(['gajus']);
	});

	it('extracts archived boolean filter', () => {
		const result = parseSearchQuery('archived:true');
		expect(result.filters.archived).toBe(true);
	});

	it('extracts fork boolean filter as false', () => {
		const result = parseSearchQuery('fork:false');
		expect(result.filters.fork).toBe(false);
	});

	it('extracts template boolean filter', () => {
		const result = parseSearchQuery('template:true');
		expect(result.filters.isTemplate).toBe(true);
	});

	it('extracts private boolean filter', () => {
		const result = parseSearchQuery('private:true');
		expect(result.filters.isPrivate).toBe(true);
	});

	it('extracts in:readme as readmeOnly', () => {
		const result = parseSearchQuery('in:readme search terms');
		expect(result.readmeOnly).toBe(true);
		expect(result.text).toBe('search terms');
	});

	it('extracts sort option', () => {
		const result = parseSearchQuery('sort:stars');
		expect(result.sort).toBe('stars-desc');
		expect(result.text).toBe('');
	});

	it('extracts sort:name-asc', () => {
		const result = parseSearchQuery('sort:name-asc');
		expect(result.sort).toBe('name-asc');
	});

	it('separates filters from free text', () => {
		const result = parseSearchQuery('language:rust web framework');
		expect(result.text).toBe('web framework');
		expect(result.filters.languages).toEqual(['rust']);
	});

	it('handles quoted filter values', () => {
		const result = parseSearchQuery('topic:"machine learning"');
		expect(result.filters.topics).toEqual(['machine learning']);
	});

	it('extracts stars:>100 as starsMin', () => {
		const result = parseSearchQuery('stars:>100');
		expect(result.filters.starsMin).toBe(101);
	});

	it('extracts stars:>=100 as starsMin', () => {
		const result = parseSearchQuery('stars:>=100');
		expect(result.filters.starsMin).toBe(100);
	});

	it('extracts stars:<50 as starsMax', () => {
		const result = parseSearchQuery('stars:<50');
		expect(result.filters.starsMax).toBe(49);
	});

	it('extracts stars:<=50 as starsMax', () => {
		const result = parseSearchQuery('stars:<=50');
		expect(result.filters.starsMax).toBe(50);
	});

	it('extracts stars range [100 TO 500]', () => {
		const result = parseSearchQuery('stars:[100 TO 500]');
		expect(result.filters.starsMin).toBe(100);
		expect(result.filters.starsMax).toBe(500);
	});

	it('extracts forks:>10 as forksMin', () => {
		const result = parseSearchQuery('forks:>10');
		expect(result.filters.forksMin).toBe(11);
	});

	it('extracts size:>1000 as sizeMin', () => {
		const result = parseSearchQuery('size:>1000');
		expect(result.filters.sizeMin).toBe(1001);
	});

	it('extracts updated:>2024-01-01 as updatedAfter', () => {
		const result = parseSearchQuery('updated:>2024-01-01');
		expect(result.filters.updatedAfter).toBe('2024-01-01');
	});

	it('extracts created:<2023-06-01 as createdBefore', () => {
		const result = parseSearchQuery('created:<2023-06-01');
		expect(result.filters.createdBefore).toBe('2023-06-01');
	});

	it('extracts starred:>2024-01-01 as starredAfter', () => {
		const result = parseSearchQuery('starred:>2024-01-01');
		expect(result.filters.starredAfter).toBe('2024-01-01');
	});

	it('handles negation with NOT', () => {
		const result = parseSearchQuery('NOT archived:true');
		expect(result.filters.archived).toBe(false);
	});

	it('handles negation with dash prefix', () => {
		const result = parseSearchQuery('-fork:true');
		expect(result.filters.fork).toBe(false);
	});

	it('treats unrecognized field as free text', () => {
		const result = parseSearchQuery('foo:bar hello');
		expect(result.text).toBe('foo:bar hello');
		expect(result.filters).toEqual({});
	});

	it('falls back to plain text on parse error', () => {
		const result = parseSearchQuery('stars:>');
		expect(result.text).toBe('stars:>');
		expect(result.filters).toEqual({});
	});

	it('handles empty input', () => {
		const result = parseSearchQuery('');
		expect(result.text).toBe('');
		expect(result.filters).toEqual({});
	});

	it('handles complex mixed query', () => {
		const result = parseSearchQuery(
			'language:rust stars:>100 topic:cli -archived:true web framework sort:stars'
		);
		expect(result.text).toBe('web framework');
		expect(result.filters.languages).toEqual(['rust']);
		expect(result.filters.starsMin).toBe(101);
		expect(result.filters.topics).toEqual(['cli']);
		expect(result.filters.archived).toBe(false);
		expect(result.sort).toBe('stars-desc');
	});
});

describe('buildSearchQuery', () => {
	it('returns only text when no filters', () => {
		expect(buildSearchQuery('hello', {})).toBe('hello');
	});

	it('builds language filter', () => {
		expect(buildSearchQuery('', { languages: ['rust'] })).toBe('language:rust');
	});

	it('builds multiple languages', () => {
		const result = buildSearchQuery('', { languages: ['rust', 'go'] });
		expect(result).toBe('language:rust language:go');
	});

	it('builds stars range', () => {
		const result = buildSearchQuery('', { starsMin: 100, starsMax: 500 });
		expect(result).toBe('stars:>=100 stars:<=500');
	});

	it('combines text and filters', () => {
		const result = buildSearchQuery('web framework', { languages: ['rust'] });
		expect(result).toBe('language:rust web framework');
	});

	it('builds boolean filter', () => {
		expect(buildSearchQuery('', { archived: true })).toBe('archived:true');
	});

	it('builds negated boolean filter', () => {
		expect(buildSearchQuery('', { archived: false })).toBe('-archived:true');
	});

	it('builds date filter', () => {
		expect(buildSearchQuery('', { updatedAfter: '2024-01-01' })).toBe('updated:>2024-01-01');
	});

	it('quotes values with spaces', () => {
		expect(buildSearchQuery('', { topics: ['machine learning'] })).toBe('topic:"machine learning"');
	});
});
