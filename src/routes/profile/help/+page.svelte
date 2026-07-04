<!-- Help center: searchable guides, FAQ accordion, and support links. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Search from '@lucide/svelte/icons/search';

	const popular = [
		{ title: 'How care works', text: 'Pick a routine, add proof, earn points.' },
		{ title: 'Photo check', text: 'Photos verify real care.' },
		{ title: 'Purrpoints', text: 'Earn points from healthy routines.' },
		{ title: 'Community cats', text: 'Track care for cats around you.' }
	];

	const faq = [
		{ q: 'Why do I need photo proof?', a: 'It helps confirm real care.' },
		{ q: 'Can I care for more than one cat?', a: 'Yes. Add cats from My cats.' },
		{ q: 'Can I track community cats?', a: 'Yes. Choose Community cats when adding a cat.' },
		{ q: 'Why are rewards locked?', a: 'Sign in and earn enough Purrpoints.' },
		{ q: 'Is this vet care?', a: 'No. Use a vet for urgent problems.' }
	];

	const support = [
		{
			kind: 'vet' as const,
			title: 'Ask AI care helper',
			text: 'For cat care questions.',
			action: 'Open Vet'
		},
		{
			kind: 'mail' as const,
			title: 'Contact support',
			text: 'For account or app issues.',
			action: 'Email support'
		}
	];

	let query = $state('');
	let q = $derived(query.trim().toLowerCase());

	function matches(text: string): boolean {
		return q === '' || text.toLowerCase().includes(q);
	}

	let popularVisible = $derived(popular.filter((item) => matches(`${item.title} ${item.text}`)));
	let faqVisible = $derived(faq.filter((item) => matches(`${item.q} ${item.a}`)));
	let supportVisible = $derived(support.filter((item) => matches(`${item.title} ${item.text}`)));
	let hasResults = $derived(popularVisible.length + faqVisible.length + supportVisible.length > 0);
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

	<label class="search">
		<Search size={17} strokeWidth={2.3} aria-hidden="true" />
		<input bind:value={query} placeholder="Search help" autocomplete="off" />
	</label>

	{#if !hasResults}
		<section class="empty">
			<strong>No help found.</strong>
			<span>Try another word.</span>
		</section>
	{:else}
		{#if popularVisible.length > 0}
			<h2 class="section-label">Popular help</h2>
			<div class="cards">
				{#each popularVisible as item (item.title)}
					<article class="help-card">
						<strong>{item.title}</strong>
						<p>{item.text}</p>
					</article>
				{/each}
			</div>
		{/if}

		{#if faqVisible.length > 0}
			<h2 class="section-label">FAQ</h2>
			<div class="faq">
				{#each faqVisible as item (item.q)}
					<details class="faq-item">
						<summary>{item.q}</summary>
						<p>{item.a}</p>
					</details>
				{/each}
			</div>
		{/if}

		{#if supportVisible.length > 0}
			<h2 class="section-label">Ask support</h2>
			<div class="cards">
				{#each supportVisible as item (item.title)}
					<article class="help-card support">
						<strong>{item.title}</strong>
						<p>{item.text}</p>
						{#if item.kind === 'vet'}
							<a class="support-link" href={resolve('/vet')}>{item.action}</a>
						{:else}
							<a class="support-link" href="mailto:support@purrward.app">{item.action}</a>
						{/if}
					</article>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.help-screen {
		display: grid;
		gap: 14px;
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

	.search {
		display: flex;
		align-items: center;
		gap: 10px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper-2);
		padding: 0 16px;
		color: var(--color-muted);
	}

	.search input {
		flex: 1;
		border: 0;
		background: transparent;
		color: var(--color-ink);
		padding: 12px 0;
		font: inherit;
		font-size: 0.92rem;
	}

	.search input:focus {
		outline: none;
	}

	.section-label {
		margin: 6px 0 -4px 4px;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.cards {
		display: grid;
		gap: 10px;
	}

	.help-card {
		display: grid;
		gap: 4px;
		border: 1px solid var(--color-line);
		border-radius: 20px;
		background: var(--color-paper-2);
		padding: 15px 16px;
		box-shadow: var(--shadow-card);
	}

	.help-card strong {
		color: var(--color-ink);
		font-size: 0.96rem;
	}

	.help-card p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.84rem;
		font-weight: 600;
		line-height: 1.4;
	}

	.help-card.support {
		gap: 10px;
	}

	.support-link {
		justify-self: start;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		padding: 9px 16px;
		font-size: 0.82rem;
		font-weight: 850;
		text-decoration: none;
	}

	.faq {
		display: grid;
		gap: 8px;
	}

	.faq-item {
		border: 1px solid var(--color-line);
		border-radius: 18px;
		background: var(--color-paper-2);
		padding: 4px 16px;
		box-shadow: var(--shadow-card);
	}

	.faq-item summary {
		padding: 12px 0;
		color: var(--color-ink);
		font-size: 0.9rem;
		font-weight: 800;
		cursor: pointer;
		list-style: none;
	}

	.faq-item summary::-webkit-details-marker {
		display: none;
	}

	.faq-item p {
		margin: 0;
		padding: 0 0 12px;
		color: var(--color-muted);
		font-size: 0.84rem;
		font-weight: 600;
		line-height: 1.4;
	}

	.empty {
		display: grid;
		gap: 4px;
		justify-items: center;
		border: 1px solid var(--color-line);
		border-radius: 20px;
		background: var(--color-paper-2);
		padding: 30px 18px;
		text-align: center;
		box-shadow: var(--shadow-card);
	}

	.empty strong {
		color: var(--color-ink);
		font-size: 0.96rem;
	}

	.empty span {
		color: var(--color-muted);
		font-size: 0.84rem;
		font-weight: 650;
	}
</style>
