<!-- Privacy: data use, photo proof steps, cookies, policy links, and account deletion. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ArchiveX from '@lucide/svelte/icons/archive-x';
	import Camera from '@lucide/svelte/icons/camera';
	import Cat from '@lucide/svelte/icons/cat';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Cookie from '@lucide/svelte/icons/cookie';
	import FileText from '@lucide/svelte/icons/file-text';
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import Gift from '@lucide/svelte/icons/gift';
	import Lock from '@lucide/svelte/icons/lock';
	import Shield from '@lucide/svelte/icons/shield';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Smartphone from '@lucide/svelte/icons/smartphone';
	import UserRound from '@lucide/svelte/icons/user-round';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let deleteOpen = $state(false);
	let deleteConfirm = $state('');

	const dataRows = [
		{ icon: UserRound, title: 'Account', text: 'Name, email, and sign-in.' },
		{ icon: Cat, title: 'Cats', text: 'Cat profiles and care history.' },
		{ icon: Gift, title: 'Rewards', text: 'Purrpoints and redemptions.' },
		{
			icon: SlidersHorizontal,
			title: 'Preferences',
			text: 'Reminders, avatar choice, and test tools.'
		}
	];

	const steps = [
		{ icon: Camera, title: 'Upload', text: 'You add a care photo.' },
		{ icon: ShieldCheck, title: 'Check', text: 'AI checks the care task.' },
		{ icon: ArchiveX, title: 'Drop', text: 'Photo is not kept after checking.' }
	];

	const cookieRows = [
		{ icon: Lock, title: 'Session cookie', text: 'Keeps you signed in.' },
		{ icon: SlidersHorizontal, title: 'Preferences', text: 'Saves app choices.' },
		{ icon: FlaskConical, title: 'Sandbox data', text: 'Used for test mode only.' },
		{ icon: Smartphone, title: 'Device storage', text: 'May save local display choices.' }
	];

	const policies = [
		{
			icon: Shield,
			title: 'Privacy policy',
			text: 'How data is handled.',
			href: resolve('/profile/privacy/policy')
		},
		{
			icon: FileText,
			title: 'Terms of use',
			text: 'Rules for using Purrward.',
			href: resolve('/profile/privacy/terms')
		},
		{
			icon: Cookie,
			title: 'Cookie notice',
			text: 'Cookies and local storage.',
			href: resolve('/profile/privacy/cookies')
		}
	];
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

	<section class="intro-card">
		<h2>Your privacy</h2>
		<p>Purrward keeps care data simple and cat-focused.</p>
		<div class="chips">
			<span class="chip">Simple data</span>
			<span class="chip">Photo checks</span>
			<span class="chip">Account control</span>
		</div>
	</section>

	<section class="panel">
		<h2>Data Purrward uses</h2>
		<ul class="icon-rows">
			{#each dataRows as row (row.title)}
				<li class="icon-row">
					<span class="row-icon"><row.icon size={19} strokeWidth={2.1} aria-hidden="true" /></span>
					<span class="row-copy">
						<strong>{row.title}</strong>
						<small>{row.text}</small>
					</span>
				</li>
			{/each}
		</ul>
	</section>

	<section class="panel">
		<h2>Photo proof</h2>
		<ol class="steps">
			{#each steps as step, index (step.title)}
				<li class="step">
					<span class="step-icon"><step.icon size={19} strokeWidth={2.1} aria-hidden="true" /></span
					>
					<span class="step-copy">
						<strong>{step.title}</strong>
						<small>{step.text}</small>
					</span>
					{#if index < steps.length - 1}
						<span class="step-line" aria-hidden="true"></span>
					{/if}
				</li>
			{/each}
		</ol>
		<p class="note">Proof results may stay in care history.</p>
	</section>

	<section class="panel">
		<h2>Cookies and local data</h2>
		<ul class="icon-rows">
			{#each cookieRows as row (row.title)}
				<li class="icon-row">
					<span class="row-icon"><row.icon size={19} strokeWidth={2.1} aria-hidden="true" /></span>
					<span class="row-copy">
						<strong>{row.title}</strong>
						<small>{row.text}</small>
					</span>
				</li>
			{/each}
		</ul>
	</section>

	<section class="panel">
		<h2>Policies</h2>
		<nav class="policy-rows" aria-label="Policies">
			{#each policies as row (row.title)}
				<a class="policy-row" href={row.href}>
					<span class="row-icon"><row.icon size={19} strokeWidth={2.1} aria-hidden="true" /></span>
					<span class="row-copy">
						<strong>{row.title}</strong>
						<small>{row.text}</small>
					</span>
					<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
				</a>
			{/each}
		</nav>
	</section>

	<section class="danger-zone">
		<div class="panel-heading">
			<h2>Account control</h2>
			<p>Delete your account and care data.</p>
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

	.intro-card {
		display: grid;
		gap: 10px;
		border: 1px solid var(--color-line);
		border-radius: 28px;
		background:
			radial-gradient(
				circle at 82% 8%,
				color-mix(in srgb, var(--color-sage-soft) 60%, transparent),
				transparent 46%
			),
			radial-gradient(
				circle at 8% 90%,
				color-mix(in srgb, var(--color-peach-soft) 46%, transparent),
				transparent 44%
			),
			var(--color-paper-2);
		padding: 18px;
		box-shadow: var(--shadow-card);
	}

	.intro-card h2 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.2rem;
	}

	.intro-card p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.88rem;
		font-weight: 600;
		line-height: 1.4;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
		margin-top: 2px;
	}

	.chip {
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper);
		color: var(--color-charcoal);
		padding: 6px 12px;
		font-size: 0.74rem;
		font-weight: 800;
	}

	.panel {
		display: grid;
		gap: 14px;
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

	.icon-rows {
		display: grid;
		gap: 14px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.icon-row {
		display: grid;
		grid-template-columns: 42px 1fr;
		align-items: center;
		gap: 12px;
	}

	.row-icon {
		display: grid;
		width: 42px;
		height: 42px;
		place-items: center;
		border-radius: 14px;
		background: var(--color-paper-3);
		color: var(--color-charcoal);
	}

	.row-copy {
		min-width: 0;
	}

	.row-copy strong {
		display: block;
		margin-bottom: 1px;
		color: var(--color-ink);
		font-size: 0.92rem;
	}

	.row-copy small {
		display: block;
		color: var(--color-muted);
		font-size: 0.8rem;
		font-weight: 600;
	}

	.steps {
		display: grid;
		gap: 0;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.step {
		position: relative;
		display: grid;
		grid-template-columns: 42px 1fr;
		align-items: center;
		gap: 12px;
		padding-bottom: 16px;
	}

	.step:last-child {
		padding-bottom: 0;
	}

	.step-icon {
		display: grid;
		width: 42px;
		height: 42px;
		place-items: center;
		border-radius: 50%;
		background: var(--color-sage-soft);
		color: var(--color-success-text);
	}

	.step-copy strong {
		display: block;
		margin-bottom: 1px;
		color: var(--color-ink);
		font-size: 0.92rem;
	}

	.step-copy small {
		display: block;
		color: var(--color-muted);
		font-size: 0.8rem;
		font-weight: 600;
	}

	.step-line {
		position: absolute;
		top: 42px;
		left: 20px;
		bottom: 4px;
		width: 2px;
		background: var(--color-line);
	}

	.note {
		margin: 0;
		border-radius: 14px;
		background: var(--color-paper-3);
		color: var(--color-muted);
		padding: 10px 12px;
		font-size: 0.8rem;
		font-weight: 700;
	}

	.policy-rows {
		display: grid;
		gap: 10px;
	}

	.policy-row {
		display: grid;
		grid-template-columns: 42px 1fr auto;
		align-items: center;
		gap: 12px;
		border: 1px solid var(--color-line);
		border-radius: 18px;
		background: var(--color-paper);
		color: var(--color-charcoal);
		padding: 12px 14px;
		text-decoration: none;
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
