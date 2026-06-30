<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<!-- Developer Mode technical appendix for security posture, traces, and scheduler config. -->

<svelte:head>
	<title>Purrward Dev Mode</title>
</svelte:head>

<div class="dev-mode-page">
	<section class="dev-hero card bg-butter/20">
		<div class="watercolor-splotch-bg watercolor-blob-butter"></div>
		<div class="dev-hero-content">
			<span class="dev-badge">Technical Appendix</span>
			<h2>Developer Mode</h2>
			<p>{data.verificationRows} photo verification events recorded in the care ledger.</p>
		</div>
	</section>

	<!-- Security Posture Checklist -->
	<section class="security-card card">
		<h3>Security Review Notes</h3>
		<p class="card-desc">Implementation evidence for the Cloudflare Worker boundary.</p>
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
			<span class="badge">Demo note</span>
			<h3>Security Scan Evidence</h3>
		</div>
		<div class="review-summary">
			<div>
				<h4>Real scan report not attached</h4>
				<p>
					This panel is a demo reminder. Attach real scan evidence before claiming scan results.
				</p>
			</div>
		</div>
	</section>

	<!-- Edge Trace Details -->
	<section class="trace-card card">
		<h3>Verification Workflow Trace</h3>
		<p class="card-desc">Step-by-step telemetry for photo care validations.</p>
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
		font-size: 0.82rem;
		color: var(--color-muted);
		line-height: 1.45;
		margin: 0;
	}

	h3 {
		font-size: 1.15rem;
		font-weight: 700;
		margin: 0 0 4px;
		color: var(--color-ink);
	}

	.card-desc {
		font-size: 0.78rem;
		color: var(--color-muted);
		margin: 0 0 16px;
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
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-muted);
		line-height: 1.35;
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
