<!-- Partner directory rendered as a stylized map mockup with location pins. -->
<script lang="ts">
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Fish from '@lucide/svelte/icons/fish';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Stethoscope from '@lucide/svelte/icons/stethoscope';
	import Heart from '@lucide/svelte/icons/heart';
	import Store from '@lucide/svelte/icons/store';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Category = 'vet' | 'treat' | 'toy' | 'shelter';

	const LEGEND: { id: Category; label: string }[] = [
		{ id: 'vet', label: 'Vet' },
		{ id: 'treat', label: 'Treats' },
		{ id: 'toy', label: 'Toys' },
		{ id: 'shelter', label: 'Shelter' }
	];

	// Coordinates are stored 0..1000; divide by 10 to place pins as a percentage.
	function pinLeft(mapX: number): string {
		return `${mapX / 10}%`;
	}

	function pinTop(mapY: number): string {
		return `${mapY / 10}%`;
	}
</script>

<svelte:head>
	<title>Partner Map</title>
</svelte:head>

{#snippet categoryIcon(category: string)}
	{#if category === 'vet'}
		<Stethoscope size={15} strokeWidth={2.4} aria-hidden="true" />
	{:else if category === 'treat'}
		<Fish size={15} strokeWidth={2.4} aria-hidden="true" />
	{:else if category === 'toy'}
		<Sparkles size={15} strokeWidth={2.4} aria-hidden="true" />
	{:else if category === 'shelter'}
		<Heart size={15} strokeWidth={2.4} aria-hidden="true" />
	{:else}
		<Store size={15} strokeWidth={2.4} aria-hidden="true" />
	{/if}
{/snippet}

<div class="partners-page">
	<header class="map-head">
		<p>Where your coupons work</p>
		<h1>Partner map</h1>
	</header>

	{#if data.partners.length === 0}
		<div class="empty-state">
			<span class="empty-icon">
				<MapPin size={22} strokeWidth={2.2} aria-hidden="true" />
			</span>
			<h2>No partners yet</h2>
			<p>New partner spots will pop up here soon. Check back to see where you can trade coupons.</p>
		</div>
	{:else}
		<div class="map-mockup paper-texture" role="img" aria-label="Stylized map of partner locations">
			<span class="map-blob blob-a"></span>
			<span class="map-blob blob-b"></span>
			<span class="map-path path-a"></span>
			<span class="map-path path-b"></span>

			{#each data.partners as partner (partner.id)}
				<div class="pin" style="left: {pinLeft(partner.mapX)}; top: {pinTop(partner.mapY)};">
					<span class={['pin-dot', partner.category]}>
						{@render categoryIcon(partner.category)}
					</span>
					<span class="pin-label">{partner.name}</span>
				</div>
			{/each}
		</div>

		<div class="legend" aria-label="Partner categories">
			{#each LEGEND as item (item.id)}
				<span class="legend-item">
					<span class={['legend-swatch', item.id]}></span>
					{item.label}
				</span>
			{/each}
		</div>

		<section class="partner-list" aria-label="Partner list">
			{#each data.partners as partner (partner.id)}
				<article class="partner-row">
					<span class={['row-icon', partner.category]}>
						{@render categoryIcon(partner.category)}
					</span>
					<div class="row-body">
						<h2>{partner.name}</h2>
						<p>{partner.address}</p>
					</div>
				</article>
			{/each}
		</section>
	{/if}
</div>

<style>
	.partners-page {
		display: grid;
		gap: 16px;
	}

	.map-head p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 800;
	}

	.map-head h1 {
		margin: 2px 0 0;
		color: var(--color-ink);
		font-size: 1.5rem;
	}

	.empty-state {
		display: grid;
		justify-items: center;
		gap: 8px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-card);
		background: var(--color-paper-2);
		padding: 32px 24px;
		text-align: center;
		box-shadow: var(--shadow-card);
	}

	.empty-icon {
		display: grid;
		width: 48px;
		height: 48px;
		place-items: center;
		border-radius: 16px;
		background: var(--color-sky-soft);
		color: var(--color-charcoal);
	}

	.empty-state h2 {
		margin: 4px 0 0;
		color: var(--color-ink);
		font-size: 1.1rem;
		font-weight: 800;
	}

	.empty-state p {
		margin: 0;
		max-width: 32ch;
		color: var(--color-muted);
		font-size: 0.86rem;
		font-weight: 600;
		line-height: 1.4;
	}

	.map-mockup {
		position: relative;
		width: 100%;
		aspect-ratio: 4 / 3;
		overflow: hidden;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-card);
		background:
			radial-gradient(
				circle at 20% 25%,
				color-mix(in srgb, var(--color-sage) 22%, transparent),
				transparent 42%
			),
			radial-gradient(
				circle at 82% 70%,
				color-mix(in srgb, var(--color-sky) 20%, transparent),
				transparent 45%
			),
			var(--color-paper-3);
		box-shadow: var(--shadow-card);
	}

	.map-blob {
		position: absolute;
		border-radius: 50%;
		opacity: 0.5;
	}

	.blob-a {
		top: 12%;
		left: 55%;
		width: 34%;
		height: 30%;
		background: color-mix(in srgb, var(--color-sage-soft) 70%, transparent);
	}

	.blob-b {
		bottom: 10%;
		left: 8%;
		width: 30%;
		height: 26%;
		background: color-mix(in srgb, var(--color-sky-soft) 70%, transparent);
	}

	.map-path {
		position: absolute;
		background: color-mix(in srgb, var(--color-line) 80%, transparent);
		border-radius: var(--radius-pill);
	}

	.path-a {
		top: 46%;
		left: -4%;
		width: 108%;
		height: 10px;
		transform: rotate(-7deg);
	}

	.path-b {
		top: -6%;
		left: 40%;
		width: 10px;
		height: 112%;
		transform: rotate(9deg);
	}

	.pin {
		position: absolute;
		display: grid;
		justify-items: center;
		gap: 3px;
		transform: translate(-50%, -100%);
	}

	.pin-dot {
		display: grid;
		width: 30px;
		height: 30px;
		place-items: center;
		border-radius: 50% 50% 50% 4px;
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		transform: rotate(45deg);
		box-shadow: var(--shadow-card);
	}

	.pin-dot :global(svg) {
		transform: rotate(-45deg);
	}

	.pin-dot.vet {
		background: var(--color-sky);
	}

	.pin-dot.treat {
		background: var(--color-peach);
	}

	.pin-dot.toy {
		background: var(--color-butter);
		color: var(--color-charcoal);
	}

	.pin-dot.shelter {
		background: var(--color-sage);
	}

	.pin-label {
		max-width: 12ch;
		border-radius: var(--radius-pill);
		background: var(--color-paper-2);
		color: var(--color-ink);
		padding: 2px 8px;
		font-size: 0.66rem;
		font-weight: 800;
		line-height: 1.2;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		box-shadow: var(--shadow-card);
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	.legend-item {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--color-muted);
		font-size: 0.76rem;
		font-weight: 800;
	}

	.legend-swatch {
		width: 12px;
		height: 12px;
		border-radius: 4px;
	}

	.legend-swatch.vet {
		background: var(--color-sky);
	}

	.legend-swatch.treat {
		background: var(--color-peach);
	}

	.legend-swatch.toy {
		background: var(--color-butter);
	}

	.legend-swatch.shelter {
		background: var(--color-sage);
	}

	.partner-list {
		display: grid;
		gap: 10px;
	}

	.partner-row {
		display: grid;
		grid-template-columns: 40px 1fr;
		gap: 12px;
		align-items: center;
		border: 1px solid var(--color-line);
		border-radius: 20px;
		background: var(--color-paper-2);
		padding: 12px 14px;
		box-shadow: var(--shadow-card);
	}

	.row-icon {
		display: grid;
		width: 40px;
		height: 40px;
		place-items: center;
		border-radius: 14px;
		color: var(--color-charcoal);
	}

	.row-icon.vet {
		background: var(--color-sky-soft);
	}

	.row-icon.treat {
		background: var(--color-peach-soft);
	}

	.row-icon.toy {
		background: var(--color-butter);
	}

	.row-icon.shelter {
		background: var(--color-sage-soft);
		color: var(--color-success-text);
	}

	.row-body {
		min-width: 0;
	}

	.row-body h2 {
		margin: 0;
		overflow: hidden;
		color: var(--color-ink);
		font-size: 0.94rem;
		font-weight: 800;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.row-body p {
		margin: 2px 0 0;
		overflow: hidden;
		color: var(--color-muted);
		font-size: 0.76rem;
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
