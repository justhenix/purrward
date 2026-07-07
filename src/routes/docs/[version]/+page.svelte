<!-- Purrdocs docs file: generated documentation UI. -->
<script lang="ts">
	import Breadcrumbs from '$lib/components/purrdocs/Navigation/Breadcrumbs.svelte';
	import PrevNext from '$lib/components/purrdocs/Navigation/PrevNext.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.doc.frontmatter.title} | {data.siteTitle}</title>
	{#if data.doc.frontmatter.description}
		<meta name="description" content={data.doc.frontmatter.description} />
	{/if}
</svelte:head>

<Breadcrumbs items={data.breadcrumbs} />

<article class="doc-content">
	<data.doc.component />
</article>

<PrevNext prev={data.prevNext.prev} next={data.prevNext.next} />

<style>
	.doc-content {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
		max-width: 780px;
		width: 100%;
		margin: 0 auto;
		line-height: 1.75;
	}

	.doc-content :global(h1) {
		font-size: clamp(2.4rem, 3vw, 3rem);
		margin: 0;
		color: var(--purrdocs-color-text, #171a19);
		line-height: 1.1;
	}

	.doc-content :global(h2) {
		font-size: clamp(1.6rem, 2vw, 2.1rem);
		margin: 1.75rem 0 0.35rem;
		color: var(--purrdocs-color-text, #171a19);
	}

	.doc-content :global(h3),
	.doc-content :global(h4),
	.doc-content :global(h5),
	.doc-content :global(h6) {
		margin: 1.5rem 0 0.35rem;
		color: var(--purrdocs-color-text, #171a19);
	}

	.doc-content :global(p) {
		color: var(--purrdocs-color-text-secondary, #475569);
		line-height: 1.8;
		margin: 0;
		font-size: 1rem;
	}

	.doc-content :global(a) {
		color: var(--purrdocs-color-primary, #242626);
		text-decoration: none;
		border-bottom: 1px solid color-mix(in srgb, var(--purrdocs-color-primary) 30%, transparent);
		transition:
			color 0.2s ease,
			border-color 0.2s ease;
	}

	.doc-content :global(a:hover) {
		color: var(--purrdocs-color-accent, #8ebc8c);
		border-color: color-mix(in srgb, var(--purrdocs-color-accent) 40%, transparent);
	}

	.doc-content :global(code) {
		background: color-mix(in srgb, var(--purrdocs-color-primary) 12%, transparent);
		color: var(--purrdocs-color-text, #171a19);
		padding: 0.15rem 0.35rem;
		border-radius: 0.35rem;
		font-size: 0.9em;
		font-family: var(--font-sans, inherit);
	}

	.doc-content :global(pre) {
		background: #171a19;
		color: #f8f1e6;
		padding: 1rem 1.25rem;
		border-radius: 0.85rem;
		border: 1px solid color-mix(in srgb, var(--purrdocs-color-primary) 35%, transparent);
		box-shadow: 0 15px 35px rgba(15, 23, 42, 0.35);
		overflow: auto;
		max-width: 100%;
		font-size: 0.95rem;
	}

	.doc-content :global(pre code) {
		background: transparent;
		color: inherit;
		padding: 0;
		border-radius: 0;
		font-size: inherit;
	}

	.doc-content :global(blockquote) {
		margin: 0;
		padding: 1rem 1.25rem;
		background: color-mix(in srgb, var(--purrdocs-color-accent) 8%, transparent);
		border-left: 3px solid var(--purrdocs-color-accent, #8ebc8c);
		border-radius: 0.75rem;
		color: var(--purrdocs-color-text-secondary, #475569);
	}

	.doc-content :global(ul),
	.doc-content :global(ol) {
		padding-left: 1.25rem;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.doc-content :global(li) {
		color: var(--purrdocs-color-text-secondary, #475569);
		line-height: 1.7;
	}

	.doc-content :global(hr) {
		height: 1px;
		border: 0;
		background: linear-gradient(
			90deg,
			transparent,
			color-mix(in srgb, var(--purrdocs-color-primary) 40%, transparent),
			transparent
		);
		margin: 1.5rem 0;
	}

	.doc-content :global(table) {
		width: 100%;
		border-collapse: collapse;
		border: 1px solid var(--purrdocs-color-border, #f8f1e6);
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.doc-content :global(th),
	.doc-content :global(td) {
		padding: 0.65rem 0.85rem;
		border-bottom: 1px solid var(--purrdocs-color-border, #f8f1e6);
		text-align: left;
		font-size: 0.95rem;
	}

	.doc-content :global(tr:nth-child(even)) {
		background: color-mix(in srgb, var(--purrdocs-color-primary) 4%, transparent);
	}

	.doc-content :global(img) {
		border-radius: 0.85rem;
		border: 1px solid rgba(15, 23, 42, 0.08);
		max-width: 100%;
	}

	@media (max-width: 640px) {
		.doc-content {
			padding: 0 0.5rem;
		}
	}
</style>
