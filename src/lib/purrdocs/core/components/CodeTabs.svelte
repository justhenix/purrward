<!-- Purrdocs markdown tabbed code block helper. -->
<script lang="ts">
	import CodeBlock from './CodeBlock.svelte';

	export type Tab = {
		label: string;
		code: string;
		source?: string;
		lang?: string;
	};

	let { tabs = [], initialIndex = 0 }: { tabs?: Tab[]; initialIndex?: number } = $props();

	// svelte-ignore state_referenced_locally
	let active = $state(initialIndex);

	let hasTabs = $derived(tabs.length > 1);

	$effect(() => {
		if (active >= tabs.length) active = 0;
	});
</script>

<div class="purrdocs-codetabs">
	{#if hasTabs}
		<div class="purrdocs-codetabs__list" role="tablist">
			{#each tabs as tab, i (`${tab.label}-${i}`)}
				<button
					class="purrdocs-codetabs__tab"
					class:active={i === active}
					role="tab"
					aria-selected={i === active}
					onclick={() => (active = i)}
				>
					{tab.label}
				</button>
			{/each}
		</div>
	{/if}
	<div class="purrdocs-codetabs__panel" role="tabpanel">
		{#if tabs[active]}
			<CodeBlock
				source={tabs[active].source ?? ''}
				code={tabs[active].code}
				lang={tabs[active].lang ?? 'text'}
				title={tabs[active].label}
			/>
		{/if}
	</div>
</div>

<style>
	.purrdocs-codetabs {
		border-radius: 14px;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: rgba(11, 18, 32, 0.85);
		overflow: hidden;
	}

	.purrdocs-codetabs__list {
		display: flex;
		gap: 0.25rem;
		padding: 0.5rem 0.6rem;
		background: rgba(255, 255, 255, 0.04);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.purrdocs-codetabs__tab {
		border: 1px solid transparent;
		background: transparent;
		color: rgba(255, 255, 255, 0.7);
		padding: 0.35rem 0.75rem;
		border-radius: 0.65rem;
		font-size: 0.9rem;
		cursor: pointer;
		transition:
			background 0.15s ease,
			color 0.15s ease,
			border-color 0.15s ease;
	}

	.purrdocs-codetabs__tab:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.purrdocs-codetabs__tab.active {
		color: #fff;
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.purrdocs-codetabs__panel {
		padding: 0.75rem;
	}
</style>
