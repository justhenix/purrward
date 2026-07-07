<!-- Compact Purrpoints summary card linking to the rewards store. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Star from '@lucide/svelte/icons/star';

	let {
		balance,
		caption
	}: {
		balance: number;
		caption: string;
	} = $props();
</script>

<a class="points" href={resolve('/rewards')}>
	<span class="points-icon"><Star size={17} strokeWidth={2.3} aria-hidden="true" /></span>
	<span class="points-copy">
		<strong>{balance} Purrpoints</strong>
		<small>{caption}</small>
	</span>
	<span class="points-go">
		Rewards <ChevronRight size={16} strokeWidth={2.3} aria-hidden="true" />
	</span>
</a>

<style>
	.points {
		display: grid;
		grid-template-columns: 38px 1fr auto;
		gap: 11px;
		align-items: center;
		border: 1px solid var(--color-line);
		border-radius: 22px;
		background: var(--color-paper-2);
		padding: 12px 14px;
		color: var(--color-ink);
		text-decoration: none;
	}

	.points-icon {
		display: grid;
		width: 38px;
		height: 38px;
		place-items: center;
		border-radius: 50%;
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
	}

	.points-copy {
		min-width: 0;
	}

	.points-copy strong,
	.points-copy small {
		display: block;
	}

	.points-copy strong {
		font-size: 0.98rem;
		font-weight: 850;
	}

	.points-copy small {
		overflow: hidden;
		margin-top: 1px;
		color: var(--color-muted);
		font-size: 0.75rem;
		font-weight: 650;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.points-go {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		color: var(--color-muted);
		font-size: 0.8rem;
		font-weight: 850;
	}
</style>
