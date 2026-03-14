export function formatNumber(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
	return n.toString();
}

export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

export function formatRelativeDate(iso: string): string {
	const now = Date.now();
	const then = new Date(iso).getTime();
	const diffMs = now - then;
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHrs = Math.floor(diffMin / 60);
	const diffDays = Math.floor(diffHrs / 24);
	const diffMonths = Math.floor(diffDays / 30);
	const diffYears = Math.floor(diffDays / 365);

	if (diffSec < 60) return 'just now';
	if (diffMin < 60) return `${diffMin}m ago`;
	if (diffHrs < 24) return `${diffHrs}h ago`;
	if (diffDays < 30) return `${diffDays}d ago`;
	if (diffMonths < 12) return `${diffMonths}mo ago`;
	return `${diffYears}y ago`;
}

export function formatBytes(kb: number): string {
	if (kb >= 1_000_000) return `${(kb / 1_000_000).toFixed(1)} GB`;
	if (kb >= 1_000) return `${(kb / 1_000).toFixed(1)} MB`;
	return `${kb} KB`;
}
