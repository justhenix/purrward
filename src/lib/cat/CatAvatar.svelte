<!-- Renders a resolved cat as absolutely-stacked body/face/accessory layers, sized by its parent. -->
<script lang="ts">
	import { dev } from '$app/environment';
	import type { HomepageCatLayer } from '$lib/cat/homepage-avatar';

	let {
		layers,
		warnings = [],
		label = ''
	}: {
		layers: HomepageCatLayer[];
		warnings?: string[];
		label?: string;
	} = $props();

	// Dev-only: surface fallback warnings without ever showing them in production.
	$effect(() => {
		if (dev && warnings.length > 0) {
			console.warn('[CatAvatar]', warnings.join(' · '));
		}
	});
</script>

<div
	class="cat-avatar"
	role={label ? 'img' : undefined}
	aria-label={label || undefined}
	aria-hidden={label ? undefined : 'true'}
>
	{#each layers as layer (layer.id)}
		<img src={layer.src} alt="" style:z-index={layer.zIndex} width="196" height="196" />
	{/each}
</div>

<style>
	.cat-avatar {
		position: relative;
		width: 100%;
		height: 100%;
		aspect-ratio: 1;
	}

	.cat-avatar img {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
		filter: drop-shadow(0 1px 1px color-mix(in srgb, var(--color-charcoal) 16%, transparent));
	}
</style>
