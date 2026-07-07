// Selects the SvelteKit deployment adapter and Markdown preprocessing for Cloudflare builds.
import adapterCloudflare from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { createMdsvexConfig } from './src/lib/pterodactyl/core/mdsvex/config.js';

const mdsvexConfig = createMdsvexConfig();

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', ...(mdsvexConfig.extensions || [])],
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	preprocess: [
		vitePreprocess(),
		mdsvex(mdsvexConfig),
		{
			name: 'inject-code-components',
			/** @param {{ content: string, filename?: string }} input */
			markup: ({ content, filename }) => {
				if (!filename || !/\.(md|svx)$/.test(filename)) return;
				if (!content.includes('CodeBlock') && !content.includes('CodeTabs')) return;

				const importStatement = "import { CodeBlock, CodeTabs } from 'pterodactyl-core';";
				if (content.includes('<script')) {
					return {
						code: content.replace(/<script(.*?)>/, `<script$1>\n${importStatement}`)
					};
				}

				return {
					code: `<script>\n${importStatement}\n</script>\n${content}`
				};
			}
		}
	],
	kit: {
		adapter: adapterCloudflare(),
		alias: {
			'pterodactyl-core': './src/lib/pterodactyl/core'
		},
		typescript: {
			config: (config) => ({
				...config,
				include: [...config.include, '../drizzle.config.ts']
			})
		}
	}
};

export default config;
