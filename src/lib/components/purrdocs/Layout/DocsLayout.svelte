<!-- Purrdocs docs file: generated documentation UI. -->
<script lang="ts">
	import type { DocsSection, Version } from 'purrdocs-core';
	import Sidebar from '../Navigation/Sidebar.svelte';
	import TOC from './TOC.svelte';
	import SearchBar from '../Search/SearchBar.svelte';
	import SearchModal from '../Search/SearchModal.svelte';
	import VersionSelector from '../Navigation/VersionSelector.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { X, Menu } from '@lucide/svelte';

	interface Props {
		children: import('svelte').Snippet;
		sidebar: DocsSection[];
		currentPath?: string;
		siteTitle?: string;
		versions?: Version[];
		currentVersion?: string;
	}

	let {
		children,
		sidebar,
		currentPath = '',
		siteTitle = 'Documentation',
		versions = [],
		currentVersion = 'latest'
	}: Props = $props();

	let sidebarOpen = $state(false);
	let searchOpen = $state(false);

	// Close sidebar and unlock body scroll
	function closeSidebar() {
		sidebarOpen = false;
		if (typeof document !== 'undefined') {
			document.body.classList.remove('sidebar-open');
		}
	}

	// Open sidebar and lock body scroll
	function openSidebar() {
		sidebarOpen = true;
		if (typeof document !== 'undefined') {
			document.body.classList.add('sidebar-open');
		}
	}

	function handleOverlayKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
			event.preventDefault();
			closeSidebar();
		}
	}

	// Handle sidebar toggle
	$effect(() => {
		if (sidebarOpen) {
			openSidebar();
		} else {
			closeSidebar();
		}
	});
</script>

