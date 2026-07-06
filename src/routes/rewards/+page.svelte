<!-- Rewards store: compact balance, one featured card, and a calm scannable reward list. -->
<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Heart from '@lucide/svelte/icons/heart';
	import Fish from '@lucide/svelte/icons/fish';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Star from '@lucide/svelte/icons/star';
	import Stethoscope from '@lucide/svelte/icons/stethoscope';
	import type { PageProps } from './$types';

	type Category = 'vet' | 'treat' | 'toy' | 'shelter';

	let { data }: PageProps = $props();

	type Reward = (typeof data.rewards)[number];

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
	// One focused featured reward (no carousel); falls back to nothing when unset.
	let featuredReward = $derived(
		data.rewards.find((reward) => data.featuredIds.includes(reward.id)) ?? null
	);
	let rotationLabel = $derived(
		`Refreshes in ${data.daysUntilRotation} ${data.daysUntilRotation === 1 ? 'day' : 'days'}`
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

{#snippet categoryIcon(cat: Category, size = 18)}
	{#if cat === 'vet'}
		<Stethoscope {size} strokeWidth={2.2} aria-hidden="true" />
	{:else if cat === 'treat'}
		<Fish {size} strokeWidth={2.2} aria-hidden="true" />
	{:else if cat === 'toy'}
		<Sparkles {size} strokeWidth={2.2} aria-hidden="true" />
	{:else}
		<Heart {size} strokeWidth={2.2} aria-hidden="true" />
	{/if}
{/snippet}

<!-- Single reward CTA: one control communicates redeem, locked, or shortfall. -->
{#snippet rewardCta(reward: Reward)}
	{#if !data.user}
		<button class="redeem-btn" type="button" disabled>Locked</button>
	{:else if balance < reward.cost}
		<button class="redeem-btn" type="button" disabled>Need {reward.cost} pts</button>
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
{/snippet}

{#snippet rewardCard(reward: Reward)}
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
			{@render rewardCta(reward)}
		</div>
	</article>
{/snippet}

<div class="rewards-page">
	<header class="store-head">
		<span class="balance-icon" aria-hidden="true">
			<Star size={18} strokeWidth={2.3} />
		</span>
		<div class="balance-copy">
			<p>Balance</p>
			<strong>{balance} Purrpoints</strong>
		</div>
		<a class="history-link" href={resolve('/rewards/history')}>My coupons</a>
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

	{#if featuredReward}
		<section class="featured" aria-label="Featured reward this week">
			<div class="featured-head">
				<h2>Featured this week</h2>
				<span class="featured-countdown">{rotationLabel}</span>
			</div>
			<article class="featured-card">
				<span class={['reward-icon', 'lg', featuredReward.category]}>
					{@render categoryIcon(featuredReward.category, 22)}
				</span>
				<div class="reward-body">
					<h3>{featuredReward.title}</h3>
					<p>{featuredReward.desc}</p>
					<span class="reward-cost">{featuredReward.cost} pts</span>
				</div>
				<div class="reward-action">
					{@render rewardCta(featuredReward)}
				</div>
			</article>
		</section>
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
			{@render rewardCard(reward)}
		{/each}
	</section>
</div>

<style>
	.rewards-page {
		display: grid;
		gap: 16px;
		/* Keep the last card clear of the floating bottom nav. */
		padding-bottom: 8px;
	}

	/* Compact balance surface — warm paper in light, soft charcoal surface in dark. */
	.store-head {
		display: flex;
		align-items: center;
		gap: 12px;
		border: 1px solid var(--color-line);
		border-radius: 22px;
		background: var(--color-paper-2);
		padding: 12px 14px;
	}

	.balance-icon {
		display: grid;
		width: 40px;
		height: 40px;
		flex: none;
		place-items: center;
		border-radius: 50%;
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
	}

	.balance-copy {
		flex: 1;
		min-width: 0;
	}

	.balance-copy p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.74rem;
		font-weight: 800;
	}

	.balance-copy strong {
		display: block;
		margin-top: 1px;
		color: var(--color-ink);
		font-size: 1.16rem;
		font-weight: 850;
		line-height: 1.1;
	}

	.history-link {
		flex: none;
		min-height: 40px;
		display: inline-flex;
		align-items: center;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper);
		color: var(--color-charcoal);
		padding: 0 15px;
		font-size: 0.8rem;
		font-weight: 800;
		text-decoration: none;
	}

	/* Featured: one focused card, softer than a full butter block. */
	.featured {
		display: grid;
		gap: 10px;
		border: 1px solid var(--color-line);
		border-radius: 26px;
		background: color-mix(in srgb, var(--color-butter) 42%, var(--color-paper-2));
		padding: 14px;
	}

	.featured-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
	}

	.featured-head h2 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.02rem;
		font-weight: 850;
	}

	.featured-countdown {
		flex: none;
		color: var(--color-muted);
		font-size: 0.74rem;
		font-weight: 800;
	}

	.featured-card {
		display: grid;
		grid-template-columns: 56px 1fr auto;
		gap: 14px;
		align-items: center;
		border: 1px solid var(--color-line);
		border-radius: 20px;
		background: var(--color-paper-2);
		padding: 14px 16px;
	}

	.featured-card h3 {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		margin: 0;
		overflow: hidden;
		color: var(--color-ink);
		font-size: 1.02rem;
		font-weight: 800;
		line-height: 1.22;
	}

	.auth-blocker {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		border: 1px solid var(--color-line);
		border-radius: 20px;
		background: var(--color-sky-soft);
		padding: 13px 15px;
	}

	.auth-blocker p {
		margin: 0;
		color: var(--color-ink);
		font-size: 0.9rem;
		font-weight: 700;
	}

	.auth-btn {
		flex: none;
		min-height: 40px;
		display: inline-flex;
		align-items: center;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		padding: 0 18px;
		font-size: 0.82rem;
		font-weight: 850;
		text-decoration: none;
	}

	.redeem-message {
		margin: 0;
		border-radius: 16px;
		padding: 11px 14px;
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

	/* Lighter, compact category chips. */
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
		min-height: 36px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: transparent;
		color: var(--color-muted);
		padding: 0 14px;
		font-size: 0.8rem;
		font-weight: 750;
		cursor: pointer;
		transition:
			background 140ms ease,
			color 140ms ease;
	}

	.chip.active {
		background: color-mix(in srgb, var(--color-charcoal) 12%, transparent);
		border-color: color-mix(in srgb, var(--color-charcoal) 32%, transparent);
		color: var(--color-ink);
		font-weight: 850;
	}

	.rewards-grid {
		display: grid;
		gap: 11px;
	}

	/* Calm reward card: soft border, gentle shadow, cozy radius. */
	.reward-card {
		display: grid;
		grid-template-columns: 48px 1fr auto;
		gap: 12px;
		align-items: center;
		border: 1px solid var(--color-line);
		border-radius: 24px;
		background: var(--color-paper-2);
		padding: 14px 16px;
		box-shadow: 0 4px 14px color-mix(in srgb, var(--color-charcoal) 4%, transparent);
	}

	.reward-icon {
		display: grid;
		width: 48px;
		height: 48px;
		flex: none;
		place-items: center;
		border-radius: 15px;
		color: var(--color-charcoal);
	}

	.reward-icon.lg {
		width: 56px;
		height: 56px;
		border-radius: 17px;
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
		font-size: 0.98rem;
		font-weight: 800;
		line-height: 1.22;
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
		display: inline-flex;
		align-items: center;
		margin-top: 7px;
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--color-butter) 62%, var(--color-paper-2));
		color: var(--color-ink);
		padding: 3px 10px;
		font-size: 0.78rem;
		font-weight: 850;
	}

	.reward-action {
		display: grid;
		place-items: center;
	}

	.redeem-btn {
		min-height: 44px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper-3);
		color: var(--color-muted);
		padding: 0 15px;
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
