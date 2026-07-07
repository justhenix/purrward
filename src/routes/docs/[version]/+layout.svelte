<!-- Purrdocs docs file: generated documentation UI. -->
<script lang="ts">
	import DocsLayout from '$lib/components/purrdocs/Layout/DocsLayout.svelte';

	let { data, children } = $props();
</script>

<DocsLayout
	sidebar={data.sidebar}
	currentPath={data.currentPath}
	siteTitle={data.site?.title ?? 'Purrward Dev Docs'}
	versions={data.versions ?? []}
	currentVersion={data.version}
>
	{@render children()}
</DocsLayout>
