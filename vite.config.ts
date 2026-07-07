import { defineConfig } from 'vitest/config';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import config from './purrdocs.config';
import { purrdocs } from './src/lib/purrdocs/core/vite/plugin';

export default defineConfig({
	plugins: [tailwindcss(), purrdocs({ config, contentDir: 'src/content/docs' }), sveltekit()],
	resolve: {
		alias: {
			'purrdocs-core': path.resolve('./src/lib/purrdocs/core')
		}
	},
	server: {
		allowedHosts: ['.trycloudflare.com']
	},
	ssr: {
		noExternal: ['@lucide/svelte']
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
