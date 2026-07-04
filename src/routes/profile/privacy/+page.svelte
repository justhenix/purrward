<!-- Privacy: what stays on device and account deletion. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let deleteOpen = $state(false);
	let deleteConfirm = $state('');
</script>

<svelte:head>
	<title>Purrward | Privacy</title>
</svelte:head>

<div class="privacy-screen">
	<header class="privacy-header">
		<a class="back-button" href={resolve('/profile')} aria-label="Back to profile">
			<ChevronLeft size={22} strokeWidth={2.3} aria-hidden="true" />
		</a>
		<h1>Privacy</h1>
	</header>

	<section class="panel">
		<h2>Your data</h2>
		<p>Cat photos are checked, then dropped. Preferences stay here.</p>
	</section>

	<section class="danger-zone">
		<div class="panel-heading">
			<h2>Delete account</h2>
			<p>Removes your cats, care history, and sign-in.</p>
		</div>
		{#if !deleteOpen}
			<button class="danger-toggle" type="button" onclick={() => (deleteOpen = true)}>
				Delete my account
			</button>
		{:else}
			<form method="POST" action="?/deleteAccount" class="danger-form">
				<label class="field">
					<span>Type DELETE to confirm</span>
					<input
						name="confirm"
						bind:value={deleteConfirm}
						autocomplete="off"
						placeholder="DELETE"
					/>
				</label>
				{#if form?.deleteError}
					<p class="field-error">{form.message}</p>
				{/if}
				<div class="danger-actions">
					<button class="danger-cancel" type="button" onclick={() => (deleteOpen = false)}>
						Cancel
					</button>
					<button class="danger-confirm" type="submit" disabled={deleteConfirm !== 'DELETE'}>
						Delete forever
					</button>
				</div>
			</form>
		{/if}
	</section>
</div>

<style>
	.privacy-screen {
		display: grid;
		gap: 16px;
	}

	.privacy-header {
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

	.privacy-header h1 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.5rem;
	}

	.panel {
		display: grid;
		gap: 6px;
		border: 1px solid var(--color-line);
		border-radius: 28px;
		background: var(--color-paper-2);
		padding: 18px;
		box-shadow: var(--shadow-card);
	}

	.panel h2 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.14rem;
	}

	.panel p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.88rem;
		font-weight: 600;
		line-height: 1.4;
	}

	.danger-zone {
		display: grid;
		gap: 12px;
		border: 1px solid color-mix(in srgb, var(--color-danger-text) 22%, transparent);
		border-radius: 28px;
		background: var(--color-paper-2);
		padding: 18px;
		box-shadow: var(--shadow-card);
	}

	.panel-heading {
		display: grid;
		gap: 4px;
	}

	.panel-heading h2 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.14rem;
	}

	.panel-heading p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.84rem;
		font-weight: 700;
	}

	.danger-toggle,
	.danger-cancel,
	.danger-confirm {
		min-height: 48px;
		border-radius: var(--radius-pill);
		font: inherit;
		font-size: 0.9rem;
		font-weight: 850;
		cursor: pointer;
	}

	.danger-toggle {
		border: 1px solid color-mix(in srgb, var(--color-danger-text) 30%, transparent);
		background: var(--color-danger-bg);
		color: var(--color-danger-text);
	}

	.danger-form {
		display: grid;
		gap: 12px;
	}

	.danger-form .field {
		display: grid;
		gap: 6px;
	}

	.danger-form .field span {
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 800;
	}

	.danger-form input {
		border: 1px solid var(--color-line);
		border-radius: 14px;
		background: var(--color-paper);
		color: var(--color-ink);
		padding: 11px 13px;
		font: inherit;
	}

	.field-error {
		margin: 0;
		color: var(--color-danger-text);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.danger-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.danger-cancel {
		border: 1px solid var(--color-line);
		background: var(--color-paper);
		color: var(--color-charcoal);
	}

	.danger-confirm {
		border: 0;
		background: var(--color-danger-text);
		color: var(--color-paper-2);
	}

	.danger-confirm:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
