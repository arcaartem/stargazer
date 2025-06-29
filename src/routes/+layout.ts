import { browser } from '$app/environment';
import { allRepos } from '$lib/stores';
import { StarsDbService } from '$lib/db';

export const prerender = true;

export async function load({ url }) {
	if (browser) {
		const starsDb = new StarsDbService();
		const cached = await starsDb.getCachedStars();
		if (cached) {
			allRepos.set(cached);
		}
	}
	return { pathname: url.pathname };
}
