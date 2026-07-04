<!-- Terms of use: short plain-language rules for using Purrward. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';

	const sections = [
		{ title: 'Use Purrward honestly', text: 'Log real care only.' },
		{
			title: 'Vet guidance',
			text: 'Purrward is not emergency care. Contact a vet for urgent problems.'
		},
		{ title: 'Rewards', text: 'Rewards depend on points, availability, and account status.' },
		{ title: 'Community cats', text: 'Only log care you actually gave.' },
		{ title: 'Account safety', text: 'Do not misuse uploads, rewards, or test tools.' }
	];
</script>

<svelte:head>
	<title>Purrward | Terms of use</title>
</svelte:head>

<div class="legal-screen">
	<header class="legal-header">
		<a class="back-button" href={resolve('/profile/privacy')} aria-label="Back to privacy">
			<ChevronLeft size={22} strokeWidth={2.3} aria-hidden="true" />
		</a>
		<h1>Terms of use</h1>
	</header>

	{#each sections as section (section.title)}
		<section class="panel">
			<h2>{section.title}</h2>
			<p>{section.text}</p>
		</section>
	{/each}
</div>

<style>
	.legal-screen {
		display: grid;
		gap: 14px;
	}

	.legal-header {
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

	.legal-header h1 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.5rem;
	}

	.panel {
		display: grid;
		gap: 6px;
		border: 1px solid var(--color-line);
		border-radius: 24px;
		background: var(--color-paper-2);
		padding: 16px 18px;
		box-shadow: var(--shadow-card);
	}

	.panel h2 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.02rem;
	}

	.panel p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.88rem;
		font-weight: 600;
		line-height: 1.45;
	}
</style>
