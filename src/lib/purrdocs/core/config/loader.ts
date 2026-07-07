// Purrdocs docs file: generated documentation engine code.
import { PurrdocsConfigSchema, type ValidatedConfig } from './schema.ts';
import type { PurrdocsConfig } from './types.ts';
import { defaultConfig } from './types.ts';

/**
 * Merge user config with defaults and validate
 */
export function mergeConfig(userConfig: Partial<PurrdocsConfig>): PurrdocsConfig {
	// Merge with defaults
	const merged: PurrdocsConfig = {
		...defaultConfig,
		...userConfig,
		site: {
			...defaultConfig.site,
			...userConfig.site
		},
		versions: {
			...defaultConfig.versions,
			...userConfig.versions
		},
		search: {
			...defaultConfig.search,
			...userConfig.search
		}
	} as PurrdocsConfig;

	// Validate configuration
	try {
		PurrdocsConfigSchema.parse(merged);
	} catch (error) {
		console.error('Invalid Purrdocs configuration:', error);
		throw error;
	}

	return merged;
}

/**
 * Validate configuration without loading from file
 */
export function validateConfig(config: unknown): ValidatedConfig {
	return PurrdocsConfigSchema.parse(config);
}
