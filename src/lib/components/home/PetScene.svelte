<!-- Full-bleed pet scene: background artwork with scene-specific cat anchors and overlays. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import bgRoom from '$lib/assets/bg/bg-room.webp';
	import bgRoomDark from '$lib/assets/bg/bg-room-dark.webp';
	import bgPark from '$lib/assets/bg/bg_park.webp';
	import bgParkDark from '$lib/assets/bg/bg_park_night.webp';
	import CatAvatar from '$lib/cat/CatAvatar.svelte';
	import type { HomepageCatLayer } from '$lib/cat/homepage-avatar';

	type SceneId = 'bg_home' | 'bg_park';
	type SceneConfig = {
		id: SceneId;
		light: string;
		dark: string;
		petX: string;
		petY: string;
		petYCompact: string;
		petScale: number;
		petScaleCompact: number;
		statusOffset: string;
		careX: string;
		careY: string;
		careYCompact: string;
		careSide: 'left' | 'right' | 'center';
		sceneControlX: string;
		sceneControlY: string;
	};

	const scenePlacement: Record<SceneId, SceneConfig> = {
		bg_home: {
			id: 'bg_home',
			light: bgRoom,
			dark: bgRoomDark,
			petX: '50%',
			petY: '77%',
			petYCompact: '71%',
			petScale: 1.08,
			petScaleCompact: 1,
			statusOffset: '230px',
			careX: '50%',
			careY: '84%',
			careYCompact: '80%',
			careSide: 'center',
			sceneControlX: '72%',
			sceneControlY: '13%'
		},
		bg_park: {
			id: 'bg_park',
			light: bgPark,
			dark: bgParkDark,
			petX: '50%',
			petY: '77%',
			petYCompact: '71%',
			petScale: 1.08,
			petScaleCompact: 1,
			statusOffset: '230px',
			careX: '50%',
			careY: '84%',
			careYCompact: '80%',
			careSide: 'center',
			sceneControlX: '72%',
			sceneControlY: '13%'
		}
	};

	let {
		catLayers,
		catWarnings = [],
		catLabel = '',
		showCat = true,
		sceneId = 'bg_home',
		top,
		status,
		care,
		sceneControl,
		bottom
	}: {
		catLayers: HomepageCatLayer[];
		catWarnings?: string[];
		catLabel?: string;
		showCat?: boolean;
		sceneId?: string;
		top?: Snippet;
		status?: Snippet;
		care?: Snippet;
		sceneControl?: Snippet;
		bottom?: Snippet;
	} = $props();

	let scene = $derived(scenePlacement[sceneId as SceneId] ?? scenePlacement.bg_home);
</script>

<section
	class={['scene', !showCat && 'guest']}
	data-scene={scene.id}
	style={`--scene-bg-light: url(${scene.light}); --scene-bg-dark: url(${scene.dark}); --pet-x: ${scene.petX}; --pet-y: ${scene.petY}; --pet-y-compact: ${scene.petYCompact}; --pet-scale: ${scene.petScale}; --pet-scale-compact: ${scene.petScaleCompact}; --status-offset: ${scene.statusOffset}; --care-x: ${scene.careX}; --care-y: ${scene.careY}; --care-y-compact: ${scene.careYCompact}; --scene-control-x: ${scene.sceneControlX}; --scene-control-y: ${scene.sceneControlY};`}
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
					<CatAvatar layers={catLayers} warnings={catWarnings} label={catLabel} interactive />
				</div>
			</div>
		{/if}
		{#if sceneControl}
			<div class="scene-control">{@render sceneControl()}</div>
		{/if}
		{#if care}
			<div class={['scene-care', `is-${scene.careSide}`]}>{@render care()}</div>
		{/if}
	</div>

	{#if bottom}
		<div class="scene-bottom">{@render bottom()}</div>
	{/if}
</section>

<style>
	.scene {
		--dock-bottom: calc(var(--app-safe-bottom) + 8px);
		--cat-size: clamp(164px, 45vw, 220px);

		position: relative;
		min-height: 100svh;
		border-radius: 0 0 var(--radius-card-lg) var(--radius-card-lg);
		background-image: var(--scene-bg-light);
		background-position: 50% bottom;
		background-size: cover;
		background-repeat: no-repeat;
		overflow: hidden;
	}

	@supports (height: 100dvh) {
		.scene {
			min-height: 100dvh;
		}
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
		padding: calc(env(safe-area-inset-top) + 16px) calc(env(safe-area-inset-right) + 16px) 0
			calc(env(safe-area-inset-left) + 16px);
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
		top: calc(var(--pet-y) - var(--status-offset));
		left: var(--pet-x);
		z-index: 25;
		display: grid;
		width: max-content;
		max-width: calc(100% - 32px);
		justify-items: center;
		transform: translateX(-50%);
	}

	.scene-cat {
		position: absolute;
		top: var(--pet-y);
		left: var(--pet-x);
		z-index: 20;
		display: grid;
		width: var(--cat-size);
		aspect-ratio: 1;
		place-items: end center;
		transform: translate(-50%, -100%) scale(var(--pet-scale));
		transform-origin: 50% 100%;
	}

	.scene-cat::before {
		position: absolute;
		inset: 10% 4% 0;
		z-index: 0;
		border-radius: 50%;
		background: radial-gradient(
			circle at 50% 44%,
			color-mix(in srgb, var(--color-paper-2) 72%, transparent) 0%,
			color-mix(in srgb, var(--color-paper-2) 36%, transparent) 45%,
			transparent 72%
		);
		content: '';
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
		z-index: 1;
	}

	.scene-cat-art {
		position: relative;
		z-index: 2;
		width: 100%;
		height: 100%;
		pointer-events: auto;
	}

	.scene-control,
	.scene-care {
		position: absolute;
		z-index: 32;
		pointer-events: auto;
	}

	.scene-control {
		top: var(--scene-control-y);
		left: var(--scene-control-x);
	}

	.scene-care {
		top: auto;
		bottom: calc(var(--app-safe-bottom) + 12px);
		left: var(--care-x);
	}

	.scene-care.is-right {
		transform: translateY(-50%);
	}

	.scene-care.is-left {
		transform: translate(-100%, -50%);
	}

	.scene-care.is-center {
		transform: translate(-50%, -50%);
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
		.scene {
			--pet-y: var(--pet-y-compact);
			--care-y: var(--care-y-compact);
			--pet-scale: var(--pet-scale-compact);
		}

		.scene-cat {
			--cat-size: clamp(150px, 41vw, 200px);
		}

		.scene-status {
			top: calc(var(--pet-y) - 196px);
		}
	}
</style>
