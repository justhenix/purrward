<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	type TaskType = 'feeding' | 'water' | 'litter' | 'play' | 'grooming' | 'meds';

	let { data }: PageProps = $props();

	const careItems: {
		id: TaskType;
		title: string;
		text: string;
		proof: string;
		points: string;
	}[] = [
		{
			id: 'feeding',
			title: 'Feeding',
			text: 'Meal proof and notes',
			proof: 'Upload a bowl or meal photo after feeding.',
			points: '+10'
		},
		{
			id: 'water',
			title: 'Water',
			text: 'Fresh bowl or fountain',
			proof: 'Show fresh water in the bowl or fountain.',
			points: '+10'
		},
		{
			id: 'litter',
			title: 'Litter',
			text: 'Clean box check',
			proof: 'Show a cleaned litter box area.',
			points: '+10'
		},
		{
			id: 'play',
			title: 'Play',
			text: 'Movement and enrichment',
			proof: 'Show a toy or enrichment moment.',
			points: '+10'
		},
		{
			id: 'grooming',
			title: 'Grooming',
			text: 'Gentle brush care',
			proof: 'Show brush care or grooming tools.',
			points: '+10'
		},
		{
			id: 'meds',
			title: 'Medication',
			text: 'Medicine or supplement log',
			proof: 'Show medication care setup, never private vet paperwork.',
			points: '+10'
		}
	];

	let selectedTask = $state<TaskType>('feeding');
	let completed = $derived(new Set(data.completedTasks));
	let selectedItem = $derived(careItems.find((item) => item.id === selectedTask) ?? careItems[0]);
	let completedCount = $derived(careItems.filter((item) => completed.has(item.id)).length);
</script>

<!-- Care task list screen for daily routines. -->

<svelte:head>
	<title>Purrward | Care</title>
</svelte:head>

<div class="care-screen">
	<header class="care-header">
		<p>Daily routines</p>
		<h1>Care</h1>
	</header>

	<section class="care-hero">
		<div>
			<span>Today</span>
			<h2>{completedCount} of {careItems.length} routines verified</h2>
			<p>
				{data.user
					? 'Choose a routine, then upload proof from Home.'
					: 'Sign in to save verified care.'}
			</p>
		</div>
	</section>

	<section class="care-detail" aria-labelledby="care-detail-title">
		<div>
			<span>{completed.has(selectedItem.id) ? 'Verified today' : 'Proof needed'}</span>
			<h2 id="care-detail-title">{selectedItem.title}</h2>
			<p>{selectedItem.proof}</p>
		</div>
		<a href={resolve(`/?task=${selectedItem.id}`)}>
			{completed.has(selectedItem.id) ? 'Upload again' : 'Upload proof'}
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
					<svg viewBox="0 0 24 24">
						<path d="M7 12h10" />
						<path d="m10 15 2 2 4-5" />
						<circle cx="12" cy="12" r="9" />
					</svg>
				</div>
				<div>
					<h2>{item.title}</h2>
					<p>{item.text}</p>
				</div>
				<strong>{completed.has(item.id) ? 'Done' : item.points}</strong>
			</button>
		{/each}
	</section>
</div>

<style>
	.care-screen {
		display: grid;
		gap: 18px;
	}

	.care-header p,
	.care-hero span,
	.care-hero p,
	.care-item p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.86rem;
		font-weight: 600;
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
			radial-gradient(circle at 92% 10%, rgba(169, 217, 232, 0.24), transparent 32%),
			radial-gradient(circle at 8% 88%, rgba(244, 191, 168, 0.22), transparent 34%),
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
		margin: 0;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 600;
		line-height: 1.35;
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
		border-color: rgba(36, 38, 38, 0.22);
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

	.care-icon svg {
		width: 22px;
		height: 22px;
		fill: none;
		stroke: var(--color-charcoal);
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 2;
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
