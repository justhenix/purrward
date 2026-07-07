<!-- Profile settings: parent name, profile picture picker, email, and sign out. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import LogOut from '@lucide/svelte/icons/log-out';
	import { CAT_AVATARS } from '$lib/cat-avatars';
	import { untrack } from 'svelte';
	import { avatarInitial, deriveParentName } from '$lib/account-identity';
	import { isRenderableAvatarUrl } from '$lib/avatar-url';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Seed the editable field once; later edits are local UI state.
	let parentName = $state(untrack(() => deriveParentName(data.user)));
	let initial = $derived(avatarInitial(data.user));
	let avatarChoice = $derived(data.preferences.avatarChoice);
	// Google accounts default to their own photo; other accounts default to a letter.
	let photoUrl = $derived(isRenderableAvatarUrl(data.user?.avatarUrl) ? data.user.avatarUrl : null);

	let editingAvatar = $state(false);
	let selectedCat = $derived(CAT_AVATARS.find((avatar) => avatar.id === avatarChoice) ?? null);
	let currentLabel = $derived(selectedCat ? selectedCat.label : photoUrl ? 'Photo' : 'Letter');
</script>

<svelte:head>
	<title>Purrward | Profile settings</title>
</svelte:head>

<div class="settings-screen">
	<header class="settings-header">
		<a class="back-button" href={resolve('/profile')} aria-label="Back to profile">
			<ChevronLeft size={22} strokeWidth={2.3} aria-hidden="true" />
		</a>
		<h1>Profile settings</h1>
	</header>

	{#if data.user}
		<form class="panel name-panel" method="POST" action="?/name">
			<div class="name-row">
				<label class="field">
					<span>Parent name</span>
					<input name="parentName" bind:value={parentName} maxlength="40" autocomplete="off" />
				</label>
				<button class="save" type="submit">Save</button>
			</div>
			{#if form?.field === 'name'}
				<p class="field-error">{form.message}</p>
			{:else if form?.savedName}
				<p class="field-ok">Saved.</p>
			{/if}
		</form>

		<form class="panel" method="POST" action="?/avatar">
			<div class="panel-heading"><h2>Profile picture</h2></div>
			{#if !editingAvatar}
				<div class="avatar-current">
					<span class="avatar-preview current">
						{#if selectedCat}
							<img class="cat" src={selectedCat.src} alt="" />
						{:else if photoUrl}
							<img class="photo" src={photoUrl} alt="" />
						{:else}
							<span class="letter-text">{initial}</span>
						{/if}
					</span>
					<span class="avatar-current-label">{currentLabel}</span>
					<button class="change" type="button" onclick={() => (editingAvatar = true)}>Change</button
					>
				</div>
			{:else}
				<div class="avatar-options">
					<button
						class={['avatar-choice', avatarChoice === 'initial' && 'active']}
						type="submit"
						name="avatarChoice"
						value="initial"
						aria-pressed={avatarChoice === 'initial'}
					>
						{#if photoUrl}
							<span class="avatar-preview photo"><img src={photoUrl} alt="" /></span>
							<span>Photo</span>
						{:else}
							<span class="avatar-preview letter">{initial}</span>
							<span>Letter</span>
						{/if}
					</button>
					{#each CAT_AVATARS as avatar (avatar.id)}
						<button
							class={['avatar-choice', avatarChoice === avatar.id && 'active']}
							type="submit"
							name="avatarChoice"
							value={avatar.id}
							aria-pressed={avatarChoice === avatar.id}
						>
							<span class="avatar-preview cat"><img src={avatar.src} alt="" /></span>
							<span>{avatar.label}</span>
						</button>
					{/each}
				</div>
			{/if}
		</form>

		<section class="panel">
			<div class="row">
				<span class="row-label">Email</span>
				<span class="row-value">{data.user.email}</span>
			</div>
		</section>

		<section class="panel">
			<div class="panel-heading"><h2>Account</h2></div>
			<form method="POST" action={resolve('/auth/logout')}>
				<button class="sign-out" type="submit">
					<LogOut size={18} strokeWidth={2.2} aria-hidden="true" />
					Sign out
				</button>
			</form>
		</section>
	{:else}
		<section class="panel guest-panel">
			<div class="panel-heading"><h2>Guest mode</h2></div>
			<p>Sign in to save progress.</p>
			<a class="signin-button" href={resolve('/auth/login')}>Sign in</a>
		</section>
	{/if}
</div>

<style>
	.settings-screen {
		display: grid;
		gap: 16px;
	}

	.settings-header {
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

	.settings-header h1 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.5rem;
	}

	.panel {
		display: grid;
		gap: 12px;
		border: 1px solid var(--color-line);
		border-radius: 28px;
		background: var(--color-paper-2);
		padding: 18px;
		box-shadow: var(--shadow-card);
	}

	.panel-heading h2 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.14rem;
	}

	.field {
		display: grid;
		gap: 6px;
	}

	.name-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: end;
		gap: 10px;
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
		padding: 12px 14px;
		font: inherit;
	}

	.field-error {
		margin: 0;
		color: var(--color-danger-text);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.field-ok {
		margin: 0;
		color: var(--color-success-text);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.save {
		min-width: 76px;
		min-height: 48px;
		border: 0;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		padding: 0 22px;
		font-size: 0.9rem;
		font-weight: 850;
		cursor: pointer;
	}

	@media (max-width: 360px) {
		.name-row {
			grid-template-columns: 1fr;
		}

		.save {
			justify-self: start;
		}
	}

	.avatar-current {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 12px;
	}

	.avatar-preview.current {
		width: 54px;
		height: 54px;
		border-radius: 18px;
	}

	.avatar-preview.current img.cat {
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 6px;
	}

	.avatar-preview.current img.photo {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-preview.current .letter-text {
		font-size: 1.3rem;
		font-weight: 900;
	}

	.avatar-current-label {
		color: var(--color-ink);
		font-size: 0.9rem;
		font-weight: 800;
	}

	.change {
		min-height: 40px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper);
		color: var(--color-charcoal);
		padding: 0 18px;
		font: inherit;
		font-size: 0.84rem;
		font-weight: 850;
		cursor: pointer;
	}

	.avatar-options {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 8px;
	}

	.avatar-choice {
		display: grid;
		min-height: 78px;
		justify-items: center;
		gap: 6px;
		border: 0;
		border-radius: 18px;
		background: var(--color-paper);
		color: var(--color-charcoal);
		padding: 8px 6px;
		font: inherit;
		font-size: 0.72rem;
		font-weight: 800;
		cursor: pointer;
		box-shadow: 0 8px 18px color-mix(in srgb, var(--color-charcoal) 5%, transparent);
	}

	.avatar-choice.active {
		background: var(--color-sage-soft);
		color: var(--color-success-text);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-success-text) 18%, transparent);
	}

	.avatar-preview {
		display: grid;
		width: 42px;
		height: 42px;
		overflow: hidden;
		place-items: center;
		border-radius: 15px;
		background: var(--color-peach-soft);
		color: var(--color-charcoal);
		font-size: 1rem;
		font-weight: 900;
	}

	.avatar-preview.cat img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 4px;
	}

	.avatar-preview.photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.row-label {
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 800;
	}

	.row-value {
		overflow: hidden;
		color: var(--color-ink);
		font-size: 0.9rem;
		font-weight: 700;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.sign-out {
		display: inline-flex;
		width: 100%;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 52px;
		border: 1px solid color-mix(in srgb, var(--color-danger-text) 26%, transparent);
		border-radius: var(--radius-pill);
		background: var(--color-danger-bg);
		color: var(--color-danger-text);
		font-size: 0.95rem;
		font-weight: 850;
		cursor: pointer;
	}

	.guest-panel p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.9rem;
		font-weight: 700;
	}

	.signin-button {
		display: inline-flex;
		min-height: 46px;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		padding: 0 18px;
		font-size: 0.9rem;
		font-weight: 850;
		text-decoration: none;
	}
</style>
