<!-- User help page: short in-app guide plus secondary developer docs link. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Code2 from '@lucide/svelte/icons/code-2';

	type HelpSection = {
		title: string;
		body: string;
		bullets?: string[];
		route?: '/' | '/cats' | '/care' | '/care-proof' | '/vet' | '/rewards' | '/profile/privacy';
		action?: string;
	};

	const sections: HelpSection[] = [
		{
			title: 'Getting started',
			body: 'Add your cat, choose a daily care task, then sign in when you want progress saved.',
			bullets: ['Use Guest mode for a quick try.', 'Open My cats to manage profiles.'],
			route: '/cats',
			action: 'Open cats'
		},
		{
			title: 'Earning Purrpoints',
			body: 'Purrpoints come from verified care. Feed, refill water, clean litter, play, groom, or log medicine.',
			bullets: ['Points appear after proof passes.', 'The app keeps point awards fair.'],
			route: '/care',
			action: 'Open care'
		},
		{
			title: 'Photo verification',
			body: 'Take a clear photo after care. If it fails, use better light and show the care result more clearly.',
			bullets: ['Jpeg, png, or webp work best.', 'Large or unclear images may be rejected.'],
			route: '/care-proof',
			action: 'Upload proof'
		},
		{
			title: 'Vet help',
			body: 'Ask about symptoms or behavior for quick triage guidance. It is not a diagnosis.',
			bullets: ['For emergency signs, contact a real vet now.', 'Vet visit booking is demo-only.'],
			route: '/vet',
			action: 'Open Vet'
		},
		{
			title: 'Rewards',
			body: 'Use Purrpoints for coupons, vet visit help, donations, cosmetics, or jar pulls.',
			bullets: ['Reward codes appear after redeeming.', 'Duplicate jar pulls give a small refund.'],
			route: '/rewards',
			action: 'Open rewards'
		},
		{
			title: 'Privacy',
			body: 'Sessions use secure cookies. Pet photos are checked for proof and are not kept as a gallery.',
			bullets: ['OAuth secrets stay server-side.', 'Guest mode stays local or demo-only.'],
			route: '/profile/privacy',
			action: 'Open privacy'
		}
	];
</script>

<svelte:head>
	<title>Purrward | Help</title>
</svelte:head>

<div class="help-screen">
	<header class="help-header">
		<a class="back-button" href={resolve('/profile')} aria-label="Back to profile">
			<ChevronLeft size={22} strokeWidth={2.3} aria-hidden="true" />
		</a>
		<div>
			<h1>Help</h1>
			<p>Quick guide for caring, earning, and using Purrward.</p>
		</div>
	</header>

	<section class="guide-card" aria-label="Quick help">
		{#each sections as section, index (section.title)}
			<details class="topic" open={index === 0}>
				<summary>
					<span>{section.title}</span>
					<ChevronDown size={17} strokeWidth={2.4} aria-hidden="true" />
				</summary>
				<div class="answer">
					<p>{section.body}</p>
					{#if section.bullets}
						<ul>
							{#each section.bullets as bullet (bullet)}
								<li>{bullet}</li>
							{/each}
						</ul>
					{/if}
					{#if section.route && section.action}
						<a href={resolve(section.route)}>{section.action}</a>
					{/if}
				</div>
			</details>
		{/each}
	</section>

	<a class="developer-card" href={resolve('/dev-docs')}>
		<span class="developer-icon" aria-hidden="true">
			<Code2 size={18} strokeWidth={2.3} />
		</span>
		<span>
			<strong>Developer docs</strong>
			<small>Setup, architecture, security notes, and local development.</small>
		</span>
	</a>
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

	.help-header p,
	.answer p,
	.answer li,
	.developer-card small {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.84rem;
		font-weight: 650;
		line-height: 1.42;
	}

	.guide-card {
		overflow: hidden;
		border: 1px solid var(--color-line);
		border-radius: 24px;
		background: var(--color-paper-2);
		box-shadow: var(--shadow-card);
	}

	.topic + .topic {
		border-top: 1px solid var(--color-line);
	}

	.topic summary {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 12px;
		padding: 14px 16px;
		color: var(--color-ink);
		font-size: 0.94rem;
		font-weight: 900;
		cursor: pointer;
		list-style: none;
	}

	.topic summary::-webkit-details-marker {
		display: none;
	}

	.topic summary :global(svg) {
		transition: transform 140ms ease;
	}

	.topic[open] summary :global(svg) {
		transform: rotate(180deg);
	}

	.answer {
		display: grid;
		gap: 10px;
		padding: 0 16px 15px;
	}

	.answer ul {
		display: grid;
		gap: 5px;
		margin: 0;
		padding-left: 18px;
	}

	.answer a {
		justify-self: start;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		padding: 8px 13px;
		font-size: 0.78rem;
		font-weight: 850;
		text-decoration: none;
	}

	.developer-card {
		display: grid;
		grid-template-columns: 42px 1fr;
		align-items: center;
		gap: 12px;
		border: 1px dashed var(--color-line);
		border-radius: 22px;
		background: var(--color-paper);
		color: var(--color-charcoal);
		padding: 13px 15px;
		text-decoration: none;
	}

	.developer-icon {
		display: grid;
		width: 42px;
		height: 42px;
		place-items: center;
		border-radius: 15px;
		background: var(--color-paper-3);
		color: var(--color-charcoal);
	}

	.developer-card strong {
		display: block;
		margin-bottom: 2px;
		color: var(--color-ink);
		font-size: 0.92rem;
		font-weight: 900;
	}
</style>
