<script lang="ts">
	const careItems = [
		{ title: 'Feeding', text: 'Meal proof and notes', points: '+10' },
		{ title: 'Water', text: 'Fresh bowl or fountain', points: '+8' },
		{ title: 'Litter', text: 'Clean box check', points: '+12' },
		{ title: 'Play', text: 'Movement and enrichment', points: '+6' }
	];
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
			<h2>3 habits left</h2>
			<p>Complete routines, then upload photo proof from Home.</p>
		</div>
	</section>

	<section class="care-list" aria-label="Care tasks">
		{#each careItems as item (item.title)}
			<article class="care-item">
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
				<strong>{item.points}</strong>
			</article>
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
	.care-item {
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

	.care-item {
		display: grid;
		grid-template-columns: 46px 1fr auto;
		gap: 12px;
		align-items: center;
		border-radius: 24px;
		padding: 14px;
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
</style>
