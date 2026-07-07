<!-- Full-bleed room scene: artist room artwork as the cat's world with floating bubble overlays. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import bgRoom from '$lib/assets/bg/bg-room.webp';
	import bgRoomDark from '$lib/assets/bg/bg-room-dark.webp';
	import CatAvatar from '$lib/cat/CatAvatar.svelte';
	import type { HomepageCatLayer } from '$lib/cat/homepage-avatar';

	let {
		catLayers,
		catWarnings = [],
		catLabel = '',
		showCat = true,
		top,
		status,
		bottom
	}: {
		catLayers: HomepageCatLayer[];
		catWarnings?: string[];
		catLabel?: string;
		showCat?: boolean;
		top?: Snippet;
		status?: Snippet;
		bottom?: Snippet;
	} = $props();
</script>

<section
	class={['scene', !showCat && 'guest']}
	style={`--scene-bg-light: url(${bgRoom}); --scene-bg-dark: url(${bgRoomDark});`}
>
	<div class="scene-veil" aria-hidden="true"></div>

	{#if top}
		<div class="scene-top">{@render top()}</div>
	{/if}

	<div class="scene-stage">
		{#if status}
			<div class="scene-status">{@render status()}</div>
		{/if}
		{#if showCat}
			<div class="scene-cat">
				<span class="scene-shadow" aria-hidden="true"></span>
				<div class="scene-cat-art">
					<CatAvatar layers={catLayers} warnings={catWarnings} label={catLabel} />
				</div>
			</div>
		{/if}
	</div>

	{#if bottom}
		<div class="scene-bottom">{@render bottom()}</div>
	{/if}
</section>

<style>
	.scene {
		--nav-height: 76px;
		--nav-gap: 16px;
		--dock-height: 112px;
		--safe-bottom: calc(var(--nav-height) + var(--nav-gap) + env(safe-area-inset-bottom));
		--dock-bottom: calc(var(--safe-bottom) + 12px);
		--pet-bottom: calc(var(--safe-bottom) + var(--dock-height) + 56px);

		position: relative;
		min-height: 100svh;
		border-radius: 0 0 var(--radius-card-lg) var(--radius-card-lg);
		background-image: var(--scene-bg-light);
		background-position: 50% bottom;
		background-size: cover;
		background-repeat: no-repeat;
		overflow: hidden;
	}

	:global(:root[data-theme='dark']) .scene {
		background-image: var(--scene-bg-dark);
		background-position: 50% bottom;
	}

	@media (prefers-color-scheme: dark) {
		:global(:root[data-theme='system']) .scene {
			background-image: var(--scene-bg-dark);
			background-position: 50% bottom;
		}
	}

	/* Gentle top/bottom wash for overlay legibility; keeps the artwork visible. */
	.scene-veil {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--color-paper) 28%, transparent) 0%,
			color-mix(in srgb, var(--color-paper) 5%, transparent) 23%,
			color-mix(in srgb, var(--color-paper) 4%, transparent) 62%,
			color-mix(in srgb, var(--color-paper) 26%, transparent) 100%
		);
	}

	.scene-stage {
		position: relative;
		z-index: 20;
	}

	.scene-top {
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		z-index: 30;
		padding: 16px 16px 0;
	}

	.scene-stage {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.scene.guest .scene-stage {
		display: none;
	}

	.scene-status {
		position: absolute;
		bottom: calc(var(--pet-bottom) + 180px);
		left: 50%;
		z-index: 25;
		display: grid;
		width: max-content;
		max-width: calc(100% - 32px);
		justify-items: center;
		transform: translateX(-50%);
	}

	.scene-cat {
		position: absolute;
		left: 50%;
		bottom: var(--pet-bottom);
		z-index: 20;
		display: grid;
		width: clamp(132px, 36vw, 180px);
		aspect-ratio: 1;
		place-items: end center;
		transform: translateX(-50%);
	}

	.scene-shadow {
		position: absolute;
		right: 18%;
		bottom: 6%;
		left: 18%;
		height: 13px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--color-charcoal) 18%, transparent);
		filter: blur(8px);
	}

	.scene-cat-art {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.scene-bottom {
		position: absolute;
		right: 0;
		bottom: var(--dock-bottom);
		left: 0;
		z-index: 35;
		padding: 0 20px;
	}

	.scene.guest .scene-bottom {
		top: 50%;
		bottom: auto;
		transform: translateY(-50%);
	}

	:global(:root[data-theme='dark']) .scene-veil {
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--color-dark-bg) 18%, transparent) 0%,
			color-mix(in srgb, var(--color-dark-bg) 4%, transparent) 42%,
			color-mix(in srgb, var(--color-dark-bg) 18%, transparent) 100%
		);
	}

	@media (prefers-color-scheme: dark) {
		:global(:root[data-theme='system']) .scene-veil {
			background: linear-gradient(
				to bottom,
				color-mix(in srgb, var(--color-dark-bg) 18%, transparent) 0%,
				color-mix(in srgb, var(--color-dark-bg) 4%, transparent) 42%,
				color-mix(in srgb, var(--color-dark-bg) 18%, transparent) 100%
			);
		}
	}

	@media (max-height: 740px) {
		.scene-cat {
			width: clamp(124px, 34vw, 164px);
		}

		.scene-status {
			bottom: calc(var(--pet-bottom) + 160px);
		}
	}
</style>
