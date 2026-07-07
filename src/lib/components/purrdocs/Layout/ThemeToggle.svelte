<!-- Purrdocs docs file: generated documentation UI. -->
<script lang="ts">
	import Moon from '@lucide/svelte/icons/moon';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Sun from '@lucide/svelte/icons/sun';

	type Theme = 'light' | 'dark' | 'auto';

	interface Props {
		storageKey?: string;
	}

	let { storageKey = 'purrdocs-theme' }: Props = $props();

	let theme = $state<Theme>('auto');
	let mounted = $state(false);
	let isOpen = $state(false);
	let dropdownElement: HTMLDivElement;

	const themeOptions: Theme[] = ['light', 'dark', 'auto'];

	// Load theme from localStorage and apply it
	$effect(() => {
		if (typeof window === 'undefined') return;

		if (!mounted) {
			mounted = true;
			const stored = localStorage.getItem(storageKey) as Theme | null;
			if (stored && themeOptions.includes(stored)) {
				theme = stored;
			}
		}

		applyTheme(theme);
	});

	// Watch for theme changes
	$effect(() => {
		if (!mounted) return;
		applyTheme(theme);
		localStorage.setItem(storageKey, theme);
	});

	// Clean up on unmount: remove the attribute so other pages aren't affected
	$effect(() => {
		return () => {
			const layout = document.querySelector('.docs-layout');
			layout?.removeAttribute('data-purrdocs-theme');
		};
	});

	function applyTheme(selectedTheme: Theme) {
		if (typeof window === 'undefined') return;

		let resolved: 'light' | 'dark';
		if (selectedTheme === 'auto') {
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			resolved = prefersDark ? 'dark' : 'light';
		} else {
			resolved = selectedTheme;
		}

		// Set the attribute on the .docs-layout container so scoped CSS can react
		const layout = document.querySelector('.docs-layout');
		if (layout) {
			layout.setAttribute('data-purrdocs-theme', resolved);
		}
	}

	function handleThemeChange(newTheme: Theme) {
		theme = newTheme;
		isOpen = false;
	}

	function handleClickOutside(e: MouseEvent) {
		if (!isOpen) return; // Don't process if already closed
		if (dropdownElement && !dropdownElement.contains(e.target as Node)) {
			isOpen = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			isOpen = false;
		}
	}

	function getThemeLabel(currentTheme: Theme): string {
		switch (currentTheme) {
			case 'light':
				return 'Light';
			case 'dark':
				return 'Dark';
			case 'auto':
				return 'Auto';
		}
	}
</script>

<svelte:window onclick={handleClickOutside} onkeydown={handleKeydown} />

<div class="theme-selector" bind:this={dropdownElement}>
	<button
		type="button"
		class="theme-button"
		onclick={(e) => {
			e.stopPropagation();
			isOpen = !isOpen;
		}}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
	>
		<span class="theme-icon" role="img" aria-hidden="true">
			{#if theme === 'light'}
				<Sun size={16} strokeWidth={2.2} />
			{:else if theme === 'dark'}
				<Moon size={16} strokeWidth={2.2} />
			{:else}
				<Sparkles size={16} strokeWidth={2.2} />
			{/if}
		</span>
		<span class="theme-label">{getThemeLabel(theme)}</span>
		<svg
			class="chevron"
			class:open={isOpen}
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M3 4.5L6 7.5L9 4.5"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</button>

	{#if isOpen}
		<div class="theme-dropdown" role="listbox">
			{#each themeOptions as option (option)}
				<button
					type="button"
					class="theme-option"
					class:active={option === theme}
					onclick={() => handleThemeChange(option)}
					role="option"
					aria-selected={option === theme}
				>
					<span class="option-icon" role="img" aria-hidden="true">
						{#if option === 'light'}
							<Sun size={16} strokeWidth={2.2} />
						{:else if option === 'dark'}
							<Moon size={16} strokeWidth={2.2} />
						{:else}
							<Sparkles size={16} strokeWidth={2.2} />
						{/if}
					</span>
					<span class="option-label">{getThemeLabel(option)}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.theme-selector {
		position: relative;
	}

	.theme-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: var(--color-text);
		cursor: pointer;
		transition: all 0.2s;
		width: 100%;
	}

	.theme-button:hover {
		background: var(--color-bg-tertiary);
		border-color: var(--color-border-hover);
	}

	.theme-icon {
		display: grid;
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		place-items: center;
	}

	.theme-label {
		flex: 1;
		text-align: left;
		font-weight: 500;
	}

	.chevron {
		flex-shrink: 0;
		color: var(--color-text-tertiary);
		transition: transform 0.2s;
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	.theme-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		right: 0;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
		z-index: 100;
		overflow: hidden;
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.theme-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.15s;
		border-bottom: 1px solid var(--color-border);
	}

	.theme-option:last-child {
		border-bottom: none;
	}

	.theme-option:hover {
		background: var(--color-bg-secondary);
	}

	.theme-option.active {
		background: var(--color-bg-tertiary);
		font-weight: 600;
	}

	.option-icon {
		display: grid;
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		place-items: center;
	}

	.option-label {
		flex: 1;
		color: var(--color-text);
		font-size: 0.875rem;
	}

	@media (max-width: 640px) {
		.theme-label {
			display: none;
		}
	}
</style>
