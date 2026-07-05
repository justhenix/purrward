<script lang="ts">
	import { resolve } from '$app/paths';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<!-- Sandbox compatibility page for security posture and verification traces. -->

<svelte:head>
	<title>Purrward | Sandbox</title>
</svelte:head>

<div class="dev-mode-page">
	<header class="dev-header">
		<a
			class="back-button"
			href={resolve('/profile/developer')}
			aria-label="Back to developer tools"
		>
			<ChevronLeft size={22} strokeWidth={2.3} aria-hidden="true" />
		</a>
		<h1>Dev Mode</h1>
	</header>

	<section class="dev-hero card bg-butter/20">
		<div class="watercolor-splotch-bg watercolor-blob-butter"></div>
		<div class="dev-hero-content">
			<span class="dev-badge">Dev · Sandbox</span>
			<h2>Dev Mode · Technical Evidence</h2>
			<p>{data.verificationRows} verification events recorded.</p>
		</div>
	</section>

	<!-- Security Posture Checklist -->
	<section class="security-card card">
		<h3>Security checks</h3>
		<p class="card-desc">Self-reported worker-boundary checks (not third-party audited).</p>
		<div class="checklist">
			{#each data.securityChecklist as item (item.id)}
				<div class="checklist-item">
					<span class={['status-dot', item.ready ? 'evidence' : 'pending']}>
						{item.ready ? '✓' : '!'}
					</span>
					<span class="label-text">{item.label}</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- Demo-only security review note -->
	<section class="review-card card bg-sage-soft/30">
		<div class="review-header">
			<span class="badge">Mock evidence</span>
			<h3>Security Scan Evidence</h3>
		</div>
		<div class="review-summary">
			<div>
				<h4>Real scan report not attached</h4>
				<p>Demo reminder. Attach real scan evidence.</p>
			</div>
		</div>
	</section>

	<!-- Edge Trace Details -->
	<section class="trace-card card">
		<h3>Verification trace</h3>
		<p class="card-desc">Illustrative pipeline trace (sample steps).</p>
		<div class="trace-timeline">
			{#each data.traceLogs as log (log.step)}
				<div class="trace-step">
					<div class="step-marker"></div>
					<div class="step-content">
						<strong>{log.step}</strong>
						<p>{log.detail}</p>
						<span class="step-status">{log.status}</span>
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>

<style>
	.dev-mode-page {
		display: grid;
		gap: 20px;
	}

	.dev-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding-top: 4px;
	}

	.back-button {
		display: grid;
		width: 46px;
		height: 46px;
		flex: 0 0 auto;
		place-items: center;
		border: 1px solid var(--color-line);
		border-radius: 50%;
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		box-shadow: var(--shadow-card);
	}

	.dev-header h1 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.5rem;
	}

	.card {
		background: var(--color-paper-2);
		border: 1px solid var(--color-line);
		border-radius: var(--radius-card);
		box-shadow: var(--shadow-card);
		position: relative;
		overflow: hidden;
		padding: 20px;
	}

	.dev-hero {
		background: linear-gradient(135deg, var(--color-butter) -40%, var(--color-paper-2) 100%);
	}

	.dev-hero-content {
		position: relative;
		z-index: 2;
	}

	.dev-badge {
		display: inline-block;
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 4px 10px;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper);
		margin-bottom: 8px;
	}

	.dev-hero h2 {
		font-size: 1.45rem;
		font-weight: 700;
		color: var(--color-ink);
		margin: 0 0 6px;
	}

	.dev-hero p {
		overflow: hidden;
		font-size: 0.82rem;
		color: var(--color-muted);
		line-height: 1.45;
		margin: 0;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	h3 {
		font-size: 1.15rem;
		font-weight: 700;
		margin: 0 0 4px;
		color: var(--color-ink);
	}

	.card-desc {
		overflow: hidden;
		font-size: 0.78rem;
		color: var(--color-muted);
		margin: 0 0 16px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.checklist {
		display: grid;
		gap: 10px;
	}

	.checklist-item {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.status-dot {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-size: 0.75rem;
		font-weight: 700;
	}

	.status-dot.evidence {
		background: var(--color-sage-soft);
		color: var(--color-success-text);
	}

	.status-dot.pending {
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
	}

	.label-text {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--color-ink);
	}

	.review-card {
		padding: 20px;
	}

	.review-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 12px;
	}

	.badge {
		font-size: 0.62rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 3px 8px;
		border-radius: var(--radius-pill);
		background: var(--color-sage-soft);
		color: var(--color-success-text);
	}

	.review-summary {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.review-summary h4 {
		margin: 0 0 2px;
		font-size: 0.88rem;
		font-weight: 700;
		color: var(--color-ink);
	}

	.review-summary p {
		overflow: hidden;
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-muted);
		line-height: 1.35;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.trace-timeline {
		display: grid;
		gap: 16px;
		position: relative;
		padding-left: 14px;
		margin-top: 10px;
	}

	.trace-timeline::before {
		content: '';
		position: absolute;
		left: 4px;
		top: 4px;
		bottom: 4px;
		width: 1px;
		background: var(--color-line);
	}

	.trace-step {
		position: relative;
	}

	.step-marker {
		position: absolute;
		left: -14px;
		top: 5px;
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: var(--color-charcoal);
		border: 2px solid var(--color-paper-2);
	}

	.step-content strong {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-ink);
		display: block;
	}

	.step-content p {
		margin: 2px 0 4px;
		font-size: 0.72rem;
		color: var(--color-muted);
	}

	.step-status {
		display: inline-block;
		font-size: 0.65rem;
		font-weight: 700;
		background: var(--color-paper-3);
		padding: 2px 6px;
		border-radius: 4px;
		color: var(--color-ink);
	}
</style>
