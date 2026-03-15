import { parse, type LiqeQuery } from 'liqe';
import type { SearchFilters, SortOption } from '$lib/types';

export interface ParsedQuery {
	text: string;
	filters: Partial<SearchFilters>;
	sort?: SortOption;
	readmeOnly: boolean;
}

const SORT_MAP: Record<string, SortOption> = {
	stars: 'stars-desc',
	'stars-desc': 'stars-desc',
	'stars-asc': 'stars-asc',
	name: 'name-asc',
	'name-asc': 'name-asc',
	'name-desc': 'name-desc',
	updated: 'updated-desc',
	'updated-desc': 'updated-desc',
	starred: 'starred-desc',
	'starred-desc': 'starred-desc',
	created: 'created-desc',
	'created-desc': 'created-desc',
	forks: 'forks-desc',
	'forks-desc': 'forks-desc',
	size: 'size-desc',
	'size-desc': 'size-desc',
	relevance: 'relevance'
};

const ARRAY_FIELDS: Record<string, keyof SearchFilters> = {
	language: 'languages',
	lang: 'languages',
	topic: 'topics',
	license: 'licenses',
	owner: 'owners'
};

const BOOLEAN_FIELDS: Record<string, keyof SearchFilters> = {
	archived: 'archived',
	fork: 'fork',
	template: 'isTemplate',
	private: 'isPrivate',
	issues: 'hasIssues',
	wiki: 'hasWiki',
	pages: 'hasPages',
	discussions: 'hasDiscussions'
};

const NUMERIC_FIELDS: Record<string, { min: keyof SearchFilters; max: keyof SearchFilters }> = {
	stars: { min: 'starsMin', max: 'starsMax' },
	forks: { min: 'forksMin', max: 'forksMax' },
	size: { min: 'sizeMin', max: 'sizeMax' }
};

const DATE_FIELDS: Record<string, { after: keyof SearchFilters; before: keyof SearchFilters }> = {
	created: { after: 'createdAfter', before: 'createdBefore' },
	updated: { after: 'updatedAfter', before: 'updatedBefore' },
	starred: { after: 'starredAfter', before: 'starredBefore' }
};

const ARRAY_CANONICAL: Record<string, string> = {
	languages: 'language',
	topics: 'topic',
	licenses: 'license',
	owners: 'owner'
};

const BOOLEAN_CANONICAL: Record<string, string> = {
	archived: 'archived',
	fork: 'fork',
	isTemplate: 'template',
	isPrivate: 'private',
	hasIssues: 'issues',
	hasWiki: 'wiki',
	hasPages: 'pages',
	hasDiscussions: 'discussions'
};

