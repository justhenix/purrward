<!-- Purrdocs docs file: generated documentation UI. -->
<script lang="ts">
	import Search from '@lucide/svelte/icons/search';

	interface Props {
		onopen?: () => void;
		compact?: boolean;
	}

	let { onopen, compact = false }: Props = $props();

	let isMac = $state(false);

	$effect(() => {
		if (typeof window !== 'undefined') {
			isMac = navigator.platform.toLowerCase().includes('mac');
		}
	});

	function handleClick() {
		onopen?.();
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			onopen?.();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<button type="button" class="search-bar" class:compact onclick={handleClick}>
	<span class="search-icon" aria-hidden="true">
		<Search size={16} strokeWidth={2.2} />
	</span>
	<span class="search-placeholder">Search docs...</span>
	{#if !compact}
		<kbd class="search-kbd">{isMac ? '⌘' : 'Ctrl'} K</kbd>
	{/if}
</button>

<style>
	.search-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all 0.2s;
		min-width: 200px;
		width: 100%;
	}

	.search-bar.compact {
		min-width: unset;
	}

	.search-bar:hover {
		background: var(--color-bg-tertiary);
		border-color: var(--color-border-hover);
	}

	.search-bar:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.search-icon {
		flex-shrink: 0;
		color: var(--color-text-tertiary);
	}

	.search-placeholder {
		flex: 1;
		text-align: left;
	}

	.search-kbd {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.5rem;
		padding: 0.125rem 0.25rem;
		background: var(--color-bg-tertiary);
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-family: var(--font-sans, inherit);
		color: var(--color-text-tertiary);
	}
</style>
