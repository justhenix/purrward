<!-- Renders a resolved cat as absolutely-stacked body/face/accessory layers, sized by its parent. -->
<script lang="ts">
	import { dev } from '$app/environment';
	import { getAssetById, resolveCatAssetUrl } from '$lib/assets/cats/cat-assets';
	import type { HomepageCatLayer } from '$lib/cat/homepage-avatar';

	type CatAvatarMood = 'normal' | 'happy' | 'sleepy' | 'sad';

	const PURR_MS = 1000;
	const WAKE_MS = 560;

	let {
		layers,
		warnings = [],
		label = '',
		animated = true,
		interactive = false,
		mood = 'normal'
	}: {
		layers: HomepageCatLayer[];
		warnings?: string[];
		label?: string;
		animated?: boolean;
		interactive?: boolean;
		mood?: CatAvatarMood;
	} = $props();

	let purring = $state(false);
	let waking = $state(false);
	let purrTimer: number | undefined;
	let wakeTimer: number | undefined;
	let petLabel = $derived(label ? `Pet ${label}` : 'Pet cat');
	let happyLayer = $derived.by((): HomepageCatLayer | null => {
		const asset = getAssetById('happy');
		return asset
			? {
					id: 'awake_happy',
					src: resolveCatAssetUrl(asset.uiSrcKey),
					alt: asset.name,
					zIndex: asset.zIndex + 1
				}
			: null;
	});
	let isSleepy = $derived(mood === 'sleepy' || layers.some((layer) => isSleepLayer(layer)));

	function isSleepLayer(layer: HomepageCatLayer): boolean {
		return layer.id === 'sleep';
	}

	function handlePet() {
		if (purring) return;
		purring = true;
		purrTimer = window.setTimeout(() => {
			purring = false;
			purrTimer = undefined;
		}, PURR_MS);
		if (!isSleepy) return;
		waking = true;
		wakeTimer = window.setTimeout(() => {
			waking = false;
			wakeTimer = undefined;
		}, WAKE_MS);
	}

	// Dev-only: surface fallback warnings without ever showing them in production.
	$effect(() => {
		if (dev && warnings.length > 0) {
			console.warn('[CatAvatar]', warnings.join(' · '));
		}
	});

	$effect(() => {
		return () => {
			if (purrTimer !== undefined) window.clearTimeout(purrTimer);
			if (wakeTimer !== undefined) window.clearTimeout(wakeTimer);
		};
	});
</script>

{#snippet avatarArt()}
	<div class="cat-avatar-breathe">
		<div class="cat-avatar-twitch">
			{#each layers as layer (layer.id)}
				<img
					class={waking && isSleepLayer(layer) ? 'sleep-face' : undefined}
					src={layer.src}
					alt=""
					style:z-index={layer.zIndex}
					width="196"
					height="196"
				/>
			{/each}
			{#if waking && happyLayer}
				<img
					class="awake-face"
					src={happyLayer.src}
					alt=""
					style:z-index={happyLayer.zIndex}
					width="196"
					height="196"
				/>
			{/if}
		</div>
	</div>
	{#if purring}
		<span class="purr-effect" aria-hidden="true">
			<span class="purr-text">purr...</span>
		</span>
	{/if}
{/snippet}

{#if interactive}
	<button
		type="button"
		class={['cat-avatar', 'cat-avatar-button', animated && 'is-animated', purring && 'is-purring']}
		aria-label={petLabel}
		onclick={handlePet}
	>
		{@render avatarArt()}
	</button>
{:else}
	<div
		class={['cat-avatar', animated && 'is-animated']}
		role={label ? 'img' : undefined}
		aria-label={label || undefined}
		aria-hidden={label ? undefined : 'true'}
	>
		{@render avatarArt()}
	</div>
{/if}

<style>
	.cat-avatar {
		position: relative;
		width: 100%;
		height: 100%;
		aspect-ratio: 1;
	}

	.cat-avatar-button {
		display: block;
		border: 0;
		background: transparent;
		padding: 0;
		color: inherit;
		cursor: pointer;
		touch-action: manipulation;
	}

	.cat-avatar-button:focus-visible {
		outline: 3px solid color-mix(in srgb, var(--color-sky) 62%, transparent);
		outline-offset: 4px;
		border-radius: 50%;
	}

	.cat-avatar-button:active {
		transform: none;
	}

	.cat-avatar-breathe,
	.cat-avatar-twitch {
		position: absolute;
		inset: 0;
		transform-origin: 50% 88%;
		pointer-events: none;
	}

	.cat-avatar.is-animated .cat-avatar-breathe {
		animation: cat-avatar-breathe 4.8s ease-in-out infinite;
		will-change: transform;
	}

	.cat-avatar.is-animated .cat-avatar-twitch {
		animation: cat-avatar-twitch 6.7s ease-in-out infinite;
		will-change: transform;
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

	.sleep-face {
		animation: sleep-face-out 560ms ease-out both;
	}

	.awake-face {
		animation: awake-face-in 560ms ease-out both;
		pointer-events: none;
	}

	.purr-effect {
		position: absolute;
		right: 16%;
		bottom: 62%;
		z-index: 80;
		pointer-events: none;
		animation: purr-float 1000ms ease-out both;
	}

	.purr-effect::before,
	.purr-effect::after {
		position: absolute;
		inset: 50% auto auto 50%;
		width: 22px;
		height: 22px;
		border: 1px solid color-mix(in srgb, var(--color-peach) 72%, transparent);
		border-radius: 50%;
		content: '';
		animation: purr-ring 1000ms ease-out both;
	}

	.purr-effect::after {
		width: 14px;
		height: 14px;
		border-color: color-mix(in srgb, var(--color-sage) 70%, transparent);
		animation-delay: 120ms;
	}

	.purr-text {
		display: inline-flex;
		border: 1px solid color-mix(in srgb, var(--color-line) 82%, transparent);
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--color-paper-2) 86%, transparent);
		color: var(--color-muted);
		padding: 4px 8px;
		font-size: 0.72rem;
		font-weight: 850;
		line-height: 1;
		box-shadow: 0 8px 18px color-mix(in srgb, var(--color-charcoal) 12%, transparent);
	}

	@keyframes cat-avatar-breathe {
		0%,
		100% {
			transform: translateY(0) scale(1);
		}
		50% {
			transform: translateY(-1.5px) scale(1.006);
		}
	}

	@keyframes cat-avatar-twitch {
		0%,
		68%,
		100% {
			transform: rotate(0deg);
		}
		72% {
			transform: rotate(0.55deg);
		}
		74% {
			transform: rotate(-0.45deg);
		}
		76% {
			transform: rotate(0.28deg);
		}
		78% {
			transform: rotate(0deg);
		}
	}

	@keyframes sleep-face-out {
		0%,
		20% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}

	@keyframes awake-face-in {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}

	@keyframes purr-float {
		0% {
			opacity: 0;
			transform: translate3d(0, 4px, 0) scale(0.96);
		}
		18% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate3d(0, -14px, 0) scale(1);
		}
	}

	@keyframes purr-ring {
		0% {
			opacity: 0.42;
			transform: translate(-50%, -50%) scale(0.35);
		}
		100% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(1.6);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cat-avatar.is-animated .cat-avatar-breathe,
		.cat-avatar.is-animated .cat-avatar-twitch {
			animation: none;
			transform: none;
			will-change: auto;
		}

		.purr-effect {
			animation: awake-face-in 160ms ease-out both;
		}

		.purr-effect::before,
		.purr-effect::after {
			display: none;
		}
	}
</style>
