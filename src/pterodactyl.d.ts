// Ambient type declarations for Pterodactyl virtual modules.
declare module 'pterodactyl:config' {
	import type { PterodactylConfig } from 'pterodactyl-core';
	export const config: PterodactylConfig;
	export default config;
}

declare module 'pterodactyl:content' {
	import type { ParsedDoc } from 'pterodactyl-core';
	export const docs: ParsedDoc[];
	export default docs;
}

declare module 'pterodactyl:navigation' {
	import type { SidebarConfig, PrevNext, Breadcrumb } from 'pterodactyl-core';
	export function getSidebar(version: string): SidebarConfig;
	export function getPrevNextPages(version: string, slug: string): PrevNext;
	export function getBreadcrumbs(path: string): Breadcrumb[];
}

declare module 'pterodactyl:search' {
	import type { SearchIndex } from 'pterodactyl-core';
	export function getSearchPayload(): SearchIndex;
	const searchIndex: SearchIndex;
	export default searchIndex;
}
