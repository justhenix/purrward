<!-- Compact 2-column care chips that show today's routine progress without dominating the scene. -->
<script lang="ts">
	import Brush from '@lucide/svelte/icons/brush';
	import Check from '@lucide/svelte/icons/check';
	import Droplet from '@lucide/svelte/icons/droplet';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import HeartHandshake from '@lucide/svelte/icons/heart-handshake';
	import House from '@lucide/svelte/icons/house';
	import Pill from '@lucide/svelte/icons/pill';
	import Toilet from '@lucide/svelte/icons/toilet';
	import Utensils from '@lucide/svelte/icons/utensils';
	import type { TaskType } from '$lib/tasks';

	let {
		tasks,
		completed,
		activeId = null
	}: {
		tasks: readonly { id: TaskType; label: string }[];
		completed: Set<string>;
		activeId?: TaskType | null;
	} = $props();
</script>

{#snippet icon(taskId: TaskType)}
	{#if taskId === 'feeding'}
		<Utensils size={14} strokeWidth={2.5} aria-hidden="true" />
	{:else if taskId === 'water'}
		<Droplet size={14} strokeWidth={2.5} aria-hidden="true" />
	{:else if taskId === 'litter'}
		<Toilet size={14} strokeWidth={2.5} aria-hidden="true" />
	{:else if taskId === 'play'}
		<Gamepad2 size={14} strokeWidth={2.5} aria-hidden="true" />
	{:else if taskId === 'grooming'}
		<Brush size={14} strokeWidth={2.5} aria-hidden="true" />
	{:else if taskId === 'meds'}
		<Pill size={14} strokeWidth={2.5} aria-hidden="true" />
	{:else if taskId === 'street_feeding'}
		<HeartHandshake size={14} strokeWidth={2.5} aria-hidden="true" />
	{:else}
		<House size={14} strokeWidth={2.5} aria-hidden="true" />
	{/if}
{/snippet}

<ul class={['care-chips', tasks.length <= 3 && 'single']} aria-label="Today's care tasks">
	{#each tasks as task (task.id)}
		{@const isDone = completed.has(task.id)}
		<li
			class={['chip', isDone && 'done', activeId === task.id && !isDone && 'active']}
			aria-label={isDone ? `${task.label} cared for` : `${task.label} not cared for yet`}
		>
			<span class="chip-icon">{@render icon(task.id)}</span>
			<span class="chip-label">{task.label}</span>
			<span class="chip-check" aria-hidden="true">
				{#if isDone}<Check size={13} strokeWidth={3} />{/if}
			</span>
		</li>
	{/each}
</ul>

<style>
	.care-chips {
		display: flex;
		gap: 8px;
		margin: 0;
		padding: 0 2px 2px;
		overflow-x: auto;
		scrollbar-width: none;
		list-style: none;
	}

	.care-chips::-webkit-scrollbar {
		display: none;
	}

	.chip {
		display: grid;
		grid-template-columns: 24px auto;
		align-items: center;
		gap: 9px;
		min-width: max-content;
		min-height: 38px;
		border: 1px solid color-mix(in srgb, var(--color-line) 76%, transparent);
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--color-paper-2) 88%, transparent);
		padding: 6px 11px 6px 7px;
		color: var(--color-charcoal);
		font-size: 0.8rem;
		font-weight: 800;
	}

	.chip-icon {
		display: grid;
		width: 24px;
		height: 24px;
		place-items: center;
		border-radius: 50%;
		background: var(--color-peach-soft);
		color: var(--color-charcoal);
	}

	.chip-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chip-check {
		display: none;
		width: 20px;
		height: 20px;
		place-items: center;
		border-radius: 50%;
		color: var(--color-success-text);
	}

	.chip.active {
		border-color: color-mix(in srgb, var(--color-charcoal) 20%, var(--color-line));
		box-shadow: 0 6px 16px color-mix(in srgb, var(--color-charcoal) 8%, transparent);
	}

	.chip.done {
		background: var(--color-sage-soft);
		border-color: color-mix(in srgb, var(--color-success-text) 22%, var(--color-line));
		color: var(--color-success-text);
	}

	.chip.done .chip-icon {
		background: color-mix(in srgb, var(--color-paper-2) 66%, var(--color-sage-soft));
		color: var(--color-success-text);
	}

	.chip.done .chip-check {
		background: var(--color-paper-2);
	}
</style>
