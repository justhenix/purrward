<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type RewardItem = {
		id: string;
		title: string;
		cost: number;
		desc: string;
		category: 'vet' | 'treat' | 'toy' | 'shelter';
		available: boolean;
	};

	const rewards: RewardItem[] = [
		{
			id: 'vet_discount',
			title: 'Vet Consultation Disc.',
			cost: 100,
			desc: 'Get 25% off your next physical vet visit.',
			category: 'vet',
			available: true
		},
		{
			id: 'cat_treats',
			title: 'Premium Tuna Treats',
			cost: 150,
			desc: 'All-natural organic freeze-dried tuna bites.',
			category: 'treat',
			available: true
		},
		{
			id: 'feather_wand',
			title: 'Rainbow Feather Wand',
			cost: 200,
			desc: 'Interactive toy with comfortable wooden handle.',
			category: 'toy',
			available: true
		},
		{
			id: 'shelter_don',
			title: 'Feed a Shelter Kitty',
			cost: 100,
			desc: 'Donate daily meals to cat rescue shelters.',
			category: 'shelter',
			available: true
		}
	];
</script>

<!-- Rewards store for Purrpoints, care discounts, and cat treats. -->

<svelte:head>
	<title>Purrward Store</title>
</svelte:head>

<div class="rewards-page">
	<section class="store-hero card bg-peach-soft/30">
		<div class="watercolor-splotch-bg watercolor-blob-peach"></div>
		<div class="store-hero-content">
			<span class="store-badge">Care Rewards</span>
			<h2>Rewards Store</h2>
			<p>Spend your hard-earned Purrpoints on vet discounts, treats, or donations.</p>
		</div>
	</section>

	<div class="points-summary card">
		<div class="points-info">
			<span>Available Balance</span>
			<h2>🪙 {data.user?.purrpoints ?? 0} Purrpoints</h2>
		</div>
	</div>

	<section class="rewards-grid">
		{#each rewards as reward (reward.id)}
			<div
				class="reward-card card"
				class:unavailable={!reward.available || (data.user?.purrpoints ?? 0) < reward.cost}
			>
				<div class="reward-header">
					<span class="reward-cat-tag {reward.category}">{reward.category}</span>
					<span class="reward-cost">🪙 {reward.cost} Pts</span>
				</div>
				<div class="reward-body">
					<h4>{reward.title}</h4>
					<p>{reward.desc}</p>
				</div>
				<button class="redeem-btn" disabled={!data.user || data.user.purrpoints < reward.cost}>
					{!data.user
						? 'Sign in to Redeem'
						: data.user.purrpoints < reward.cost
							? 'Need More Points'
							: 'Redeem Reward'}
				</button>
			</div>
		{/each}
	</section>
</div>

<style>
	.rewards-page {
		display: grid;
		gap: 20px;
	}

	.card {
		background: var(--color-paper-2);
		border: 1px solid var(--color-line);
		border-radius: var(--radius-card);
		box-shadow: var(--shadow-card);
		position: relative;
		overflow: hidden;
	}

	.store-hero {
		padding: 24px;
		background: linear-gradient(135deg, var(--color-peach-soft) 0%, var(--color-paper-2) 100%);
	}

	.store-hero-content {
		position: relative;
		z-index: 2;
	}

	.store-badge {
		display: inline-block;
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 4px 10px;
		border-radius: var(--radius-pill);
		background: var(--color-butter);
		color: var(--color-charcoal);
		margin-bottom: 8px;
	}

	.store-hero h2 {
		font-size: 1.45rem;
		font-weight: 700;
		color: var(--color-ink);
		margin: 0 0 6px;
	}

	.store-hero p {
		font-size: 0.82rem;
		color: var(--color-muted);
		line-height: 1.45;
		margin: 0;
	}

	.points-summary {
		padding: 18px 24px;
		background: var(--color-paper-2);
	}

	.points-info span {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.points-info h2 {
		font-size: 1.3rem;
		font-weight: 700;
		color: var(--color-ink);
		margin: 4px 0 0;
	}

	.rewards-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 12px;
	}

	.reward-card {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		background: var(--color-paper-2);
	}

	.reward-card.unavailable {
		opacity: 0.75;
	}

	.reward-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.reward-cat-tag {
		font-size: 0.62rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 3px 8px;
		border-radius: var(--radius-pill);
	}

	.reward-cat-tag.vet {
		background: var(--color-sky-soft);
		color: var(--color-info-text);
	}

	.reward-cat-tag.treat {
		background: var(--color-peach-soft);
		color: var(--color-charcoal);
	}

	.reward-cat-tag.toy {
		background: var(--color-success-bg);
		color: var(--color-success-text);
	}

	.reward-cat-tag.shelter {
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
	}

	.reward-cost {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-ink);
	}

	.reward-body h4 {
		margin: 0 0 4px;
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-ink);
	}

	.reward-body p {
		margin: 0;
		font-size: 0.78rem;
		color: var(--color-muted);
		line-height: 1.4;
	}

	.redeem-btn {
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		border: 0;
		padding: 10px 16px;
		font-size: 0.82rem;
		font-weight: 700;
		border-radius: var(--radius-pill);
		cursor: pointer;
		text-align: center;
		transition: transform 0.15s ease;
	}

	.redeem-btn:active {
		transform: scale(0.98);
	}

	.redeem-btn:disabled {
		background: var(--color-paper-3);
		color: var(--color-muted);
		border: 1px solid var(--color-line);
		cursor: not-allowed;
	}
</style>
