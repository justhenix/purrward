// Ptero default Fuse.js search configuration.
import type { IFuseOptions } from 'fuse.js';
import type { SearchEntry } from './types.ts';

/**
 * Default Fuse.js configuration for documentation search
 */
export const defaultFuseConfig: IFuseOptions<SearchEntry> = {
	keys: [
		{
			name: 'title',
			weight: 3
		},
		{
			name: 'description',
			weight: 2
		},
		{
			name: 'content',
			weight: 1
		},
		{
			name: 'keywords',
			weight: 2
		}
	],
	threshold: 0.3,
	distance: 100,
	minMatchCharLength: 2,
	includeScore: true,
	includeMatches: true,
	ignoreLocation: false,
	useExtendedSearch: false
};
