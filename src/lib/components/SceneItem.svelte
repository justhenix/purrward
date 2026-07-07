<!-- Compact selectable scene row shared by Home and Rewards. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		name,
		thumbnailStyle,
		owned,
		equipped,
		price,
		children
	}: {
		name: string;
		thumbnailStyle: string;
		owned: boolean;
		equipped: boolean;
		price: number;
		children: Snippet;
	} = $props();

	let status = $derived(equipped || owned ? 'Owned' : `${price} pts`);
</script>

<article class={['scene-item', equipped && 'selected']}>
	<span class="scene-item-thumb" style={thumbnailStyle} aria-hidden="true"></span>
	<div class="scene-item-copy">
		<strong>{name}</strong>
		<span>{status}</span>
	</div>
	<div class="scene-item-action">
		{@render children()}
	</div>
</article>

<style>
	.scene-item {
		display: grid;
		grid-template-columns: 80px minmax(0, 1fr) auto;
		gap: 10px;
		align-items: center;
		border: 1px solid var(--color-line);
		border-radius: 20px;
		background: var(--color-paper-2);
		padding: 10px;
		box-shadow: 0 4px 14px color-mix(in srgb, var(--color-charcoal) 4%, transparent);
	}

	.scene-item.selected {
		border-color: color-mix(in srgb, var(--color-success-text) 20%, var(--color-line));
		background: color-mix(in srgb, var(--color-sage-soft) 18%, var(--color-paper-2));
	}

	.scene-item-thumb {
		width: 80px;
		height: 60px;
		border: 1px solid color-mix(in srgb, var(--color-line) 80%, transparent);
		border-radius: 15px;
		background-image: var(--scene-thumb-light);
		background-position: var(--scene-thumb-position, center bottom);
		background-size: cover;
	}

	:global(:root[data-theme='dark']) .scene-item-thumb {
		background-image: var(--scene-thumb-dark, var(--scene-thumb-light));
	}

	@media (prefers-color-scheme: dark) {
		:global(:root[data-theme='system']) .scene-item-thumb {
			background-image: var(--scene-thumb-dark, var(--scene-thumb-light));
		}
	}

	.scene-item-copy {
		display: grid;
		gap: 5px;
		min-width: 0;
	}

	.scene-item-copy strong {
		color: var(--color-ink);
		font-size: 0.98rem;
		font-weight: 850;
		line-height: 1.12;
		overflow-wrap: anywhere;
	}

	.scene-item-copy span {
		justify-self: start;
		border-radius: var(--radius-pill);
		background: var(--color-paper-3);
		color: var(--color-muted);
		padding: 2px 8px;
		font-size: 0.76rem;
		font-weight: 800;
		line-height: 1.25;
	}

	.scene-item-action {
		display: flex;
		justify-content: flex-end;
	}

	@media (max-width: 360px) {
		.scene-item {
			grid-template-columns: 72px minmax(0, 1fr);
		}

		.scene-item-thumb {
			width: 72px;
			height: 56px;
		}

		.scene-item-action {
			grid-column: 2;
			justify-content: flex-start;
		}
	}
</style>
