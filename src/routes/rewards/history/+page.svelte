<!-- Reward history / claimed coupons view with a use/trade action. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import Ticket from '@lucide/svelte/icons/ticket';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Row = (typeof data.redemptions)[number];

	type TradeBody = {
		ok?: boolean;
		status?: string;
		error?: string;
	};

	// Local working copy so a successful trade can optimistically flip a row to `used`.
	// svelte-ignore state_referenced_locally
	let rows = $state<Row[]>(data.redemptions.map((row) => ({ ...row })));

	// Partner-picker state: which redemption is being traded, the chosen partner, and status.
	let pickerFor = $state<string | null>(null);
	let selectedPartner = $state('');
	let trading = $state(false);
	let errorText = $state('');

	let firstPartnerId = $derived(data.partners[0]?.id ?? '');

	function openPicker(redemptionId: string) {
		pickerFor = redemptionId;
		selectedPartner = firstPartnerId;
		errorText = '';
	}

	function closePicker() {
		pickerFor = null;
		errorText = '';
	}

	async function trade(redemptionId: string) {
		if (trading) return;
		if (!selectedPartner) {
			errorText = 'Pick a partner to trade at.';
			return;
		}

		trading = true;
		errorText = '';

		const formData = new FormData();
		formData.set('redemptionId', redemptionId);
		formData.set('partnerId', selectedPartner);

		const response = await fetch('/api/rewards/trade', { method: 'POST', body: formData });
		const body = (await response.json()) as TradeBody;

		if (response.ok && body.ok) {
			// Optimistically mark this coupon used so the list reflects the trade right away.
			rows = rows.map((row) =>
				row.id === redemptionId
					? { ...row, status: 'used', partnerId: selectedPartner, usedAt: Date.now() }
					: row
			);
			pickerFor = null;
		} else {
			errorText = body.error ?? 'Could not trade this coupon. Try again.';
		}

		trading = false;
	}

	function partnerName(partnerId: string | null): string {
		if (!partnerId) return '';
		return data.partners.find((partner) => partner.id === partnerId)?.name ?? '';
	}
</script>

<svelte:head>
	<title>My Coupons</title>
</svelte:head>

