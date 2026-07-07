// Ptero MDsveX config factory for documentation Markdown.
import type { PluggableList } from 'unified';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { remarkCodeComponents } from './remark-code-components.js';

export interface PterodactylMdsvexOptions {
	/** Additional rehype plugins */
	rehypePlugins?: PluggableList;

	/** Additional remark plugins */
	remarkPlugins?: PluggableList;

	/** Syntax highlighting options */
	highlight?: {
		languages?: unknown[];
		themes?: unknown[];
		copyButton?: boolean;
	};

	/** Smartypants configuration */
	smartypants?: Record<string, unknown>;

	/** File extensions */
	extensions?: string[];
}

/**
 * Create mdsvex configuration for Pterodactyl
 * Synchronous - highlighter initializes lazily on first use
 */
export function createMdsvexConfig(options: PterodactylMdsvexOptions = {}) {
	return {
		extensions: options.extensions || ['.md', '.svx'],
		smartypants: options.smartypants || {
			dashes: 'oldschool'
		},
		rehypePlugins: [
			rehypeSlug,
			[
				rehypeAutolinkHeadings,
				{
					behavior: 'wrap'
				}
			],
			...(options.rehypePlugins || [])
		],
		remarkPlugins: [remarkCodeComponents(), ...(options.remarkPlugins || [])]
		// No highlight config - remarkCodeComponents handles all code blocks
	};
}
