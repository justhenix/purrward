<script lang="ts">
	import { resolve } from '$app/paths';
	import Brush from '@lucide/svelte/icons/brush';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Droplet from '@lucide/svelte/icons/droplet';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import Pill from '@lucide/svelte/icons/pill';
	import Toilet from '@lucide/svelte/icons/toilet';
	import Utensils from '@lucide/svelte/icons/utensils';
	import HeartHandshake from '@lucide/svelte/icons/heart-handshake';
	import House from '@lucide/svelte/icons/house';
	import { habitSetFor, type TaskType } from '$lib/tasks';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const allCareItems: {
		id: TaskType;
		title: string;
		text: string;
		proof: string;
		points: string;
	}[] = [
		{
			id: 'feeding',
			title: 'Feeding',
			text: 'Meal proof',
			proof: 'Show meal bowl.',
			points: '+10'
		},
		{
			id: 'water',
			title: 'Water',
			text: 'Fresh water',
			proof: 'Show fresh water.',
			points: '+10'
		},
		{
			id: 'litter',
			title: 'Litter',
			text: 'Clean box check',
			proof: 'Show clean litter.',
			points: '+10'
		},
		{
			id: 'play',
			title: 'Play',
			text: 'Toy time',
			proof: 'Show toy time.',
			points: '+10'
		},
		{
			id: 'grooming',
			title: 'Grooming',
			text: 'Brush care',
			proof: 'Show brush tools.',
			points: '+10'
		},
		{
			id: 'meds',
			title: 'Medication',
			text: 'Meds setup',
			proof: 'Show meds setup.',
			points: '+10'
		},
		{
			id: 'street_feeding',
			title: 'Street Feeding',
			text: 'Community meal',
			proof: 'Show street feeding.',
			points: '+10'
		},
		{
			id: 'shelter_care',
			title: 'Shelter Care',
			text: 'Outdoor shelter',
			proof: 'Show shelter care.',
			points: '+10'
		}
	];

	let habitSet = $derived(habitSetFor(data.activeCat?.careMode ?? 'owned'));
	let careItems = $derived(allCareItems.filter((item) => habitSet.includes(item.id)));
	let selectedTask = $state<TaskType>('feeding');
	let completed = $derived(new Set(data.completedTasks));
	let selectedItem = $derived(careItems.find((item) => item.id === selectedTask) ?? careItems[0]);
	let completedCount = $derived(careItems.filter((item) => completed.has(item.id)).length);
	let sandboxReward = $derived(data.preferences.sandboxMode ? '+1000' : null);
</script>

<!-- Care task list screen for daily routines. -->

