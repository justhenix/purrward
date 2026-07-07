// Purrdocs docs config for Purrward developer documentation.
import type { PurrdocsConfig } from './src/lib/purrdocs/core';

const config: PurrdocsConfig = {
	site: {
		title: 'Purrward Dev Docs',
		description: 'Setup, architecture, security notes, and local development for Purrward.',
		baseUrl: '/docs'
	},
	versions: {
		current: 'latest',
		available: [{ id: 'latest', label: 'Latest', status: 'latest', releaseDate: '2026-07-07' }],
		aliases: {
			latest: 'latest'
		}
	},
	sidebar: {
		sectionOrder: [
			'Overview',
			'Setup',
			'Map',
			'Architecture',
			'Flows',
			'Security',
			'Demo',
			'Maintenance'
		],
		subsectionOrder: {
			overview: ['index'],
			setup: ['prerequisites', 'run-locally', 'configuration', 'environment-variables'],
			map: ['important-files', 'asset-locations'],
			architecture: ['architecture'],
			flows: [
				'care-verification-flow',
				'reward-flow',
				'gacha-flow',
				'customization-flow',
				'ai-vet-flow'
			],
			security: ['security-notes'],
			demo: ['demo-only-behavior'],
			maintenance: ['common-edits', 'troubleshooting']
		}
	},
	search: {
		enabled: true,
		placeholder: 'Search dev docs...',
		hotkeys: ['ctrl+k', 'cmd+k']
	}
};

export default config;
