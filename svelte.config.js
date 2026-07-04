// Selects the SvelteKit deployment adapter for local, Cloudflare, and Vercel builds.
import adapterCloudflare from '@sveltejs/adapter-cloudflare';
import adapterVercel from '@sveltejs/adapter-vercel';

const isVercelBuild = process.env.VERCEL === '1';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: isVercelBuild ? adapterVercel({ runtime: 'nodejs24.x' }) : adapterCloudflare(),
		typescript: {
			config: (config) => ({
				...config,
				include: [...config.include, '../drizzle.config.ts']
			})
		}
	}
};

export default config;
