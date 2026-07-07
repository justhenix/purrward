<!-- Segmented light/dark/system theme control. -->
<script lang="ts">
	import Monitor from '@lucide/svelte/icons/monitor';
	import Moon from '@lucide/svelte/icons/moon';
	import Sun from '@lucide/svelte/icons/sun';
	import type { ThemePreference } from '$lib/theme';

	type Props = {
		theme: ThemePreference;
		compact?: boolean;
	};

	type Option = {
		value: ThemePreference;
		label: string;
	};

	const OPTIONS: readonly Option[] = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'system', label: 'System' }
	];

	let { theme, compact = false }: Props = $props();

	// Optimistic UI: track the chosen preference locally so the control updates
	// instantly, ahead of the persistence round-trip. Seeding from the prop's
	// initial value is intentional — later clicks drive `selected` directly.
	// svelte-ignore state_referenced_locally
	let selected = $state<ThemePreference>(theme);

	async function persist(value: ThemePreference): Promise<void> {
		try {
			const body = `theme=${encodeURIComponent(value)}`;
			await fetch('/api/preferences/theme', {
				method: 'POST',
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				body
			});
		} catch {
			// Soft-handle: the optimistic attribute already applied the theme, so a
			// failed persist just means the preference isn't saved for next visit.
		}
	}

	function choose(value: ThemePreference): void {
		if (value === selected) return;
		// Apply immediately so there's no flash before the fetch resolves.
		document.documentElement.dataset.theme = value;
		selected = value;
		void persist(value);
	}
</script>

<div class={['theme-toggle', compact && 'compact']} role="radiogroup" aria-label="Color theme">
	{#each OPTIONS as option (option.value)}
		{@const isActive = selected === option.value}
		<button
			type="button"
			role="radio"
			aria-checked={isActive}
			class={['segment', isActive && 'active']}
			onclick={() => choose(option.value)}
		>
			<span class="segment-icon" aria-hidden="true">
				{#if option.value === 'light'}
					<Sun size={16} strokeWidth={2.4} />
				{:else if option.value === 'dark'}
					<Moon size={16} strokeWidth={2.4} />
				{:else}
					<Monitor size={16} strokeWidth={2.4} />
				{/if}
			</span>
			<span class="segment-label">{option.label}</span>
		</button>
	{/each}
</div>

<style>
	.theme-toggle {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 4px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper-3);
		padding: 4px;
	}

	.segment {
		display: inline-flex;
		min-height: 40px;
		align-items: center;
		justify-content: center;
		gap: 7px;
		border: 1px solid transparent;
		border-radius: var(--radius-pill);
		background: transparent;
		color: var(--color-muted);
		font-family: var(--font-sans);
		font-size: 0.86rem;
		font-weight: 800;
		cursor: pointer;
		transition:
			background 140ms var(--ease-mobile),
			color 140ms var(--ease-mobile);
	}

	.segment:active {
		transform: translateY(1px);
	}

	.segment.active {
		border-color: var(--color-line);
		background: var(--color-paper-2);
		color: var(--color-ink);
		box-shadow: var(--shadow-card);
	}

	.segment-icon {
		display: grid;
		place-items: center;
	}

	.compact {
		grid-template-columns: repeat(3, 36px);
	}

	.compact .segment {
		min-height: 36px;
		gap: 0;
	}

	.compact .segment-label {
		display: none;
	}

	@media (max-width: 360px) {
		.segment-label {
			display: none;
		}
	}
</style>
