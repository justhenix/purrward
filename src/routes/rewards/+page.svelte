<!-- Rewards store: category chips, one auth blocker, and per-card redeem states. -->
<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Heart from '@lucide/svelte/icons/heart';
	import Fish from '@lucide/svelte/icons/fish';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Stethoscope from '@lucide/svelte/icons/stethoscope';
	import type { PageProps } from './$types';

	type Category = 'vet' | 'treat' | 'toy' | 'shelter';

	let { data }: PageProps = $props();

	type RedeemBody = {
		reward?: { title: string };
		balance?: number;
		code?: string;
		error?: string;
	};

	const CHIPS: { id: Category | 'all'; label: string }[] = [
		{ id: 'all', label: 'All' },
		{ id: 'vet', label: 'Vet' },
		{ id: 'treat', label: 'Food' },
		{ id: 'toy', label: 'Toys' },
		{ id: 'shelter', label: 'Donate' }
	];

	let category = $state<Category | 'all'>('all');
	let redeemedBalance = $state<number | null>(null);
	let redeeming = $state<string | null>(null);
	let message = $state('');
	let messageOk = $state(false);

	let sandboxMode = $derived(data.preferences.sandboxMode);
	let balance = $derived(redeemedBalance ?? (sandboxMode ? 999999 : (data.user?.purrpoints ?? 0)));
	let visibleRewards = $derived(
		category === 'all'
			? data.rewards
			: data.rewards.filter((reward) => reward.category === category)
	);

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

<svelte:head>
	<title>Purrward Store</title>
</svelte:head>

{#snippet categoryIcon(cat: Category)}
	{#if cat === 'vet'}
		<Stethoscope size={18} strokeWidth={2.2} aria-hidden="true" />
	{:else if cat === 'treat'}
		<Fish size={18} strokeWidth={2.2} aria-hidden="true" />
	{:else if cat === 'toy'}
		<Sparkles size={18} strokeWidth={2.2} aria-hidden="true" />
	{:else}
		<Heart size={18} strokeWidth={2.2} aria-hidden="true" />
	{/if}
{/snippet}

<div class="rewards-page">
	<header class="store-head">
		<div>
			<p>Balance</p>
			<h1>{balance} Purrpoints</h1>
		</div>
	</header>

	{#if !data.user}
		<div class="auth-blocker">
			<p>Sign in to redeem rewards.</p>
			<a class="auth-btn" href={resolve('/auth/login')}>Sign in</a>
		</div>
	{/if}

	{#if message}
		<p class={['redeem-message', messageOk ? 'ok' : 'warn']}>{message}</p>
	{/if}

	<div class="chips" role="tablist" aria-label="Reward categories">
		{#each CHIPS as chip (chip.id)}
			<button
				type="button"
				role="tab"
				class={['chip', category === chip.id && 'active']}
				aria-selected={category === chip.id}
				onclick={() => (category = chip.id)}
			>
				{chip.label}
			</button>
		{/each}
	</div>

	<section class="rewards-grid">
		{#each visibleRewards as reward (reward.id)}
			{@const affordable = balance >= reward.cost}
			<article class="reward-card">
				<span class={['reward-icon', reward.category]}>
					{@render categoryIcon(reward.category)}
				</span>
				<div class="reward-body">
					<h2>{reward.title}</h2>
					<p>{reward.desc}</p>
					<span class="reward-cost">{reward.cost} pts</span>
				</div>
				<div class="reward-action">
					{#if !data.user}
						<button class="redeem-btn" type="button" disabled>Locked</button>
						<small>Sign in first.</small>
					{:else if !affordable}
						<button class="redeem-btn" type="button" disabled>Need points</button>
					{:else}
						<button
							class="redeem-btn primary"
							type="button"
							disabled={redeeming !== null}
							onclick={() => redeemReward(reward.id)}
						>
							{redeeming === reward.id ? 'Redeeming' : 'Redeem'}
						</button>
					{/if}
				</div>
			</article>
		{/each}
	</section>
</div>

<style>
	.rewards-page {
		display: grid;
		gap: 16px;
	}

	.store-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 4px;
	}

	.store-head p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 800;
	}

	.store-head h1 {
		margin: 2px 0 0;
		color: var(--color-ink);
		font-size: 1.5rem;
	}

	.auth-blocker {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		border: 1px solid var(--color-line);
		border-radius: 22px;
		background: var(--color-sky-soft);
		padding: 14px 16px;
		box-shadow: var(--shadow-card);
	}

	.auth-blocker p {
		margin: 0;
		color: var(--color-ink);
		font-size: 0.92rem;
		font-weight: 700;
	}

	.auth-btn {
		flex: none;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		padding: 10px 18px;
		font-size: 0.82rem;
		font-weight: 850;
		text-decoration: none;
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

	.chips {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		padding-bottom: 2px;
		scrollbar-width: none;
	}

	.chips::-webkit-scrollbar {
		display: none;
	}

	.chip {
		flex: none;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper-2);
		color: var(--color-muted);
		padding: 8px 16px;
		font-size: 0.82rem;
		font-weight: 800;
		cursor: pointer;
		transition:
			background 140ms ease,
			color 140ms ease;
	}

	.chip.active {
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		border-color: var(--color-charcoal);
	}

	.rewards-grid {
		display: grid;
		gap: 12px;
	}

	.reward-card {
		display: grid;
		grid-template-columns: 48px 1fr auto;
		gap: 14px;
		align-items: center;
		border: 1px solid var(--color-line);
		border-radius: 24px;
		background: var(--color-paper-2);
		padding: 16px;
		box-shadow: var(--shadow-card);
	}

	.reward-icon {
		display: grid;
		width: 48px;
		height: 48px;
		place-items: center;
		border-radius: 16px;
		color: var(--color-charcoal);
	}

	.reward-icon.vet {
		background: var(--color-sky-soft);
	}

	.reward-icon.treat {
		background: var(--color-peach-soft);
	}

	.reward-icon.toy {
		background: var(--color-butter);
	}

	.reward-icon.shelter {
		background: var(--color-sage-soft);
		color: var(--color-success-text);
	}

	.reward-body {
		min-width: 0;
	}

	.reward-body h2 {
		margin: 0;
		overflow: hidden;
		color: var(--color-ink);
		font-size: 1rem;
		font-weight: 800;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.reward-body p {
		margin: 2px 0 0;
		overflow: hidden;
		color: var(--color-muted);
		font-size: 0.78rem;
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.reward-cost {
		display: inline-block;
		margin-top: 6px;
		color: var(--color-charcoal);
		font-size: 0.82rem;
		font-weight: 850;
	}

	.reward-action {
		display: grid;
		justify-items: center;
		gap: 3px;
	}

	.reward-action small {
		color: var(--color-muted);
		font-size: 0.68rem;
		font-weight: 700;
	}

	.redeem-btn {
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper-3);
		color: var(--color-muted);
		padding: 9px 16px;
		font-size: 0.8rem;
		font-weight: 850;
		cursor: not-allowed;
		white-space: nowrap;
	}

	.redeem-btn.primary {
		border: 0;
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		cursor: pointer;
		transition: transform 140ms ease;
	}

	.redeem-btn.primary:active {
		transform: scale(0.98);
	}

	.redeem-btn.primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (prefers-reduced-motion: reduce) {
		.chip,
		.redeem-btn.primary {
			transition: none;
		}
	}
</style>
