<!-- Help: short tips for using Purrward. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
</script>

<svelte:head>
	<title>Purrward | Help</title>
</svelte:head>

<div class="help-screen">
	<header class="help-header">
		<a class="back-button" href={resolve('/profile')} aria-label="Back to profile">
			<ChevronLeft size={22} strokeWidth={2.3} aria-hidden="true" />
		</a>
		<h1>Help</h1>
	</header>

	<ul class="tips">
		<li>
			<strong>Log care</strong>
			<span>Tap the camera and snap a photo.</span>
		</li>
		<li>
			<strong>Earn Purrpoints</strong>
			<span>Each verified photo adds points.</span>
		</li>
		<li>
			<strong>Switch cats</strong>
			<span>Use the cat switcher on Home.</span>
		</li>
		<li>
			<strong>Ask the vet</strong>
			<span>Open Vet for quick triage.</span>
		</li>
	</ul>
</div>

<style>
	.help-screen {
		display: grid;
		gap: 16px;
	}

	.help-header {
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

	.help-header h1 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.5rem;
	}

	.tips {
		display: grid;
		gap: 10px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.tips li {
		display: grid;
		gap: 3px;
		border: 1px solid var(--color-line);
		border-radius: 22px;
		background: var(--color-paper-2);
		padding: 14px 16px;
		box-shadow: var(--shadow-card);
	}

	.tips strong {
		color: var(--color-ink);
		font-size: 0.95rem;
		font-weight: 800;
	}

	.tips span {
		color: var(--color-muted);
		font-size: 0.84rem;
		font-weight: 600;
	}
</style>
