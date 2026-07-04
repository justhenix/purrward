<!-- Profile home: account summary, active cat, and a grouped Manage menu. -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import Bell from '@lucide/svelte/icons/bell';
	import Cat from '@lucide/svelte/icons/cat';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import LifeBuoy from '@lucide/svelte/icons/life-buoy';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import UserRound from '@lucide/svelte/icons/user-round';
	import logo from '$lib/assets/logo/logo.svg';
	import { getCatAvatar } from '$lib/cat-avatars';
	import { deriveParentName } from '$lib/account-identity';
	import { resolveProfileAvatar } from '$lib/profile-avatar';
	import type { PageProps } from './$types';

	const DEVELOPER_KEY = 'purrward:developer-unlocked';
	const TAP_TARGET = 7;
	const TAP_RESET_MS = 3000;

	let { data }: PageProps = $props();

	let parentName = $derived(deriveParentName(data.user));
	let profileAvatar = $derived(resolveProfileAvatar(data.user, data.preferences.avatarChoice));
	let activeCatAvatar = $derived(data.activeCat ? getCatAvatar(data.activeCat.avatarId) : null);

	let developerUnlocked = $state(false);
	let tapCount = $state(0);
	let toast = $state<string | null>(null);
	let tapTimer: number | null = null;
	let toastTimer: number | null = null;

	onMount(() => {
		developerUnlocked = localStorage.getItem(DEVELOPER_KEY) === '1';
	});

	function showToast(message: string) {
		toast = message;
		if (toastTimer) window.clearTimeout(toastTimer);
		toastTimer = window.setTimeout(() => {
			toast = null;
			toastTimer = null;
		}, 2400);
	}

	// Hidden developer unlock: seven taps on the app logo within a short window.
	function tapLogo() {
		if (developerUnlocked) return;

		tapCount += 1;
		if (tapTimer) window.clearTimeout(tapTimer);
		tapTimer = window.setTimeout(() => {
			tapCount = 0;
			tapTimer = null;
		}, TAP_RESET_MS);

		if (tapCount === TAP_TARGET - 2) showToast('2 taps left');

		if (tapCount >= TAP_TARGET) {
			developerUnlocked = true;
			localStorage.setItem(DEVELOPER_KEY, '1');
			tapCount = 0;
			if (tapTimer) {
				window.clearTimeout(tapTimer);
				tapTimer = null;
			}
			showToast('Developer mode unlocked');
		}
	}
</script>

<svelte:head>
	<title>Purrward | Profile</title>
</svelte:head>

