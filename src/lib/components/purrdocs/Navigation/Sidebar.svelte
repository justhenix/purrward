<!-- Purrdocs docs file: generated documentation UI. -->
<script lang="ts">
	import type { DocsSection } from 'purrdocs-core';
	import { ChevronDown } from '@lucide/svelte';
	import { SvelteSet } from 'svelte/reactivity';

	interface Props {
		sections: DocsSection[];
		currentPath: string;
	}

	let { sections, currentPath }: Props = $props();

	// Track which sections are expanded
	const expandedSections = new SvelteSet<string>();

	// Initialize with current section expanded
	$effect(() => {
		// Find which section contains the current path
		// Start from index 1 as index 0 is always visible (flat)
		for (const section of sections.slice(1)) {
			const hasActivePage = section.items.some((item) => item.href === currentPath);
			const hasActiveSubsection = section.subsections?.some((subsection) =>
				subsection.items.some((item) => item.href === currentPath)
			);

			if (hasActivePage || hasActiveSubsection) {
				expandedSections.clear();
				expandedSections.add(section.title);
				break; // Only open one section
			}
		}
	});

	function toggleSection(title: string) {
		if (expandedSections.has(title)) {
			expandedSections.delete(title);
		} else {
			expandedSections.add(title);
		}
	}

	function isActive(href: string): boolean {
		return currentPath === href;
	}

	function formatScope(scope?: string | null): string | null {
		if (!scope) return null;
		if (scope === 'agnostic') return 'Agnostic';
		return scope.charAt(0).toUpperCase() + scope.slice(1);
	}
</script>

<nav class="sidebar-nav">
	{#if sections.length > 0}
		<!-- Top section with no category (flat) -->
		<div class="nav-section flat-section">
			<ul class="nav-items">
				{#each sections[0].items as item (item.href)}
					<li>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a href={item.href} class:active={isActive(item.href)}>
							<span class="nav-title">{item.title}</span>
							{#if formatScope(item.scope)}
								<span class="nav-scope">{formatScope(item.scope)}</span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Remaining sections as accordion -->
	{#each sections.slice(1) as section (section.title)}
		<div class="nav-section">
			<button
				class="section-title"
				class:expanded={expandedSections.has(section.title)}
				onclick={() => toggleSection(section.title)}
			>
				<span>{section.title}</span>
				<ChevronDown class="chevron" size={16} />
			</button>

			{#if expandedSections.has(section.title)}
				{#if section.items.length > 0}
					<ul class="nav-items">
						{#each section.items as item (item.href)}
							<li>
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
								<a href={item.href} class:active={isActive(item.href)}>
									<span class="nav-title">{item.title}</span>
									{#if formatScope(item.scope)}
										<span class="nav-scope">{formatScope(item.scope)}</span>
									{/if}
								</a>
							</li>
						{/each}
					</ul>
				{/if}

				{#if section.subsections}
					{#each section.subsections as subsection (subsection.title)}
						<div class="subsection">
							<h4 class="subsection-title">{subsection.title}</h4>
							<ul class="nav-items">
								{#each subsection.items as item (item.href)}
									<li>
										<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
										<a href={item.href} class:active={isActive(item.href)}>
											<span class="nav-title">{item.title}</span>
											{#if formatScope(item.scope)}
												<span class="nav-scope">{formatScope(item.scope)}</span>
											{/if}
										</a>
									</li>
								{/each}
							</ul>
						</div>
					{/each}
				{/if}
			{/if}
		</div>
	{/each}
</nav>

<style>
	.sidebar-nav {
		font-size: 0.875rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-bottom: 1rem;
	}

	.nav-section {
		padding-bottom: 0.25rem;
	}

	.section-title {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--purrdocs-color-text-tertiary, #94a3b8);
		margin: 0 0 0.5rem 0;
		padding: 0.35rem 0.15rem;
		border: none;
		background: none;
		border-bottom: none;
		cursor: pointer;
		transition: color 0.2s ease;
		text-align: left;
	}

	.section-title:hover {
		color: var(--purrdocs-color-text, #171a19);
	}

	.section-title :global(.chevron) {
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}

	.section-title.expanded :global(.chevron) {
		transform: rotate(180deg);
	}

	.subsection {
		margin-top: 0.75rem;
		padding-left: 0.25rem;
	}

	.subsection-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--purrdocs-color-text, #111827);
		margin: 0 0 0.5rem 0.15rem;
		padding-bottom: 0.25rem;
		border-bottom: none;
	}

	.nav-items {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.nav-items li {
		margin: 0;
	}

	.nav-items a {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		color: var(--purrdocs-color-text-secondary, #6b7280);
		text-decoration: none;
		border-radius: 0.5rem;
		border: 1px solid transparent;
		font-weight: 500;
		line-height: 1.5;
		transition:
			color 0.2s ease,
			background 0.2s ease,
			border-color 0.2s ease;
	}

	.nav-items a:hover {
		color: var(--purrdocs-color-text, #111827);
		background: var(--purrdocs-color-bg-tertiary);
		border-color: var(--purrdocs-color-border);
	}

	.nav-items a.active {
		color: var(--purrdocs-nav-active-text);
		background: var(--purrdocs-nav-active-bg);
		border-color: var(--purrdocs-nav-active-border);
		font-weight: 600;
	}

	.nav-title {
		flex: 1;
	}

	.nav-scope {
		font-size: 0.65rem;
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
		border: 1px solid currentColor;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		opacity: 0.8;
	}
</style>