interface CollectedNode {
	field: string;
	operator: string;
	value: string;
	negated: boolean;
	rangeMin?: number;
	rangeMax?: number;
	isImplicit: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function getValue(node: any): string {
	const expr = node.expression;
	if (expr && expr.type === 'LiteralExpression') {
		return String(expr.value);
	}
	return '';
}

function getOperator(node: any): string {
	const op = node.operator;
	if (op && op.type === 'ComparisonOperator') {
		return op.operator;
	}
	return ':';
}

function collectNodes(node: any, negated = false): CollectedNode[] {
	if (!node || !node.type) return [];

	if (node.type === 'Tag') {
		const field = node.field;
		const isImplicit = field.type === 'ImplicitField';
		const fieldName = isImplicit ? '' : (field.name ?? '');
		const operator = getOperator(node);
		const expr = node.expression;

		if (expr && expr.type === 'RangeExpression' && expr.range) {
			return [
				{
					field: fieldName,
					operator,
					value: '',
					negated,
					rangeMin: expr.range.min,
					rangeMax: expr.range.max,
					isImplicit
				}
			];
		}

		return [
			{
				field: fieldName,
				operator,
				value: getValue(node),
				negated,
				isImplicit
			}
		];
	}

	if (node.type === 'LogicalExpression') {
		return [...collectNodes(node.left, negated), ...collectNodes(node.right, negated)];
	}

	if (node.type === 'UnaryOperator') {
		return collectNodes(node.operand, !negated);
	}

	if (node.type === 'ParenthesizedExpression') {
		return collectNodes(node.expression, negated);
	}

	return [];
}

/* eslint-enable @typescript-eslint/no-explicit-any */

function isRecognizedField(field: string): boolean {
	const lower = field.toLowerCase();
	return (
		lower in ARRAY_FIELDS ||
		lower in BOOLEAN_FIELDS ||
		lower in NUMERIC_FIELDS ||
		lower in DATE_FIELDS ||
		lower === 'sort' ||
		lower === 'in'
	);
}

export function parseSearchQuery(input: string): ParsedQuery {
	const trimmed = input.trim();
	if (!trimmed) {
		return { text: '', filters: {}, readmeOnly: false };
	}

	let ast: LiqeQuery;
	try {
		ast = parse(trimmed);
	} catch {
		return { text: trimmed, filters: {}, readmeOnly: false };
	}

	const nodes = collectNodes(ast);
	const hasUnrecognized = nodes.some((n) => !n.isImplicit && !isRecognizedField(n.field));
	if (hasUnrecognized) {
		return { text: trimmed, filters: {}, readmeOnly: false };
	}

	// Treat empty-value tags on known fields as parse errors (e.g. "stars:>")
	const hasEmptyValue = nodes.some(
		(n) => !n.isImplicit && n.rangeMin === undefined && n.value === ''
	);
	if (hasEmptyValue) {
		return { text: trimmed, filters: {}, readmeOnly: false };
	}

	const filters: Partial<SearchFilters> = {};
	const textParts: string[] = [];
	let sort: SortOption | undefined;
	let readmeOnly = false;

	for (const node of nodes) {
		if (node.isImplicit) {
			textParts.push(node.value);
			continue;
		}

		const fieldLower = node.field.toLowerCase();

		if (fieldLower === 'sort') {
			const mapped = SORT_MAP[node.value.toLowerCase()];
			if (mapped) sort = mapped;
			continue;
		}

		if (fieldLower === 'in' && node.value.toLowerCase() === 'readme') {
			readmeOnly = true;
			continue;
		}

		if (fieldLower in ARRAY_FIELDS) {
			const key = ARRAY_FIELDS[fieldLower];
			const arr = (filters[key] as string[] | undefined) ?? [];
			arr.push(node.value);
			(filters as Record<string, unknown>)[key] = arr;
			continue;
		}

		if (fieldLower in BOOLEAN_FIELDS) {
			const key = BOOLEAN_FIELDS[fieldLower];
			const boolVal = node.value.toLowerCase() === 'true';
			(filters as Record<string, unknown>)[key] = node.negated ? !boolVal : boolVal;
			continue;
		}

		if (fieldLower in NUMERIC_FIELDS) {
			const { min, max } = NUMERIC_FIELDS[fieldLower];

			if (node.rangeMin !== undefined && node.rangeMax !== undefined) {
				(filters as Record<string, unknown>)[min] = node.rangeMin;
				(filters as Record<string, unknown>)[max] = node.rangeMax;
				continue;
			}

			const num = parseInt(node.value, 10);
			if (isNaN(num)) continue;

			switch (node.operator) {
				case ':>':
					(filters as Record<string, unknown>)[min] = num + 1;
					break;
				case ':>=':
					(filters as Record<string, unknown>)[min] = num;
					break;
				case ':<':
					(filters as Record<string, unknown>)[max] = num - 1;
					break;
				case ':<=':
					(filters as Record<string, unknown>)[max] = num;
					break;
				default:
					(filters as Record<string, unknown>)[min] = num;
					(filters as Record<string, unknown>)[max] = num;
			}
			continue;
		}

		if (fieldLower in DATE_FIELDS) {
			const { after, before } = DATE_FIELDS[fieldLower];

			switch (node.operator) {
				case ':>':
				case ':>=':
					(filters as Record<string, unknown>)[after] = node.value;
					break;
				case ':<':
				case ':<=':
					(filters as Record<string, unknown>)[before] = node.value;
					break;
				default:
					(filters as Record<string, unknown>)[after] = node.value;
					(filters as Record<string, unknown>)[before] = node.value;
			}
			continue;
		}
	}

	return { text: textParts.join(' '), filters, sort, readmeOnly };
}

export function buildSearchQuery(
	text: string,
	filters: Partial<SearchFilters>,
	options?: { sort?: SortOption; readmeOnly?: boolean }
): string {
	const parts: string[] = [];

	for (const [filterKey, prefix] of Object.entries(ARRAY_CANONICAL)) {
		const values = filters[filterKey as keyof SearchFilters] as string[] | undefined;
		if (!values?.length) continue;
		for (const v of values) {
			parts.push(`${prefix}:${v.includes(' ') ? `"${v}"` : v}`);
		}
	}

	for (const [filterKey, prefix] of Object.entries(BOOLEAN_CANONICAL)) {
		const val = filters[filterKey as keyof SearchFilters] as boolean | null | undefined;
		if (val === null || val === undefined) continue;
		parts.push(val === false ? `-${prefix}:true` : `${prefix}:true`);
	}

	for (const [prefix, { min, max }] of Object.entries(NUMERIC_FIELDS)) {
		const minVal = filters[min] as number | null | undefined;
		const maxVal = filters[max] as number | null | undefined;
		if (minVal != null) parts.push(`${prefix}:>=${minVal}`);
		if (maxVal != null) parts.push(`${prefix}:<=${maxVal}`);
	}

	for (const [prefix, { after, before }] of Object.entries(DATE_FIELDS)) {
		const afterVal = filters[after] as string | null | undefined;
		const beforeVal = filters[before] as string | null | undefined;
		if (afterVal) parts.push(`${prefix}:>${afterVal}`);
		if (beforeVal) parts.push(`${prefix}:<${beforeVal}`);
	}

	if (options?.readmeOnly) parts.push('in:readme');
	if (options?.sort && options.sort !== 'relevance') parts.push(`sort:${options.sort}`);
	if (text.trim()) parts.push(text.trim());

	return parts.join(' ');
}
