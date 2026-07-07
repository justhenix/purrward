<!-- Theme preference dropdown. -->
<script lang="ts">
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

	function changeTheme(event: Event): void {
		const value = (event.currentTarget as HTMLSelectElement).value as ThemePreference;
		choose(value);
	}
</script>

<label class={['theme-toggle', compact && 'compact']}>
	<span class="sr-only">Color theme</span>
	<select value={selected} onchange={changeTheme} aria-label="Color theme">
		{#each OPTIONS as option (option.value)}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
</label>

<style>
	.theme-toggle {
		position: relative;
		display: inline-grid;
		min-width: 124px;
	}

	.theme-toggle::after {
		position: absolute;
		top: 50%;
		right: 14px;
		width: 8px;
		height: 8px;
		border-right: 2px solid currentColor;
		border-bottom: 2px solid currentColor;
		color: var(--color-muted);
		content: '';
		pointer-events: none;
		transform: translateY(-70%) rotate(45deg);
	}

	select {
		appearance: none;
		width: 100%;
		min-height: 42px;
		border: 1px solid transparent;
		border-radius: var(--radius-pill);
		background: var(--color-paper-2);
		color: var(--color-ink);
		padding: 0 34px 0 14px;
		font-family: var(--font-sans);
		font-size: 0.86rem;
		font-weight: 800;
		cursor: pointer;
		border-color: var(--color-line);
		box-shadow: var(--shadow-card);
	}

	select:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--color-charcoal) 34%, transparent);
		outline-offset: 2px;
	}

	.compact {
		min-width: 104px;
	}

	.compact select {
		min-height: 38px;
		padding-left: 12px;
		font-size: 0.8rem;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
	}
</style>
