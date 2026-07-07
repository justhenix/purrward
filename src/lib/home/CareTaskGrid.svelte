<!-- Compact 2-column care routine grid with progress and completion states. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import Brush from '@lucide/svelte/icons/brush';
	import Check from '@lucide/svelte/icons/check';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Droplet from '@lucide/svelte/icons/droplet';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import HeartHandshake from '@lucide/svelte/icons/heart-handshake';
	import House from '@lucide/svelte/icons/house';
	import Pill from '@lucide/svelte/icons/pill';
	import Toilet from '@lucide/svelte/icons/toilet';
	import Utensils from '@lucide/svelte/icons/utensils';
	import type { TaskType } from '$lib/tasks';

	type CareTask = { id: TaskType; label: string; tone: string };

	let {
		tasks,
		completed,
		activeId,
		doneCount,
		community = false
	}: {
		tasks: CareTask[];
		completed: Set<string>;
		activeId: TaskType;
		doneCount: number;
		community?: boolean;
	} = $props();
</script>

{#snippet taskIcon(taskId: TaskType)}
	{#if taskId === 'feeding'}
		<Utensils size={13} strokeWidth={2.5} aria-hidden="true" />
	{:else if taskId === 'water'}
		<Droplet size={13} strokeWidth={2.5} aria-hidden="true" />
	{:else if taskId === 'litter'}
		<Toilet size={13} strokeWidth={2.5} aria-hidden="true" />
	{:else if taskId === 'play'}
		<Gamepad2 size={13} strokeWidth={2.5} aria-hidden="true" />
	{:else if taskId === 'grooming'}
		<Brush size={13} strokeWidth={2.5} aria-hidden="true" />
	{:else if taskId === 'meds'}
		<Pill size={13} strokeWidth={2.5} aria-hidden="true" />
	{:else if taskId === 'street_feeding'}
		<HeartHandshake size={13} strokeWidth={2.5} aria-hidden="true" />
	{:else}
		<House size={13} strokeWidth={2.5} aria-hidden="true" />
	{/if}
{/snippet}

<section class="today" aria-labelledby="today-title">
	<div class="section-head">
		<div>
			<p>Care list</p>
			<h2 id="today-title">{doneCount} of {tasks.length} completed</h2>
		</div>
		<a href={resolve('/care')} aria-label="Open full care plan">
			See all <ChevronRight size={15} strokeWidth={2.3} aria-hidden="true" />
		</a>
	</div>

	<ul
		class={['markers', community && 'community']}
		aria-label={`${doneCount} of ${tasks.length} care tasks completed today`}
	>
		{#each tasks as task (task.id)}
			{@const isDone = completed.has(task.id)}
			<li
				class={['marker', task.tone, activeId === task.id && !isDone && 'active', isDone && 'done']}
				aria-label={isDone ? `${task.label} completed` : `${task.label} not completed yet`}
			>
				<span class="marker-icon">{@render taskIcon(task.id)}</span>
				<span>{task.label}</span>
				<span class="marker-check" aria-hidden="true">
					{#if isDone}
						<Check size={14} strokeWidth={3} />
					{/if}
				</span>
			</li>
		{/each}
	</ul>
</section>

<style>
	.today {
		display: grid;
		gap: 12px;
	}

	.section-head {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 12px;
	}

	.section-head p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 800;
	}

	.section-head h2 {
		margin: 2px 0 0;
		color: var(--color-ink);
		font-size: 1.16rem;
		line-height: 1.1;
	}

	.section-head a {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 800;
		text-decoration: none;
		white-space: nowrap;
	}

	.markers {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px 10px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.markers.community {
		grid-template-columns: 1fr;
	}

	.marker {
		display: grid;
		grid-template-columns: 24px 1fr auto;
		min-height: 44px;
		align-items: center;
		gap: 9px;
		border: 1px solid var(--color-line);
		border-radius: 18px;
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		padding: 8px 10px;
		font-size: 0.78rem;
		font-weight: 800;
	}

	.marker-icon {
		display: grid;
		width: 24px;
		height: 24px;
		place-items: center;
		border-radius: 9px;
		background: var(--color-peach-soft);
		color: var(--color-success-text);
	}

	.marker-check {
		display: grid;
		min-width: 22px;
		height: 22px;
		place-items: center;
		border-radius: 50%;
		color: var(--color-success-text);
	}

	.marker.sky .marker-icon {
		background: var(--color-sky-soft);
	}

	.marker.rose .marker-icon {
		background: color-mix(in srgb, var(--color-rose) 34%, var(--color-paper-2));
	}

	.marker.butter .marker-icon {
		background: var(--color-warning-bg);
	}

	.marker.sage .marker-icon {
		background: var(--color-sage-soft);
	}

	/* Active (next) task: gently emphasised, not heavy. */
	.marker.active {
		border-color: color-mix(in srgb, var(--color-charcoal) 20%, transparent);
		box-shadow: 0 6px 16px color-mix(in srgb, var(--color-charcoal) 6%, transparent);
	}

	/* Completed: clear sage state with a filled check. */
	.marker.done {
		background: var(--color-sage-soft);
		color: var(--color-success-text);
		border-color: color-mix(in srgb, var(--color-success-text) 20%, var(--color-line));
	}

	.marker.done .marker-check {
		background: var(--color-paper-2);
	}
</style>
