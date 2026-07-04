<!-- Mobile-first cat manager: switch active cat, search, add a cat, and remove cats. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import Check from '@lucide/svelte/icons/check';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Plus from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { getCatAvatar } from '$lib/cat-avatars';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let showAdd = $state(false);
	let newName = $state('');
	let newAvatar = $state<string>('orange');
	let newMode = $state<'owned' | 'community'>('owned');
	let query = $state('');

	let atCap = $derived(data.cats.length >= data.catCap);
	let showSearch = $derived(data.cats.length > 6);
	let filteredCats = $derived(
		query.trim()
			? data.cats.filter((cat) => cat.name.toLowerCase().includes(query.trim().toLowerCase()))
			: data.cats
	);
</script>

<svelte:head>
	<title>Purrward | My Cats</title>
</svelte:head>

<div class="cats-screen">
	<header class="cats-header">
		<a class="back-button" href={resolve('/profile')} aria-label="Back to profile">
			<ChevronLeft size={22} strokeWidth={2.3} aria-hidden="true" />
		</a>
		<div>
			<p>Your cats</p>
			<h1>My Cats</h1>
		</div>
	</header>

	{#if showSearch}
		<label class="search">
			<Search size={17} strokeWidth={2.3} aria-hidden="true" />
			<input bind:value={query} placeholder="Search cats" autocomplete="off" />
		</label>
	{/if}

	<section class="cat-list" aria-label="Your cats">
		{#each filteredCats as cat (cat.id)}
			{@const avatar = getCatAvatar(cat.avatarId)}
			{@const isActive = cat.id === data.activeCatId}
			<article class={['cat-card', isActive && 'active']}>
				<div class="cat-thumb" aria-hidden="true">
					{#if avatar}<img src={avatar.src} alt="" />{/if}
				</div>
				<div class="cat-info">
					<h2>{cat.name}</h2>
					<p>
						<span class={['mode-tag', cat.careMode]}>
							{cat.careMode === 'community' ? 'Community' : 'Owned'}
						</span>
						{cat.purrpoints} pts
					</p>
				</div>
				<div class="cat-actions">
					{#if isActive}
						<span class="active-badge">
							<Check size={15} strokeWidth={3} aria-hidden="true" /> Active
						</span>
					{:else}
						<form method="POST" action="?/select">
							<input type="hidden" name="catId" value={cat.id} />
							<button class="select-button" type="submit">Select</button>
						</form>
					{/if}
					{#if data.cats.length > 1}
						<form
							method="POST"
							action="?/remove"
							onsubmit={(event) => {
								if (!confirm(`Remove ${cat.name}? This deletes its care history.`))
									event.preventDefault();
							}}
						>
							<input type="hidden" name="catId" value={cat.id} />
							<button class="remove-button" type="submit" aria-label={`Remove ${cat.name}`}>
								<Trash2 size={15} strokeWidth={2.2} aria-hidden="true" />
							</button>
						</form>
					{/if}
				</div>
			</article>
		{/each}

		{#if filteredCats.length === 0}
			<p class="empty">No cats match that name.</p>
		{/if}
	</section>

	{#if showAdd}
		<form class="add-form" method="POST" action="?/create">
			<h2>Add a cat</h2>
			<div class="mode-switch">
				<label class:active={newMode === 'owned'}>
					<input
						type="radio"
						name="careMode"
						value="owned"
						checked={newMode === 'owned'}
						onchange={() => (newMode = 'owned')}
					/>
					Owned
				</label>
				<label class:active={newMode === 'community'}>
					<input
						type="radio"
						name="careMode"
						value="community"
						checked={newMode === 'community'}
						onchange={() => (newMode = 'community')}
					/>
					Community
				</label>
			</div>

			<label class="field">
				<span>Name</span>
				<input
					name="name"
					bind:value={newName}
					placeholder="Mochi, Luna, Orange..."
					maxlength="40"
				/>
			</label>

			<fieldset class="avatar-grid">
				<legend>Avatar</legend>
				{#each data.avatars as avatar (avatar.id)}
					<label class={['avatar-choice', newAvatar === avatar.id && 'active']}>
						<input
							type="radio"
							name="avatarId"
							value={avatar.id}
							checked={newAvatar === avatar.id}
							onchange={() => (newAvatar = avatar.id)}
						/>
						<img src={avatar.src} alt={avatar.label} />
					</label>
				{/each}
			</fieldset>

			{#if form?.message}
				<p class="field-error">{form.message}</p>
			{/if}

			<div class="add-actions">
				<button class="cancel" type="button" onclick={() => (showAdd = false)}>Cancel</button>
				<button class="submit" type="submit">Add cat</button>
			</div>
		</form>
	{:else}
		<div class="add-bar">
			<button class="add-toggle" type="button" disabled={atCap} onclick={() => (showAdd = true)}>
				<Plus size={18} strokeWidth={2.4} aria-hidden="true" />
				{atCap ? `Cat limit reached (${data.catCap})` : 'Add cat'}
			</button>
		</div>
	{/if}
</div>

<style>
	.cats-screen {
		display: grid;
		gap: 14px;
	}

	.cats-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding-top: 4px;
	}

	.back-button {
		display: grid;
		width: 46px;
		height: 46px;
		flex: 0 0 auto;
		place-items: center;
		border: 1px solid var(--color-line);
		border-radius: 50%;
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		box-shadow: var(--shadow-card);
	}

	.cats-header p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.84rem;
		font-weight: 800;
	}

	.cats-header h1 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.5rem;
	}

	.search {
		display: flex;
		align-items: center;
		gap: 10px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper-2);
		padding: 0 16px;
		color: var(--color-muted);
	}

	.search input {
		flex: 1;
		border: 0;
		background: transparent;
		color: var(--color-ink);
		padding: 12px 0;
		font: inherit;
		font-size: 0.92rem;
	}

	.search input:focus {
		outline: none;
	}

	.cat-list {
		display: grid;
		gap: 10px;
	}

	.cat-card {
		display: grid;
		grid-template-columns: 52px 1fr auto;
		gap: 12px;
		align-items: center;
		border: 1px solid var(--color-line);
		border-radius: 22px;
		background: var(--color-paper-2);
		padding: 11px 13px;
		box-shadow: var(--shadow-card);
	}

	.cat-card.active {
		border-color: color-mix(in srgb, var(--color-success-text) 34%, var(--color-line));
		box-shadow:
			var(--shadow-card),
			inset 0 0 0 1.5px color-mix(in srgb, var(--color-success-text) 26%, transparent);
	}

	.cat-thumb {
		display: grid;
		width: 52px;
		height: 52px;
		place-items: center;
		border-radius: 16px;
		background: var(--color-peach-soft);
	}

	.cat-thumb img {
		width: 42px;
		height: 42px;
		object-fit: contain;
	}

	.cat-info {
		min-width: 0;
	}

	.cat-info h2 {
		margin: 0;
		overflow: hidden;
		color: var(--color-ink);
		font-size: 1rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.cat-info p {
		display: flex;
		align-items: center;
		gap: 7px;
		margin: 4px 0 0;
		color: var(--color-muted);
		font-size: 0.78rem;
		font-weight: 700;
	}

	.mode-tag {
		border-radius: var(--radius-pill);
		padding: 2px 9px;
		font-size: 0.68rem;
		font-weight: 800;
	}

	.mode-tag.owned {
		background: var(--color-sky-soft);
		color: var(--color-charcoal);
	}

	.mode-tag.community {
		background: var(--color-sage-soft);
		color: var(--color-success-text);
	}

	.cat-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.active-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: var(--color-success-text);
		font-size: 0.76rem;
		font-weight: 850;
	}

	.select-button {
		border: 0;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		padding: 8px 16px;
		font-size: 0.78rem;
		font-weight: 850;
		cursor: pointer;
	}

	.remove-button {
		display: grid;
		width: 30px;
		height: 30px;
		place-items: center;
		border: 1px solid var(--color-line);
		border-radius: 50%;
		background: var(--color-paper);
		color: var(--color-muted);
		cursor: pointer;
	}

	.empty {
		margin: 8px 0;
		color: var(--color-muted);
		font-size: 0.86rem;
		font-weight: 600;
		text-align: center;
	}

	.add-bar {
		position: sticky;
		bottom: calc(90px + env(safe-area-inset-bottom));
		z-index: 20;
	}

	.add-toggle {
		display: inline-flex;
		width: 100%;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 52px;
		border: 0;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		font-size: 0.95rem;
		font-weight: 850;
		cursor: pointer;
		box-shadow: 0 12px 26px color-mix(in srgb, var(--color-charcoal) 20%, transparent);
	}

	.add-toggle:disabled {
		opacity: 0.55;
		cursor: not-allowed;
		box-shadow: none;
	}

	.add-form {
		display: grid;
		gap: 12px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-card-lg);
		background: var(--color-paper-2);
		padding: 16px;
		box-shadow: var(--shadow-card);
	}

	.add-form h2 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.16rem;
	}

	.mode-switch {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.mode-switch label {
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--color-line);
		border-radius: 14px;
		background: var(--color-paper);
		padding: 10px;
		font-size: 0.84rem;
		font-weight: 800;
		color: var(--color-muted);
		cursor: pointer;
	}

	.mode-switch label.active {
		background: var(--color-sage-soft);
		color: var(--color-success-text);
	}

	.mode-switch input {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
	}

	.field {
		display: grid;
		gap: 6px;
	}

	.field span {
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 800;
	}

	.field input {
		border: 1px solid var(--color-line);
		border-radius: 14px;
		background: var(--color-paper);
		color: var(--color-ink);
		padding: 11px 13px;
		font: inherit;
	}

	.avatar-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 8px;
		border: 0;
		margin: 0;
		padding: 0;
	}

	.avatar-grid legend {
		margin-bottom: 6px;
		padding: 0;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 800;
	}

	.avatar-choice {
		display: grid;
		place-items: center;
		border: 1px solid transparent;
		border-radius: 14px;
		background: var(--color-paper);
		padding: 7px;
		cursor: pointer;
	}

	.avatar-choice.active {
		background: var(--color-sage-soft);
		border-color: color-mix(in srgb, var(--color-success-text) 20%, transparent);
	}

	.avatar-choice input {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
	}

	.avatar-choice img {
		width: 40px;
		height: 40px;
		object-fit: contain;
	}

	.field-error {
		margin: 0;
		color: var(--color-danger-text);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.add-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.cancel,
	.submit {
		min-height: 48px;
		border: 0;
		border-radius: var(--radius-pill);
		font-size: 0.92rem;
		font-weight: 850;
		cursor: pointer;
	}

	.cancel {
		border: 1px solid var(--color-line);
		background: var(--color-paper);
		color: var(--color-charcoal);
	}

	.submit {
		background: var(--color-charcoal);
		color: var(--color-paper-2);
	}
</style>
