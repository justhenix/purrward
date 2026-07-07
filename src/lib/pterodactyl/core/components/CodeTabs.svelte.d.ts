// Ptero docs file: generated documentation engine code.
import type { SvelteComponent } from 'svelte';

export interface CodeTab {
	label: string;
	code: string;
	source?: string;
	lang?: string;
}

export interface CodeTabsProps {
	tabs: CodeTab[];
	initialIndex?: number;
}

export default class CodeTabs extends SvelteComponent<
	CodeTabsProps,
	Record<string, never>,
	Record<string, never>
> {}
