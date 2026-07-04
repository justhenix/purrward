<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type RedeemBody = {
		reward?: { title: string };
		balance?: number;
		code?: string;
		error?: string;
	};

	let redeemedBalance = $state<number | null>(null);
	let sandboxMode = $derived(data.preferences.sandboxMode);
	let balance = $derived(redeemedBalance ?? (sandboxMode ? 999999 : (data.user?.purrpoints ?? 0)));
	let redeeming = $state<string | null>(null);
	let message = $state('');
	let messageOk = $state(false);

	async function redeemReward(rewardId: string) {
		if (!data.user || redeeming) return;

		redeeming = rewardId;
		message = '';

		const formData = new FormData();
		formData.set('rewardId', rewardId);
		const response = await fetch('/api/rewards/redeem', { method: 'POST', body: formData });
		const body = (await response.json()) as RedeemBody;

		if (response.ok && typeof body.balance === 'number' && body.reward && body.code) {
			redeemedBalance = body.balance;
			messageOk = true;
			message = `${body.reward.title} redeemed. Code ${body.code}.`;
			await invalidateAll();
		} else {
			messageOk = false;
			message = body.error ?? 'Could not redeem this reward.';
		}

		redeeming = null;
	}
</script>

<!-- Rewards store for Purrpoints, care discounts, and cat treats. -->

<svelte:head>
	<title>Purrward Store</title>
</svelte:head>

<div class="rewards-page">
	<section class="store-hero card bg-peach-soft/30">
		<div class="watercolor-splotch-bg watercolor-blob-peach"></div>
		<div class="store-hero-content">
			<span class="store-badge">{sandboxMode ? 'Sandbox Rewards' : 'Care Rewards'}</span>
			<h2>Rewards Store</h2>
			<p>
				{sandboxMode ? 'Redeem freely with test points.' : 'Vet help, treats, toys, donations.'}
			</p>
		</div>
	</section>

	<div class="points-summary card">
		<div class="points-info">
			<span>Balance</span>
			<h2>{balance} Purrpoints</h2>
			{#if sandboxMode}
				<p>Sandbox test balance</p>
			{/if}
		</div>
	</div>

	{#if message}
		<p class={['redeem-message', messageOk ? 'ok' : 'warn']}>{message}</p>
	{/if}

	<section class="rewards-grid">
		{#each data.rewards as reward (reward.id)}
			<div class="reward-card card" class:unavailable={!data.user || balance < reward.cost}>
				<div class="reward-header">
					<span class="reward-cat-tag {reward.category}">{reward.category}</span>
					<span class="reward-cost">{reward.cost} pts</span>
				</div>
				<div class="reward-body">
					<h4>{reward.title}</h4>
					<p>{reward.desc}</p>
				</div>
				<button
					class="redeem-btn"
					disabled={!data.user || balance < reward.cost || redeeming !== null}
					onclick={() => redeemReward(reward.id)}
				>
					{!data.user
						? 'Sign in'
						: balance < reward.cost
							? 'Need points'
							: redeeming === reward.id
								? 'Redeeming'
								: 'Redeem'}
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
		overflow: hidden;
		font-size: 0.82rem;
		color: var(--color-muted);
		line-height: 1.45;
		margin: 0;
		text-overflow: ellipsis;
		white-space: nowrap;
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

	.points-info p {
		margin: 3px 0 0;
		color: var(--color-muted);
		font-size: 0.8rem;
		font-weight: 700;
	}

	.redeem-message {
		margin: 0;
		border-radius: 18px;
		padding: 12px 14px;
		font-size: 0.82rem;
		font-weight: 700;
		line-height: 1.35;
	}

	.redeem-message.ok {
		background: var(--color-success-bg);
		color: var(--color-success-text);
	}

	.redeem-message.warn {
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
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
		overflow: hidden;
		margin: 0;
		font-size: 0.78rem;
		color: var(--color-muted);
		line-height: 1.4;
		text-overflow: ellipsis;
		white-space: nowrap;
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
