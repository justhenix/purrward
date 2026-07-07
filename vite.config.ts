import { defineConfig } from 'vitest/config';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import config from './pterodactyl.config';
import { pterodactyl } from './src/lib/pterodactyl/core/vite/plugin';

export default defineConfig({
	plugins: [tailwindcss(), pterodactyl({ config, contentDir: 'src/content/docs' }), sveltekit()],
	resolve: {
		alias: {
			'pterodactyl-core': path.resolve('./src/lib/pterodactyl/core')
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
