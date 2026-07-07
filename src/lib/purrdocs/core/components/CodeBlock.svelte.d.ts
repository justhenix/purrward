// Purrdocs docs file: generated documentation engine code.
import type { SvelteComponent } from 'svelte';

export interface CodeBlockProps {
	source: string;
	code: string;
	lang?: string;
	title?: string | null;
}

export default class CodeBlock extends SvelteComponent<
	CodeBlockProps,
	Record<string, never>,
	Record<string, never>
> {}