<div class="docs-layout">
	<SearchModal bind:isopen={searchOpen} onclose={() => (searchOpen = false)} />

	<!-- Mobile menu button -->
	<button class="mobile-menu-btn" onclick={() => openSidebar()} aria-label="Open menu">
		<Menu size={24} />
	</button>

	<!-- Mobile overlay -->
	{#if sidebarOpen}
		<div
			class="sidebar-overlay"
			role="button"
			tabindex="0"
			aria-label="Close sidebar"
			onclick={() => closeSidebar()}
			onkeydown={handleOverlayKeydown}
		></div>
	{/if}

	<div class="docs-panels">
		<!-- Sidebar with controls at top -->
		<aside class="docs-column docs-sidebar" class:open={sidebarOpen}>
			<div class="sidebar-header">
				<button class="sidebar-close" onclick={() => closeSidebar()} aria-label="Close sidebar">
					<X size={20} />
				</button>
				<h2 class="sidebar-title">{siteTitle}</h2>
			</div>

			<div class="sidebar-controls">
				<SearchBar onopen={() => (searchOpen = true)} compact={true} />
				<div class="controls-row">
					{#if versions.length > 0}
						<VersionSelector {versions} {currentVersion} {currentPath} />
					{/if}
					<ThemeToggle />
				</div>
			</div>

			<div class="sidebar-nav-wrapper">
				<Sidebar sections={sidebar} {currentPath} />
			</div>
		</aside>

		<!-- Main content -->
		<main class="docs-column docs-main">
			<div class="docs-main-inner">
				{@render children()}
			</div>
		</main>

		<!-- Table of Contents -->
		<aside class="docs-column docs-toc">
			<TOC />
		</aside>
	</div>
</div>

<style>
	/* Modern CSS Grid Layout - No calculations! */
	.docs-layout {
		--purrdocs-color-bg: var(--color-paper, #fdf8ef);
		--purrdocs-color-bg-secondary: var(--color-paper-2, #fffdf8);
		--purrdocs-color-bg-tertiary: var(--color-paper-3, #f6eedb);
		--purrdocs-color-text: var(--color-ink, #171a19);
		--purrdocs-color-text-secondary: var(--color-muted, #7a746b);
		--purrdocs-color-text-tertiary: color-mix(
			in srgb,
			var(--color-muted, #7a746b) 72%,
			transparent
		);
		--purrdocs-color-border: var(--color-line, #e8decb);
		--purrdocs-color-border-hover: color-mix(
			in srgb,
			var(--color-line, #e8decb) 70%,
			var(--color-charcoal, #242626)
		);
		--purrdocs-color-primary: var(--color-charcoal, #242626);
		--purrdocs-color-accent: var(--color-sage, #8ebc8c);
		--purrdocs-nav-active-bg: var(--color-charcoal, #242626);
		--purrdocs-nav-active-text: var(--color-paper-2, #fffdf8);
		--purrdocs-nav-active-border: transparent;
		--purrdocs-code-bg: var(--color-charcoal-soft, #343837);
		--purrdocs-code-text: var(--color-paper-2, #fffdf8);
		--color-bg: var(--purrdocs-color-bg);
		--color-bg-secondary: var(--purrdocs-color-bg-secondary);
		--color-bg-tertiary: var(--purrdocs-color-bg-tertiary);
		--color-text: var(--purrdocs-color-text);
		--color-text-secondary: var(--purrdocs-color-text-secondary);
		--color-text-tertiary: var(--purrdocs-color-text-tertiary);
		--color-border: var(--purrdocs-color-border);
		--color-border-hover: var(--purrdocs-color-border-hover);
		--color-primary: var(--purrdocs-color-primary);
		display: flex;
		flex-direction: column;
		height: 100%; /* fills app-body from root layout */
		overflow: hidden;
		background:
			radial-gradient(
				circle at 12% 8%,
				color-mix(in srgb, var(--color-sky, #88cedf) 15%, transparent),
				transparent 30%
			),
			radial-gradient(
				circle at 86% 12%,
				color-mix(in srgb, var(--color-peach, #f0a688) 12%, transparent),
				transparent 32%
			),
			var(--purrdocs-color-bg);
		padding: 0 clamp(0.75rem, 2vw, 1.5rem);
	}

	.docs-layout:global([data-purrdocs-theme='dark']) {
		--purrdocs-color-bg: var(--color-dark-bg, #1f2322);
		--purrdocs-color-bg-secondary: var(--color-dark-surface, #2a2f2e);
		--purrdocs-color-bg-tertiary: var(--color-dark-surface-2, #333938);
		--purrdocs-color-text: var(--color-dark-text, #f8f1e6);
		--purrdocs-color-text-secondary: var(--color-dark-muted, #c7bfb2);
		--purrdocs-color-text-tertiary: color-mix(
			in srgb,
			var(--color-dark-muted, #c7bfb2) 72%,
			transparent
		);
		--purrdocs-color-border: var(--color-dark-line, #444b49);
		--purrdocs-color-border-hover: color-mix(
			in srgb,
			var(--color-dark-line, #444b49) 70%,
			var(--color-dark-text, #f8f1e6)
		);
		--purrdocs-color-primary: var(--color-dark-text, #f8f1e6);
		--purrdocs-nav-active-bg: var(--color-dark-surface-2, #333938);
		--purrdocs-nav-active-text: var(--color-dark-text, #f8f1e6);
		--purrdocs-nav-active-border: var(--color-sage, #8ebc8c);
	}

	/* Force light palette even when the root app is in dark mode */
	.docs-layout:global([data-purrdocs-theme='light']) {
		--purrdocs-color-bg: #fdf8ef;
		--purrdocs-color-bg-secondary: #fffdf8;
		--purrdocs-color-bg-tertiary: #f6eedb;
		--purrdocs-color-text: #171a19;
		--purrdocs-color-text-secondary: #7a746b;
		--purrdocs-color-text-tertiary: color-mix(in srgb, #7a746b 72%, transparent);
		--purrdocs-color-border: #e8decb;
		--purrdocs-color-border-hover: color-mix(in srgb, #e8decb 70%, #242626);
		--purrdocs-color-primary: #242626;
		--purrdocs-color-accent: #8ebc8c;
		--purrdocs-nav-active-bg: #242626;
		--purrdocs-nav-active-text: #fffdf8;
		--purrdocs-nav-active-border: transparent;
		--purrdocs-code-bg: #343837;
		--purrdocs-code-text: #fffdf8;
	}

	.docs-panels {
		display: grid;
		grid-template-columns: minmax(240px, 280px) minmax(0, 1fr) minmax(200px, 240px);
		max-width: min(1800px, 100%);
		width: 100%;
		margin: 0 auto;
		padding: clamp(0.5rem, 1vw, 0.75rem);
		gap: clamp(0.5rem, 1vw, 1rem);
		overflow: hidden;
		flex: 1;
		min-height: 0; /* critical for grid children to scroll properly */
	}

	.docs-column {
		border: none;
		border-radius: 0;
		background: transparent;
		box-shadow: none;
		backdrop-filter: none;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		overflow-x: hidden;
		min-height: 0; /* critical - allows grid item to shrink and scroll */
		overscroll-behavior: contain;
		scrollbar-gutter: stable both-edges;
	}

	/* Sidebar specific styles */
	.docs-sidebar {
		overflow: visible;
		padding: 0;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: none;
		position: sticky;
		top: 0;
		background: var(--purrdocs-color-bg);
		backdrop-filter: none;
		z-index: 10;
	}

	.sidebar-title {
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
		color: var(--purrdocs-color-text, #171a19);
	}

	.sidebar-close {
		display: none; /* Hidden on desktop */
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		border: none;
		background: color-mix(in srgb, var(--purrdocs-color-primary) 10%, transparent);
		color: var(--purrdocs-color-primary, #242626);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.sidebar-close:hover {
		background: color-mix(in srgb, var(--purrdocs-color-primary) 20%, transparent);
		transform: scale(1.05);
	}

	.sidebar-controls {
		position: relative;
		z-index: 30;
		padding: 0.5rem 1rem;
		border-bottom: none;
		background: transparent;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.controls-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.sidebar-nav-wrapper {
		position: relative;
		z-index: 1;
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem 1rem;
	}

	.docs-toc {
		padding: clamp(0.75rem, 1vw, 1rem);
	}

	.docs-main {
		position: relative;
		padding: 0;
	}

	.docs-main-inner {
		max-width: 820px;
		margin: 0 auto;
		padding: clamp(1rem, 2vw, 1.5rem) clamp(1rem, 2vw, 1.5rem) clamp(1.25rem, 2vw, 1.75rem);
		width: 100%;
	}

	/* Mobile menu button */
	.mobile-menu-btn {
		display: none;
		position: fixed;
		top: 1rem;
		left: 1rem;
		z-index: 50;
		width: 48px;
		height: 48px;
		align-items: center;
		justify-content: center;
		background: var(--panel-surface, rgba(255, 255, 255, 0.95));
		border: 1px solid var(--purrdocs-color-border, #f8f1e6);
		border-radius: 0.75rem;
		color: var(--purrdocs-color-primary, #242626);
		cursor: pointer;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.mobile-menu-btn:hover {
		background: color-mix(in srgb, var(--purrdocs-color-primary) 10%, transparent);
		transform: scale(1.05);
	}

	/* Mobile overlay */
	.sidebar-overlay {
		display: none;
	}

	/* Lock body scroll when sidebar is open on mobile */
	:global(body.sidebar-open) {
		overflow: hidden;
	}

	@media (max-width: 1280px) {
		.docs-panels {
			grid-template-columns: minmax(220px, 260px) minmax(0, 1fr) minmax(180px, 220px);
		}
	}

	@media (max-width: 1024px) {
		.mobile-menu-btn {
			display: flex;
		}

		.docs-layout {
			height: auto;
			overflow: visible;
			padding: 0;
		}

		.docs-panels {
			grid-template-columns: 1fr;
			height: auto;
			padding: 0 clamp(0.75rem, 2vw, 1.5rem) clamp(1.5rem, 4vw, 2.5rem);
			gap: 1rem;
		}

		.sidebar-overlay {
			display: block;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.5);
			z-index: 39;
			backdrop-filter: blur(4px);
		}

		.docs-sidebar {
			position: fixed;
			left: 0;
			top: 0;
			transform: translateX(-100%);
			transition: transform 0.3s ease;
			z-index: 40;
			height: 100dvh;
			box-shadow: 4px 0 12px rgba(0, 0, 0, 0.2);
			border-radius: 0;
			border-left: none;
			border-right: none;
			background: var(--purrdocs-color-bg);
			max-width: 320px;
			width: min(85vw, 360px);
		}

		.docs-sidebar.open {
			transform: translateX(0);
		}

		.sidebar-close {
			display: flex; /* Show on mobile */
		}

		.docs-column {
			box-shadow: none;
			border-radius: 1rem;
		}

		.docs-main,
		.docs-toc {
			height: auto;
			overflow: visible;
			box-shadow: none;
			background: transparent;
			padding: 0;
		}

		.docs-main-inner {
			padding: 1.5rem 1rem 2rem;
		}

		.docs-toc {
			display: none;
		}
	}
</style>
