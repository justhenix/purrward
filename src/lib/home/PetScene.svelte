<!-- Home pet-stage scene: park backdrop, centered cat, care prompt, and the scan CTA. -->
<script lang="ts">
	import Camera from '@lucide/svelte/icons/camera';
	import Check from '@lucide/svelte/icons/check';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import bgPark from '$lib/assets/bg/bg_park.webp';
	import CatAvatar from '$lib/cat/CatAvatar.svelte';
	import type { HomepageCatLayer } from '$lib/cat/homepage-avatar';

	let {
		layers,
		warnings = [],
		pill,
		title,
		reward = null,
		complete = false,
		ctaHref = null,
		ctaLabel = null,
		restNote = null
	}: {
		layers: HomepageCatLayer[];
		warnings?: string[];
		pill: string;
		title: string;
		reward?: string | null;
		complete?: boolean;
		ctaHref?: string | null;
		ctaLabel?: string | null;
		restNote?: string | null;
	} = $props();
</script>

<section class={['scene', complete && 'complete']} aria-labelledby="scene-title">
	<img class="scene-bg" src={bgPark} alt="" aria-hidden="true" />
	<span class="scene-scrim" aria-hidden="true"></span>

	<div class="scene-content">
		<div class="scene-top">
			<span class="status-pill">
				{#if complete}
					<Sparkles size={13} strokeWidth={2.6} aria-hidden="true" />
				{/if}
				{pill}
			</span>
		</div>

		<div class="scene-stage">
			<span class="cat-pad" aria-hidden="true"></span>
			<span class="cat-shadow" aria-hidden="true"></span>
			<div class="cat">
				<CatAvatar {layers} {warnings} />
			</div>
			{#if complete}
				<span class="done-badge" aria-hidden="true">
					<Check size={16} strokeWidth={3} />
				</span>
			{/if}
		</div>

		<div class="scene-bottom">
			<h2 id="scene-title">{title}</h2>
			{#if reward}
				<p class="reward">{reward}</p>
			{/if}
			{#if ctaHref && ctaLabel}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- href is resolved by the parent -->
				<a class="cta" href={ctaHref}>
					<Camera size={20} strokeWidth={2.3} aria-hidden="true" />
					<span>{ctaLabel}</span>
				</a>
			{:else if restNote}
				<p class="rest-note">{restNote}</p>
			{/if}
		</div>
	</div>
</section>

<style>
	.scene {
		position: relative;
		overflow: hidden;
		height: clamp(300px, 82vw, 372px);
		border: 1px solid var(--color-line);
		border-radius: var(--radius-card-lg);
		background: var(--color-paper-3);
		box-shadow: var(--shadow-card);
	}

	.scene-bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Soft warm scrim: top for the status pill, bottom for the care copy.
	 * Uses --color-paper so it warms in light mode and darkens in dark mode. */
	.scene-scrim {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--color-paper) 52%, transparent) 0%,
			transparent 26%,
			transparent 46%,
			color-mix(in srgb, var(--color-paper) 90%, transparent) 100%
		);
	}

	.scene-content {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 14px 16px 16px;
	}

	.scene-top {
		display: flex;
		justify-content: flex-start;
	}

	.status-pill {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--color-paper-2) 82%, transparent);
		color: var(--color-charcoal);
		padding: 5px 12px;
		font-size: 0.74rem;
		font-weight: 850;
		letter-spacing: 0.01em;
		backdrop-filter: blur(4px);
	}

	.scene-stage {
		position: relative;
		display: grid;
		flex: 1;
		place-items: center end;
		grid-template-rows: 1fr;
		justify-items: center;
		min-height: 0;
	}

	/* Soft light spot so the cat reads cleanly over the photo backdrop. */
	.cat-pad {
		position: absolute;
		bottom: 4%;
		width: min(66vw, 250px);
		height: min(66vw, 250px);
		border-radius: 50%;
		background: radial-gradient(
			circle,
			color-mix(in srgb, var(--color-paper-2) 88%, transparent) 0%,
			color-mix(in srgb, var(--color-paper-2) 58%, transparent) 46%,
			transparent 72%
		);
	}

	.cat-shadow {
		position: absolute;
		bottom: 8%;
		width: min(42vw, 158px);
		height: 20px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--color-charcoal) 16%, transparent);
		filter: blur(9px);
	}

	.cat {
		position: relative;
		width: min(54vw, 202px);
		aspect-ratio: 1;
		align-self: end;
	}

	.done-badge {
		position: absolute;
		top: 6%;
		right: 22%;
		display: grid;
		width: 32px;
		height: 32px;
		place-items: center;
		border-radius: 50%;
		background: var(--color-sage);
		color: var(--color-charcoal);
		box-shadow: 0 6px 16px color-mix(in srgb, var(--color-charcoal) 18%, transparent);
	}

	.scene-bottom {
		display: grid;
		gap: 8px;
		text-align: center;
	}

	.scene-bottom h2 {
		margin: 0;
		color: var(--color-ink);
		font-size: clamp(1.4rem, 6vw, 1.7rem);
		line-height: 1.05;
	}

	.reward {
		margin: -3px 0 2px;
		color: var(--color-charcoal);
		font-size: 0.92rem;
		font-weight: 800;
	}

	.rest-note {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.86rem;
		font-weight: 700;
	}

	.cta {
		display: inline-flex;
		width: 100%;
		min-height: 52px;
		align-items: center;
		justify-content: center;
		gap: 10px;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		font-size: 1rem;
		font-weight: 800;
		text-decoration: none;
		box-shadow: 0 12px 26px color-mix(in srgb, var(--color-charcoal) 20%, transparent);
		transition: transform 120ms ease;
	}

	.cta:active {
		transform: translateY(1px);
	}

	@media (prefers-reduced-motion: reduce) {
		.cta {
			transition: none;
		}
	}
</style>
