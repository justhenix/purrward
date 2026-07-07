// Ambient type declarations for Purrdocs virtual modules.
declare module 'purrdocs:config' {
	import type { PurrdocsConfig } from 'purrdocs-core';
	export const config: PurrdocsConfig;
	export default config;
}

declare module 'purrdocs:content' {
	import type { ParsedDoc } from 'purrdocs-core';
	export const docs: ParsedDoc[];
	export default docs;
}

declare module 'purrdocs:navigation' {
	import type { SidebarConfig, PrevNext, Breadcrumb } from 'purrdocs-core';
	export function getSidebar(version: string): SidebarConfig;
	export function getPrevNextPages(version: string, slug: string): PrevNext;
	export function getBreadcrumbs(path: string): Breadcrumb[];
}

declare module 'purrdocs:search' {
	import type { SearchIndex } from 'purrdocs-core';
	export function getSearchPayload(): SearchIndex;
	const searchIndex: SearchIndex;
	export default searchIndex;
}
