<!-- Developer submenu: hidden test tools unlocked from the Profile header logo. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let sandboxMode = $derived(data.preferences.sandboxMode);

	function savePreference(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		input.form?.requestSubmit();
	}
</script>

<svelte:head>
	<title>Purrward | Developer</title>
</svelte:head>

<div class="developer-screen">
	<header class="developer-header">
		<a class="back-button" href={resolve('/profile')} aria-label="Back to profile">
			<ChevronLeft size={22} strokeWidth={2.3} aria-hidden="true" />
		</a>
		<h1>Developer</h1>
	</header>

	<form method="POST" action="?/sandbox" class="panel">
		<label class="toggle-row">
			<span class="row-copy">
				<strong>Sandbox mode</strong>
				<small>Test mode.</small>
			</span>
			<input
				name="sandboxMode"
				type="checkbox"
				bind:checked={sandboxMode}
				onchange={savePreference}
				aria-label="Sandbox mode"
			/>
		</label>
	</form>

	<section class="panel stack">
		<span class="row-copy">
			<strong>Sandbox panel</strong>
			<small>Security checks and traces</small>
		</span>
		{#if sandboxMode}
			<a class="link-row" href={resolve('/dev')}>
				<span>Open panel</span>
				<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
			</a>
		{:else}
			<p class="hint">Turn on Sandbox mode first.</p>
		{/if}
	</section>

	<form method="POST" action="?/reset" class="panel stack">
		<span class="row-copy">
			<strong>Demo data</strong>
			<small>Reset test care state</small>
		</span>
		<button class="reset-button" type="submit">Reset sandbox</button>
		{#if form?.reset}
			<p class="ok">Sandbox care state cleared.</p>
		{/if}
	</form>
</div>

<style>
	.developer-screen {
		display: grid;
		gap: 16px;
	}

	.developer-header {
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

	.developer-header h1 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.5rem;
	}

	.panel {
		border: 1px solid var(--color-line);
		border-radius: 24px;
		background: var(--color-paper-2);
		box-shadow: var(--shadow-card);
	}

	.panel.stack {
		display: grid;
		gap: 12px;
		padding: 16px;
	}

	.toggle-row {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 12px;
		padding: 16px;
		cursor: pointer;
	}

	.row-copy {
		min-width: 0;
	}

	.row-copy strong {
		display: block;
		margin-bottom: 2px;
		color: var(--color-ink);
		font-size: 0.95rem;
	}

	.row-copy small {
		display: block;
		color: var(--color-muted);
		font-size: 0.8rem;
		font-weight: 650;
	}

	.link-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border: 1px solid var(--color-line);
		border-radius: 16px;
		background: var(--color-paper);
		color: var(--color-charcoal);
		padding: 12px 14px;
		font-size: 0.9rem;
		font-weight: 800;
		text-decoration: none;
	}

	.hint {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.reset-button {
		justify-self: start;
		min-height: 44px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper);
		color: var(--color-charcoal);
		padding: 0 20px;
		font-size: 0.88rem;
		font-weight: 850;
		cursor: pointer;
	}

	.ok {
		margin: 0;
		color: var(--color-success-text);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.toggle-row input {
		appearance: none;
		position: relative;
		width: 48px;
		height: 30px;
		border: 1px solid color-mix(in srgb, var(--color-charcoal) 14%, transparent);
		border-radius: var(--radius-pill);
		background: var(--color-paper-3);
		cursor: pointer;
		transition: background 140ms ease;
	}

	.toggle-row input::after {
		content: '';
		position: absolute;
		top: 4px;
		left: 4px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-paper-2);
		box-shadow: 0 2px 8px color-mix(in srgb, var(--color-charcoal) 18%, transparent);
		transition: transform 140ms ease;
	}

	.toggle-row input:checked {
		background: var(--color-charcoal);
	}

	.toggle-row input:checked::after {
		transform: translateX(18px);
	}
</style>
