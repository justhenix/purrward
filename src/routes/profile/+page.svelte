<script lang="ts">
	import { resolve } from '$app/paths';
	import Bell from '@lucide/svelte/icons/bell';
	import Cat from '@lucide/svelte/icons/cat';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import CircleDollarSign from '@lucide/svelte/icons/circle-dollar-sign';
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import Heart from '@lucide/svelte/icons/heart';
	import LogOut from '@lucide/svelte/icons/log-out';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import { CAT_AVATARS, getCatAvatar } from '$lib/cat-avatars';
	import { isRenderableAvatarUrl } from '$lib/avatar-url';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let avatarFailed = $state(false);
	let deleteOpen = $state(false);
	let deleteConfirm = $state('');
	let googleAvatarFailed = $state(false);
	let careReminders = $derived(data.preferences.careReminders);
	let sandboxMode = $derived(data.preferences.sandboxMode);
	let balance = $derived(sandboxMode ? 999999 : (data.user?.purrpoints ?? 0));

	let profileInitial = $derived(data.user?.displayName?.slice(0, 1).toUpperCase() ?? 'P');
	let googleAvatarUrl = $derived(data.user?.avatarUrl ?? null);
	let selectedCatAvatar = $derived(data.user ? getCatAvatar(data.preferences.avatarChoice) : null);
	let avatarUrl = $derived(selectedCatAvatar?.src ?? googleAvatarUrl);
	let activeCatName = $derived(data.activeCat?.name ?? 'Add a cat');
	let activeCatAvatar = $derived(data.activeCat ? getCatAvatar(data.activeCat.avatarId) : null);
	let catCount = $derived(data.cats?.length ?? 0);
	let canRenderAvatar = $derived(!avatarFailed && isRenderableAvatarUrl(avatarUrl));
	let canRenderGoogleAvatar = $derived(
		!googleAvatarFailed && isRenderableAvatarUrl(googleAvatarUrl)
	);
	let carePercent = $derived(
		Math.round((data.careStats.completedCount / data.careStats.totalCount) * 100)
	);
	let lastVerifiedText = $derived(
		data.careStats.lastVerifiedAt
			? new Date(data.careStats.lastVerifiedAt).toLocaleTimeString([], {
					hour: '2-digit',
					minute: '2-digit'
				})
			: 'No proof yet'
	);

	function savePreference(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		input.form?.requestSubmit();
	}
</script>

<!-- Profile and settings screen for account, care stats, and preferences. -->