{#snippet careIcon(taskId: TaskType)}
	{#if taskId === 'feeding'}
		<Utensils size={22} strokeWidth={2.25} aria-hidden="true" />
	{:else if taskId === 'water'}
		<Droplet size={22} strokeWidth={2.25} aria-hidden="true" />
	{:else if taskId === 'litter'}
		<Toilet size={22} strokeWidth={2.25} aria-hidden="true" />
	{:else if taskId === 'play'}
		<Gamepad2 size={22} strokeWidth={2.25} aria-hidden="true" />
	{:else if taskId === 'grooming'}
		<Brush size={22} strokeWidth={2.25} aria-hidden="true" />
	{:else if taskId === 'meds'}
		<Pill size={22} strokeWidth={2.25} aria-hidden="true" />
	{:else if taskId === 'street_feeding'}
		<HeartHandshake size={22} strokeWidth={2.25} aria-hidden="true" />
	{:else}
		<House size={22} strokeWidth={2.25} aria-hidden="true" />
	{/if}
{/snippet}

<svelte:head>
	<title>Purrward | Care</title>
</svelte:head>

<div class="care-screen">
	<header class="care-header">
		<a class="back-button" href={resolve('/')} aria-label="Back to home">
			<ChevronLeft size={22} strokeWidth={2.3} aria-hidden="true" />
		</a>
		<div>
			<p>Daily routines</p>
			<h1>Care</h1>
		</div>
	</header>

	<section class="care-hero">
		<div>
			<span>Today</span>
			<h2>{completedCount} of {careItems.length} verified</h2>
			<p>
				{data.user ? 'Tap a routine below, then add proof.' : 'Sign in to save care.'}
			</p>
		</div>
	</section>

	<section class="care-detail" aria-labelledby="care-detail-title">
		<div>
			<span>{completed.has(selectedItem.id) ? 'Verified today' : 'Proof needed'}</span>
			<h2 id="care-detail-title">{selectedItem.title}</h2>
			<p>{selectedItem.proof}</p>
		</div>
		<a href={resolve(`/care-proof?task=${selectedItem.id}`)}>
			{completed.has(selectedItem.id) ? 'Retake proof' : 'Open camera'}
		</a>
	</section>

	<section class="care-list" aria-label="Care tasks">
		{#each careItems as item (item.title)}
			<button
				class="care-item"
				class:selected={selectedTask === item.id}
				type="button"
				onclick={() => (selectedTask = item.id)}
			>
				<div class="care-icon" aria-hidden="true">
					{@render careIcon(item.id)}
				</div>
				<div>
					<h2>{item.title}</h2>
					<p>{item.text}</p>
				</div>
				<strong>{completed.has(item.id) ? 'Done' : (sandboxReward ?? item.points)}</strong>
			</button>
		{/each}
	</section>
</div>

<style>
	.care-screen {
		display: grid;
		gap: 18px;
	}

	.care-header {
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

	.care-header p,
	.care-hero span,
	.care-hero p,
	.care-item p {
		overflow: hidden;
		margin: 0;
		color: var(--color-muted);
		font-size: 0.86rem;
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.care-header h1,
	.care-hero h2,
	.care-item h2 {
		margin: 0;
		color: var(--color-ink);
	}

	.care-header h1 {
		font-size: 1.56rem;
	}

	.care-hero,
	.care-item,
	.care-detail {
		border: 1px solid var(--color-line);
		background: var(--color-paper-2);
		box-shadow: var(--shadow-card);
	}

	.care-hero {
		border-radius: 32px;
		padding: 22px;
		background:
			radial-gradient(
				circle at 92% 10%,
				color-mix(in srgb, var(--color-sky) 24%, transparent),
				transparent 32%
			),
			radial-gradient(
				circle at 8% 88%,
				color-mix(in srgb, var(--color-peach) 22%, transparent),
				transparent 34%
			),
			var(--color-paper-2);
	}

	.care-hero h2 {
		margin: 8px 0 6px;
		font-size: 1.42rem;
	}

	.care-list {
		display: grid;
		gap: 10px;
	}

	.care-detail {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 14px;
		align-items: center;
		border-radius: 28px;
		padding: 18px;
	}

	.care-detail span {
		color: var(--color-success-text);
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.care-detail h2 {
		margin: 5px 0;
		font-size: 1.18rem;
	}

	.care-detail p {
		overflow: hidden;
		margin: 0;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 600;
		line-height: 1.35;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.care-detail a {
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		padding: 10px 14px;
		font-size: 0.78rem;
		font-weight: 800;
		text-decoration: none;
		white-space: nowrap;
	}

	.care-item {
		display: grid;
		grid-template-columns: 46px 1fr auto;
		gap: 12px;
		align-items: center;
		border-radius: 24px;
		padding: 14px;
		color: inherit;
		cursor: pointer;
		text-align: left;
	}

	.care-item.selected {
		border-color: color-mix(in srgb, var(--color-charcoal) 22%, transparent);
		background: var(--color-paper);
	}

	.care-icon {
		display: grid;
		width: 46px;
		height: 46px;
		place-items: center;
		border-radius: 17px;
		background: var(--color-sage-soft);
	}

	.care-icon :global(svg) {
		display: block;
		color: var(--color-charcoal);
	}

	.care-item h2 {
		font-size: 0.98rem;
	}

	.care-item strong {
		border-radius: var(--radius-pill);
		background: var(--color-paper-3);
		padding: 6px 10px;
		color: var(--color-charcoal);
		font-size: 0.78rem;
	}

	@media (max-width: 390px) {
		.care-detail {
			grid-template-columns: 1fr;
		}

		.care-detail a {
			text-align: center;
		}
	}
</style>
