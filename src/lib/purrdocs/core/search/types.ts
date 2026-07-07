// Purrdocs search payload and result types.
import type { FuseResultMatch } from 'fuse.js';

/**
 * Search entry for indexing
 */
export interface SearchEntry {
	id: string;
	title: string;
	description?: string;
	content: string;
	section?: string;
	subsection?: string;
	version: string;
	href: string;
	keywords?: string[];
}

/**
 * Search index payload
 */
export interface SearchIndex {
	entries: SearchEntry[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	fuseIndex?: any;
}

/**
 * Search result with highlighting
 */
export interface SearchResult extends SearchEntry {
	matches?: readonly FuseResultMatch[];
	score?: number;
}