<div class="profile-screen">
	<header class="profile-header">
		<a class="back-button" href={resolve('/')} aria-label="Back to home">
			<ChevronLeft size={23} strokeWidth={2.3} aria-hidden="true" />
		</a>
		<h1>Profile</h1>
		<button class="logo-button" type="button" onclick={tapLogo} aria-label="Purrward">
			<img src={logo} alt="" width="24" height="24" />
		</button>
	</header>

	{#if data.user}
		<a class="summary-card" href={resolve('/profile/settings')} aria-label="Open profile settings">
			<span class="summary-avatar" aria-hidden="true">
				{#if profileAvatar.kind === 'image'}
					<img class={profileAvatar.cat ? undefined : 'photo'} src={profileAvatar.src} alt="" />
				{:else}
					<span class="letter">{profileAvatar.letter}</span>
				{/if}
			</span>
			<span class="summary-copy">
				<strong>{parentName}</strong>
				<small>{data.user.email}</small>
			</span>
			<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
		</a>
	{:else}
		<section class="summary-card">
			<span class="summary-avatar" aria-hidden="true"><span class="letter">G</span></span>
			<span class="summary-copy">
				<strong>Guest</strong>
				<small>Sign in to save progress.</small>
			</span>
			<a class="signin-link" href={resolve('/auth/login')}>Sign in</a>
		</section>
	{/if}

	<a class="cat-card" href={resolve('/cats')} aria-labelledby="cat-card-title">
		<span class="cat-art" aria-hidden="true">
			{#if activeCatAvatar}
				<img src={activeCatAvatar.src} alt="" />
			{:else}
				<Cat size={38} strokeWidth={1.8} />
			{/if}
		</span>
		<span class="cat-copy">
			<small>{data.activeCat ? 'Active cat' : 'Your cats'}</small>
			<strong id="cat-card-title">{data.activeCat ? data.activeCat.name : 'Add a cat'}</strong>
			{#if data.activeCat}
				<span class="progress-text">
					{data.careStats.completedCount} of {data.careStats.totalCount} today
				</span>
			{/if}
		</span>
		<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
	</a>

	<h2 class="section-label">Manage</h2>
	<nav class="manage" aria-label="Manage">
		<a class="menu-row" href={resolve('/profile/settings')}>
			<span class="menu-icon"><UserRound size={19} strokeWidth={2.2} aria-hidden="true" /></span>
			<span class="menu-copy">
				<strong>Profile settings</strong>
				<small>Name, picture, email</small>
			</span>
			<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
		</a>

		<a class="menu-row" href={resolve('/cats')}>
			<span class="menu-icon"><Cat size={19} strokeWidth={2.2} aria-hidden="true" /></span>
			<span class="menu-copy">
				<strong>My cats</strong>
				<small>Cats and care profiles</small>
			</span>
			<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
		</a>

		<a class="menu-row" href={resolve('/profile/reminders')}>
			<span class="menu-icon"><Bell size={19} strokeWidth={2.2} aria-hidden="true" /></span>
			<span class="menu-copy">
				<strong>Reminders</strong>
				<small>Daily care nudges</small>
			</span>
			<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
		</a>

		<a class="menu-row" href={resolve('/profile/privacy')}>
			<span class="menu-icon"><ShieldCheck size={19} strokeWidth={2.2} aria-hidden="true" /></span>
			<span class="menu-copy">
				<strong>Privacy</strong>
				<small>Privacy, terms, cookies</small>
			</span>
			<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
		</a>

		<a class="menu-row" href={resolve('/profile/help')}>
			<span class="menu-icon"><LifeBuoy size={19} strokeWidth={2.2} aria-hidden="true" /></span>
			<span class="menu-copy">
				<strong>Help</strong>
				<small>Search guides and FAQs</small>
			</span>
			<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
		</a>

		{#if developerUnlocked}
			<a class="menu-row" href={resolve('/profile/developer')}>
				<span class="menu-icon">
					<FlaskConical size={19} strokeWidth={2.2} aria-hidden="true" />
				</span>
				<span class="menu-copy">
					<strong>Developer</strong>
					<small>Test tools</small>
				</span>
				<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
			</a>
		{/if}
	</nav>
</div>

{#if toast}
	<div class="toast" role="status" aria-live="polite">{toast}</div>
{/if}

<style>
	.profile-screen {
		display: grid;
		gap: 14px;
	}

	.profile-header {
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

	.profile-header h1 {
		margin: 0;
		flex: 1 1 auto;
		color: var(--color-ink);
		font-size: 1.5rem;
	}

	.logo-button {
		display: grid;
		width: 38px;
		height: 38px;
		flex: 0 0 auto;
		place-items: center;
		overflow: hidden;
		border: 1px solid var(--color-line);
		border-radius: 14px;
		background: var(--color-paper-2);
		padding: 0;
		cursor: pointer;
	}

	.logo-button img {
		display: block;
		width: 24px;
		height: 24px;
		object-fit: contain;
	}

	.summary-card,
	.cat-card,
	.menu-row {
		display: grid;
		align-items: center;
		border: 1px solid var(--color-line);
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		text-decoration: none;
	}

	.summary-card {
		grid-template-columns: 64px 1fr auto;
		gap: 14px;
		border-radius: 28px;
		padding: 16px;
		box-shadow: var(--shadow-card);
	}

	.summary-avatar {
		display: grid;
		width: 64px;
		height: 64px;
		overflow: hidden;
		place-items: center;
		border-radius: 22px;
		background: var(--color-peach-soft);
		color: var(--color-charcoal);
	}

	.summary-avatar img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 7px;
	}

	.summary-avatar img.photo {
		padding: 0;
		object-fit: cover;
	}

	.summary-avatar .letter {
		font-size: 1.5rem;
		font-weight: 900;
	}

	.summary-copy {
		min-width: 0;
	}

	.summary-copy strong {
		display: block;
		overflow: hidden;
		color: var(--color-ink);
		font-size: 1.12rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.summary-copy small {
		display: block;
		overflow: hidden;
		margin-top: 3px;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 650;
		text-overflow: ellipsis;
		white-space: nowrap;
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
		grid-template-columns: 72px 1fr auto;
		gap: 14px;
		border-radius: 28px;
		padding: 16px;
		box-shadow: var(--shadow-card);
	}

	.cat-art {
		display: grid;
		width: 72px;
		height: 72px;
		place-items: center;
		border: 1px solid var(--color-line);
		border-radius: 24px;
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

	.cat-copy {
		min-width: 0;
	}

	.cat-copy small {
		display: block;
		color: var(--color-muted);
		font-size: 0.78rem;
		font-weight: 800;
	}

	.cat-copy strong {
		display: block;
		overflow: hidden;
		margin: 3px 0;
		color: var(--color-ink);
		font-size: 1.12rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.progress-text {
		display: block;
		margin-top: 4px;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.section-label {
		margin: 6px 0 -4px 4px;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.manage {
		display: grid;
		border: 1px solid var(--color-line);
		border-radius: 24px;
		background: var(--color-paper-2);
		overflow: hidden;
		box-shadow: var(--shadow-card);
	}

	.menu-row {
		grid-template-columns: 46px 1fr auto;
		gap: 12px;
		border-radius: 0;
		padding: 13px 16px;
	}

	.menu-row + .menu-row {
		border-top: 1px solid var(--color-line);
	}

	.menu-icon {
		display: grid;
		width: 46px;
		height: 46px;
		place-items: center;
		border-radius: 16px;
		background: var(--color-paper-3);
		color: var(--color-charcoal);
	}

	.menu-copy {
		min-width: 0;
	}

	.menu-copy strong {
		display: block;
		margin-bottom: 2px;
		color: var(--color-ink);
		font-size: 0.92rem;
	}

	.menu-copy small {
		display: block;
		overflow: hidden;
		color: var(--color-muted);
		font-size: 0.76rem;
		font-weight: 650;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.toast {
		position: fixed;
		left: 50%;
		bottom: calc(96px + env(safe-area-inset-bottom));
		z-index: 60;
		max-width: min(88vw, 340px);
		transform: translateX(-50%);
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		padding: 10px 18px;
		font-size: 0.82rem;
		font-weight: 800;
		text-align: center;
		box-shadow: var(--shadow-card);
	}

	@media (max-width: 390px) {
		.summary-card {
			grid-template-columns: 56px 1fr auto;
		}

		.summary-avatar {
			width: 56px;
			height: 56px;
		}
	}
</style>
