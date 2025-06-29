import { browser } from '$app/environment';
import type { LayoutLoad } from './$types';
import { allRepos } from '$lib/stores';
import { StarsDbService } from '$lib/db';

export const prerender = true;

export const load: LayoutLoad = async ({ url }) => {
	if (browser) {
		const starsDb = new StarsDbService();
		const cached = await starsDb.getCachedStars();
		if (cached) {
			allRepos.set(cached);
		}
	}
	return { pathname: url.pathname };
};