{#snippet googleMark(size = 28)}
	<svg
		class="google-mark"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		aria-hidden="true"
		focusable="false"
	>
		<path
			fill="#4285f4"
			d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
		/>
		<path
			fill="#34a853"
			d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
		/>
		<path
			fill="#fbbc05"
			d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.23 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
		/>
		<path
			fill="#ea4335"
			d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
		/>
	</svg>
{/snippet}

<svelte:head>
	<title>Purrward | Profile</title>
</svelte:head>

<div class="profile-screen">
	<header class="profile-header">
		<a class="back-button" href={resolve('/')} aria-label="Back to home">
			<ChevronLeft size={23} strokeWidth={2.3} aria-hidden="true" />
		</a>
		<div>
			<p>Profile</p>
			<h1>Care settings</h1>
		</div>
	</header>

	<section class="identity-card" aria-label="Account summary">
		<div class="profile-avatar" aria-hidden="true">
			{#if canRenderAvatar && avatarUrl}
				<img
					class={selectedCatAvatar ? 'cat-avatar-img' : undefined}
					src={avatarUrl}
					alt=""
					onerror={() => (avatarFailed = true)}
				/>
			{:else if data.user && data.preferences.avatarChoice === 'google'}
				{@render googleMark(34)}
			{:else}
				<span>{profileInitial}</span>
			{/if}
		</div>
		<div class="identity-copy">
			<span>{data.user ? 'Signed in' : 'Guest mode'}</span>
			<h2>{data.user?.displayName ?? 'Cat Parent'}</h2>
			<p>{data.user ? data.user.email : 'Sign in to save progress.'}</p>
		</div>
		{#if data.user}
			<form method="POST" action={resolve('/auth/logout')}>
				<button class="icon-action" type="submit" aria-label="Sign out">
					<LogOut size={19} strokeWidth={2.2} aria-hidden="true" />
				</button>
			</form>
		{:else}
			<a class="signin-link" href={resolve('/auth/login')}>Sign in</a>
		{/if}
	</section>

	{#if data.user}
		<form class="avatar-panel" method="POST" action="?/avatar" aria-labelledby="avatar-title">
			<div class="panel-heading">
				<h2 id="avatar-title">Profile picture</h2>
				<p>Choose Google or cat.</p>
			</div>
			<div class="avatar-options">
				<button
					class={['avatar-choice', data.preferences.avatarChoice === 'google' && 'active']}
					type="submit"
					name="avatarChoice"
					value="google"
					aria-pressed={data.preferences.avatarChoice === 'google'}
				>
					<span class="avatar-preview">
						{#if canRenderGoogleAvatar && googleAvatarUrl}
							<img src={googleAvatarUrl} alt="" onerror={() => (googleAvatarFailed = true)} />
						{:else}
							{@render googleMark(26)}
						{/if}
					</span>
					<span>Google</span>
				</button>
				{#each CAT_AVATARS as avatar (avatar.id)}
					<button
						class={['avatar-choice', data.preferences.avatarChoice === avatar.id && 'active']}
						type="submit"
						name="avatarChoice"
						value={avatar.id}
						aria-pressed={data.preferences.avatarChoice === avatar.id}
					>
						<span class="avatar-preview cat">
							<img src={avatar.src} alt="" />
						</span>
						<span>{avatar.label}</span>
					</button>
				{/each}
			</div>
		</form>
	{/if}

	<a class="cat-card" href={resolve('/cats')} aria-labelledby="cat-card-title">
		<div class="cat-art" aria-hidden="true">
			{#if activeCatAvatar}
				<img src={activeCatAvatar.src} alt="" />
			{:else}
				<Cat size={42} strokeWidth={1.8} />
			{/if}
		</div>
		<div class="cat-copy">
			<p>{activeCatName}{catCount > 1 ? ` · ${catCount} cats` : ''}</p>
			<h2 id="cat-card-title">
				{data.careStats.completedCount} of {data.careStats.totalCount} verified
			</h2>
			<div class="progress-track" aria-label={`Daily care ${carePercent}% complete`}>
				<span style={`width: ${carePercent}%`}></span>
			</div>
			<small>Last proof: {lastVerifiedText}</small>
		</div>
		<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
	</a>

	<section class="quick-grid" aria-label="Profile shortcuts">
		<a class="quick-card" href={resolve('/care')}>
			<span class="quick-icon sage"><Heart size={20} strokeWidth={2.2} aria-hidden="true" /></span>
			<span>
				<strong>Care plan</strong>
				<small>Daily routines</small>
			</span>
			<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
		</a>
		<a class="quick-card" href={resolve('/rewards')}>
			<span class="quick-icon butter">
				<CircleDollarSign size={20} strokeWidth={2.2} aria-hidden="true" />
			</span>
			<span>
				<strong>{balance} Purrpoints</strong>
				<small>{sandboxMode ? 'Sandbox test balance' : 'Care rewards'}</small>
			</span>
			<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
		</a>
	</section>

	<form class="settings-panel" method="POST" action="?/preferences" aria-labelledby="prefs-title">
		<div class="panel-heading">
			<h2 id="prefs-title">Preferences</h2>
			<p>Saved on this device.</p>
		</div>

		<label class="setting-row">
			<span class="setting-icon sky"><Bell size={20} strokeWidth={2.2} aria-hidden="true" /></span>
			<span class="setting-copy">
				<strong>Care reminders</strong>
				<small>Soft care prompts.</small>
			</span>
			<input
				name="careReminders"
				type="checkbox"
				bind:checked={careReminders}
				onchange={savePreference}
				aria-label="Gentle care reminders"
			/>
		</label>

		<label class="setting-row">
			<span class="setting-icon peach"
				><ShieldCheck size={20} strokeWidth={2.2} aria-hidden="true" /></span
			>
			<span class="setting-copy">
				<strong>Sandbox mode</strong>
				<small>Use test points and fast proof checks.</small>
			</span>
			<input
				name="sandboxMode"
				type="checkbox"
				bind:checked={sandboxMode}
				onchange={savePreference}
				aria-label="Sandbox mode"
			/>
		</label>
	</form>

	{#if data.user}
		<section class="danger-zone" aria-labelledby="danger-title">
			<div class="panel-heading">
				<h2 id="danger-title">Delete account</h2>
				<p>Removes your cats, care history, and sign-in.</p>
			</div>
			{#if !deleteOpen}
				<button class="danger-toggle" type="button" onclick={() => (deleteOpen = true)}>
					Delete my account
				</button>
			{:else}
				<form method="POST" action="?/deleteAccount" class="danger-form">
					<label class="field">
						<span>Type DELETE to confirm</span>
						<input
							name="confirm"
							bind:value={deleteConfirm}
							autocomplete="off"
							placeholder="DELETE"
						/>
					</label>
					{#if form?.deleteError}
						<p class="field-error">{form.message}</p>
					{/if}
					<div class="danger-actions">
						<button class="danger-cancel" type="button" onclick={() => (deleteOpen = false)}>
							Cancel
						</button>
						<button class="danger-confirm" type="submit" disabled={deleteConfirm !== 'DELETE'}>
							Delete forever
						</button>
					</div>
				</form>
			{/if}
		</section>
	{/if}

	{#if sandboxMode}
		<a class="dev-link" href={resolve('/dev')}>
			<span class="dev-link-icon" aria-hidden="true">
				<FlaskConical size={20} strokeWidth={2.2} />
			</span>
			<span>
				<strong>Dev Mode · Technical Evidence</strong>
				<small>Sandbox verification traces and security checks.</small>
			</span>
			<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
		</a>
	{/if}
</div>

<style>
	.profile-screen {
		display: grid;
		gap: 18px;
	}

	.profile-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding-top: 4px;
	}

	.back-button,
	.icon-action {
		display: grid;
		width: 46px;
		height: 46px;
		flex: 0 0 auto;
		place-items: center;
		border: 1px solid color-mix(in srgb, var(--color-charcoal) 8%, transparent);
		border-radius: 50%;
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		box-shadow: 0 10px 24px color-mix(in srgb, var(--color-charcoal) 6%, transparent);
	}

	.icon-action {
		cursor: pointer;
	}

	.profile-header p,
	.identity-copy span,
	.cat-copy p,
	.panel-heading p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.84rem;
		font-weight: 800;
	}

	.profile-header h1,
	.identity-copy h2,
	.cat-copy h2,
	.panel-heading h2 {
		margin: 0;
		color: var(--color-ink);
	}

	.profile-header h1 {
		font-size: 1.5rem;
		line-height: 1.05;
	}

	.identity-card,
	.cat-card,
	.quick-card,
	.settings-panel {
		border: 1px solid color-mix(in srgb, var(--color-line) 90%, transparent);
		background: var(--color-paper-2);
		box-shadow: var(--shadow-card);
	}

	.identity-card {
		display: grid;
		grid-template-columns: 70px 1fr auto;
		gap: 14px;
		align-items: center;
		border-radius: 32px;
		padding: 18px;
		background:
			radial-gradient(
				circle at 92% 0%,
				color-mix(in srgb, var(--color-peach) 24%, transparent),
				transparent 34%
			),
			var(--color-paper-2);
	}

	.profile-avatar {
		display: grid;
		width: 70px;
		height: 70px;
		overflow: hidden;
		place-items: center;
		border-radius: 26px;
		background: var(--color-peach-soft);
		color: var(--color-charcoal);
		font-size: 1.35rem;
		font-weight: 900;
	}

	.profile-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.profile-avatar img.cat-avatar-img {
		padding: 8px;
		object-fit: contain;
	}

	.google-mark {
		display: block;
	}

	.identity-copy {
		min-width: 0;
	}

	.identity-copy h2 {
		margin-top: 4px;
		overflow: hidden;
		font-size: 1.14rem;
		line-height: 1.12;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.identity-copy p {
		overflow: hidden;
		margin: 5px 0 0;
		color: var(--color-charcoal);
		font-size: 0.82rem;
		font-weight: 650;
		line-height: 1.3;
		text-overflow: ellipsis;
	}

	.signin-link {
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		padding: 10px 14px;
		font-size: 0.78rem;
		font-weight: 900;
		text-decoration: none;
		white-space: nowrap;
	}

	.cat-card {
		display: grid;
		grid-template-columns: 86px 1fr auto;
		gap: 16px;
		align-items: center;
		border-radius: 34px;
		padding: 18px;
		color: var(--color-charcoal);
		text-decoration: none;
		background:
			radial-gradient(
				circle at 8% 8%,
				color-mix(in srgb, var(--color-sky-soft) 34%, transparent),
				transparent 34%
			),
			radial-gradient(
				circle at 92% 92%,
				color-mix(in srgb, var(--color-sage-soft) 32%, transparent),
				transparent 34%
			),
			var(--color-paper-2);
	}

	.cat-art {
		display: grid;
		width: 86px;
		height: 86px;
		place-items: center;
		border: 1px solid color-mix(in srgb, var(--color-charcoal) 8%, transparent);
		border-radius: 30px;
		background:
			radial-gradient(
				circle at 36% 24%,
				color-mix(in srgb, var(--color-peach-soft) 44%, transparent),
				transparent 42%
			),
			var(--color-paper);
		color: var(--color-charcoal);
		overflow: hidden;
	}

	.cat-art img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 8px;
	}

	.cat-copy h2 {
		margin-top: 5px;
		font-size: 1.15rem;
		line-height: 1.12;
	}

	.progress-track {
		height: 10px;
		overflow: hidden;
		margin: 12px 0 8px;
		border-radius: var(--radius-pill);
		background: var(--color-paper-3);
	}

	.progress-track span {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, var(--color-sage), var(--color-sky));
	}

	.cat-copy small,
	.quick-card small,
	.setting-copy small {
		overflow: hidden;
		color: var(--color-muted);
		font-size: 0.74rem;
		font-weight: 650;
		line-height: 1.3;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.quick-grid {
		display: grid;
		gap: 10px;
	}

	.quick-card,
	.setting-row {
		display: grid;
		grid-template-columns: 46px 1fr auto;
		gap: 12px;
		align-items: center;
		border-radius: 24px;
		padding: 14px;
		color: var(--color-charcoal);
		text-decoration: none;
	}

	.quick-card strong,
	.setting-copy strong {
		display: block;
		overflow: hidden;
		margin-bottom: 2px;
		color: var(--color-ink);
		font-size: 0.92rem;
		line-height: 1.15;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.quick-icon,
	.setting-icon {
		display: grid;
		width: 46px;
		height: 46px;
		place-items: center;
		border-radius: 18px;
		color: var(--color-charcoal);
	}

	.quick-icon.sage {
		background: var(--color-sage-soft);
	}

	.quick-icon.butter,
	.setting-icon.butter {
		background: var(--color-butter);
	}

	.setting-icon.sky {
		background: var(--color-sky-soft);
	}

	.setting-icon.peach {
		background: var(--color-peach-soft);
	}

	.settings-panel {
		display: grid;
		gap: 10px;
		border-radius: 34px;
		padding: 18px;
	}

	.danger-zone {
		display: grid;
		gap: 12px;
		border: 1px solid color-mix(in srgb, var(--color-danger-text) 22%, transparent);
		border-radius: 30px;
		background: var(--color-paper-2);
		padding: 16px;
		box-shadow: var(--shadow-card);
	}

	.danger-toggle,
	.danger-cancel,
	.danger-confirm {
		min-height: 48px;
		border-radius: var(--radius-pill);
		font: inherit;
		font-size: 0.9rem;
		font-weight: 850;
		cursor: pointer;
	}

	.danger-toggle {
		border: 1px solid color-mix(in srgb, var(--color-danger-text) 30%, transparent);
		background: var(--color-danger-bg);
		color: var(--color-danger-text);
	}

	.danger-form {
		display: grid;
		gap: 12px;
	}

	.danger-form .field {
		display: grid;
		gap: 6px;
	}

	.danger-form .field span {
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 800;
	}

	.danger-form input {
		border: 1px solid var(--color-line);
		border-radius: 14px;
		background: var(--color-paper);
		color: var(--color-ink);
		padding: 11px 13px;
		font: inherit;
	}

	.field-error {
		margin: 0;
		color: var(--color-danger-text);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.danger-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.danger-cancel {
		border: 1px solid var(--color-line);
		background: var(--color-paper);
		color: var(--color-charcoal);
	}

	.danger-confirm {
		border: 0;
		background: var(--color-danger-text);
		color: var(--color-paper-2);
	}

	.danger-confirm:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.dev-link {
		display: grid;
		grid-template-columns: 46px 1fr auto;
		gap: 12px;
		align-items: center;
		border: 1px dashed color-mix(in srgb, var(--color-charcoal) 22%, transparent);
		border-radius: 24px;
		background: var(--color-paper-2);
		padding: 14px;
		color: var(--color-charcoal);
		text-decoration: none;
		box-shadow: var(--shadow-card);
	}

	.dev-link strong {
		display: block;
		overflow: hidden;
		margin-bottom: 2px;
		color: var(--color-ink);
		font-size: 0.92rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dev-link small {
		overflow: hidden;
		color: var(--color-muted);
		font-size: 0.74rem;
		font-weight: 650;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dev-link-icon {
		display: grid;
		width: 46px;
		height: 46px;
		place-items: center;
		border-radius: 18px;
		background: var(--color-butter);
		color: var(--color-charcoal);
	}

	.avatar-panel {
		display: grid;
		gap: 12px;
		border: 1px solid color-mix(in srgb, var(--color-line) 90%, transparent);
		border-radius: 30px;
		background: var(--color-paper-2);
		padding: 16px;
		box-shadow: var(--shadow-card);
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
		border-radius: 20px;
		background: var(--color-paper);
		color: var(--color-charcoal);
		padding: 8px 6px;
		font: inherit;
		font-size: 0.72rem;
		font-weight: 850;
		cursor: pointer;
		box-shadow: 0 8px 18px color-mix(in srgb, var(--color-charcoal) 5%, transparent);
	}

	.avatar-choice.active {
		background: var(--color-sage-soft);
		color: var(--color-success-text);
		box-shadow:
			0 10px 22px color-mix(in srgb, var(--color-charcoal) 8%, transparent),
			inset 0 0 0 1px color-mix(in srgb, var(--color-success-text) 16%, transparent);
	}

	.avatar-preview {
		display: grid;
		width: 42px;
		height: 42px;
		overflow: hidden;
		place-items: center;
		border-radius: 16px;
		background: var(--color-peach-soft);
		color: var(--color-charcoal);
		font-size: 0.9rem;
		font-weight: 900;
	}

	.avatar-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-preview.cat img {
		padding: 4px;
		object-fit: contain;
	}

	.panel-heading {
		display: grid;
		gap: 4px;
		margin-bottom: 2px;
	}

	.panel-heading p {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.panel-heading h2 {
		font-size: 1.14rem;
	}

	.setting-row {
		border: 0;
		background: var(--color-paper);
	}

	.setting-copy {
		min-width: 0;
	}

	.setting-row input {
		appearance: none;
		position: relative;
		width: 48px;
		height: 30px;
		border: 1px solid color-mix(in srgb, var(--color-charcoal) 14%, transparent);
		border-radius: var(--radius-pill);
		background: var(--color-paper-3);
		cursor: pointer;
		transition: background 140ms ease;
	}

	.setting-row input::after {
		content: '';
		position: absolute;
		top: 4px;
		left: 4px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-paper-2);
		box-shadow: 0 2px 8px color-mix(in srgb, var(--color-charcoal) 18%, transparent);
		transition: transform 140ms ease;
	}

	.setting-row input:checked {
		background: var(--color-charcoal);
	}

	.setting-row input:checked::after {
		transform: translateX(18px);
	}

	@media (max-width: 390px) {
		.identity-card {
			grid-template-columns: 62px 1fr;
		}

		.identity-card form,
		.identity-card .signin-link {
			grid-column: 1 / -1;
			justify-self: stretch;
			text-align: center;
		}

		.icon-action {
			width: 100%;
			border-radius: var(--radius-pill);
		}

		.cat-card {
			grid-template-columns: 72px 1fr;
		}

		.avatar-options {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.cat-art {
			width: 72px;
			height: 72px;
			border-radius: 26px;
		}
	}
</style>