<div class="history-page">
	<header class="history-head">
		<p>Your claimed rewards</p>
		<h1>My coupons</h1>
	</header>

	{#if !data.authed}
		<div class="auth-blocker">
			<p>Sign in to see the coupons you've earned.</p>
			<a class="auth-btn" href={resolve('/auth/login')}>Sign in</a>
		</div>
	{:else if rows.length === 0}
		<div class="empty-state">
			<span class="empty-icon">
				<Ticket size={22} strokeWidth={2.2} aria-hidden="true" />
			</span>
			<h2>No coupons yet</h2>
			<p>Redeem rewards in the store and your coupons will land here, ready to use.</p>
			<a class="empty-link" href={resolve('/rewards')}>Browse rewards</a>
		</div>
	{:else}
		<section class="coupon-list" aria-label="Claimed coupons">
			{#each rows as row (row.id)}
				{@const isActive = row.status === 'active'}
				<article class={['coupon-card', isActive ? 'active' : 'used']}>
					<div class="coupon-main">
						<div class="coupon-info">
							<h2>{row.title}</h2>
							<span class="coupon-code">Code {row.code}</span>
							{#if !isActive && row.partnerId}
								<span class="coupon-partner">Used at {partnerName(row.partnerId)}</span>
							{/if}
						</div>
						<span class={['status-pill', isActive ? 'active' : 'used']}>
							{isActive ? 'Active' : 'Used'}
						</span>
					</div>

					{#if isActive}
						{#if pickerFor === row.id}
							<div class="picker">
								{#if data.partners.length === 0}
									<p class="picker-empty">No partners available to trade at right now.</p>
								{:else}
									<label class="picker-label" for={`partner-${row.id}`}>Trade at</label>
									<select
										id={`partner-${row.id}`}
										class="picker-select"
										bind:value={selectedPartner}
										disabled={trading}
									>
										{#each data.partners as partner (partner.id)}
											<option value={partner.id}>{partner.name}</option>
										{/each}
									</select>
								{/if}

								{#if errorText}
									<p class="picker-error">{errorText}</p>
								{/if}

								<div class="picker-actions">
									<button type="button" class="ghost-btn" onclick={closePicker} disabled={trading}>
										Cancel
									</button>
									<button
										type="button"
										class="primary-btn"
										onclick={() => trade(row.id)}
										disabled={trading || data.partners.length === 0}
									>
										{trading ? 'Trading' : 'Confirm trade'}
									</button>
								</div>
							</div>
						{:else}
							<button type="button" class="use-btn" onclick={() => openPicker(row.id)}>
								Use / Trade
							</button>
						{/if}
					{/if}
				</article>
			{/each}
		</section>
	{/if}
</div>

<style>
	.history-page {
		display: grid;
		gap: 16px;
	}

	.history-head p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 800;
	}

	.history-head h1 {
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
		background: var(--color-butter);
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

	.empty-link {
		margin-top: 6px;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		padding: 10px 18px;
		font-size: 0.82rem;
		font-weight: 850;
		text-decoration: none;
	}

	.coupon-list {
		display: grid;
		gap: 12px;
	}

	.coupon-card {
		display: grid;
		gap: 12px;
		border: 1px solid var(--color-line);
		border-radius: 24px;
		background: var(--color-paper-2);
		padding: 16px;
		box-shadow: var(--shadow-card);
	}

	.coupon-card.used {
		background: var(--color-paper-3);
	}

	.coupon-main {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	.coupon-info {
		display: grid;
		gap: 3px;
		min-width: 0;
	}

	.coupon-info h2 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1rem;
		font-weight: 800;
	}

	.coupon-card.used .coupon-info h2 {
		color: var(--color-muted);
	}

	.coupon-code {
		color: var(--color-charcoal);
		font-size: 0.82rem;
		font-weight: 850;
		letter-spacing: 0.04em;
	}

	.coupon-partner {
		color: var(--color-muted);
		font-size: 0.74rem;
		font-weight: 700;
	}

	.status-pill {
		flex: none;
		border-radius: var(--radius-pill);
		padding: 5px 12px;
		font-size: 0.72rem;
		font-weight: 850;
		white-space: nowrap;
	}

	.status-pill.active {
		background: var(--color-success-bg);
		color: var(--color-success-text);
	}

	.status-pill.used {
		background: var(--color-paper-3);
		color: var(--color-muted);
		border: 1px solid var(--color-line);
	}

	.use-btn {
		border: 0;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		padding: 10px 16px;
		font-size: 0.82rem;
		font-weight: 850;
		cursor: pointer;
		transition: transform 140ms ease;
	}

	.use-btn:active {
		transform: scale(0.98);
	}

	.picker {
		display: grid;
		gap: 8px;
		border-top: 1px solid var(--color-line);
		padding-top: 12px;
	}

	.picker-label {
		color: var(--color-muted);
		font-size: 0.76rem;
		font-weight: 800;
	}

	.picker-select {
		border: 1px solid var(--color-line);
		border-radius: 14px;
		background: var(--color-paper);
		color: var(--color-ink);
		padding: 10px 12px;
		font-family: inherit;
		font-size: 0.86rem;
		font-weight: 700;
	}

	.picker-empty {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.8rem;
		font-weight: 700;
	}

	.picker-error {
		margin: 0;
		border-radius: 14px;
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
		padding: 8px 12px;
		font-size: 0.78rem;
		font-weight: 700;
	}

	.picker-actions {
		display: flex;
		gap: 8px;
	}

	.ghost-btn {
		flex: 1;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper-2);
		color: var(--color-muted);
		padding: 10px 16px;
		font-size: 0.82rem;
		font-weight: 850;
		cursor: pointer;
	}

	.primary-btn {
		flex: 1;
		border: 0;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		padding: 10px 16px;
		font-size: 0.82rem;
		font-weight: 850;
		cursor: pointer;
		transition: transform 140ms ease;
	}

	.primary-btn:active {
		transform: scale(0.98);
	}

	.primary-btn:disabled,
	.ghost-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (prefers-reduced-motion: reduce) {
		.use-btn,
		.primary-btn {
			transition: none;
		}
	}
</style>
