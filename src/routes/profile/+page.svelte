<!-- Profile home: account summary, active cat, quick settings, and a menu list. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import Bell from '@lucide/svelte/icons/bell';
	import Cat from '@lucide/svelte/icons/cat';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import LifeBuoy from '@lucide/svelte/icons/life-buoy';
	import PawPrint from '@lucide/svelte/icons/paw-print';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import UserRound from '@lucide/svelte/icons/user-round';
	import { getCatAvatar } from '$lib/cat-avatars';
	import { avatarInitial, deriveParentName } from '$lib/account-identity';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let careReminders = $derived(data.preferences.careReminders);
	let sandboxMode = $derived(data.preferences.sandboxMode);

	let parentName = $derived(deriveParentName(data.user));
	let initial = $derived(avatarInitial(data.user));
	let selectedCatAvatar = $derived(getCatAvatar(data.preferences.avatarChoice));
	let activeCatName = $derived(data.activeCat?.name ?? 'Add a cat');
	let activeCatAvatar = $derived(data.activeCat ? getCatAvatar(data.activeCat.avatarId) : null);
	let catCount = $derived(data.cats?.length ?? 0);
	let catsSubtitle = $derived(
		catCount > 0 ? `${catCount} ${catCount === 1 ? 'cat' : 'cats'}` : 'Your cats'
	);
	let carePercent = $derived(
		Math.round((data.careStats.completedCount / data.careStats.totalCount) * 100)
	);

	function savePreference(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		input.form?.requestSubmit();
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
	</header>

	{#if data.user}
		<a class="summary-card" href={resolve('/profile/settings')} aria-label="Open profile settings">
			<span class="summary-avatar" aria-hidden="true">
				{#if selectedCatAvatar}
					<img src={selectedCatAvatar.src} alt="" />
				{:else}
					<span class="letter">{initial}</span>
				{/if}
			</span>
			<span class="summary-copy">
				<strong>{parentName}</strong>
				<small>{data.user.email}</small>
			</span>
			<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
		</a>
	{:else}
		<section class="summary-card guest">
			<span class="summary-avatar" aria-hidden="true"><span class="letter">P</span></span>
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
			<small>{catsSubtitle}</small>
			<strong id="cat-card-title">{activeCatName}</strong>
			<span class="progress-track" aria-label={`Daily care ${carePercent}% complete`}>
				<span style={`width: ${carePercent}%`}></span>
			</span>
		</span>
		<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
	</a>

	<form class="settings-panel" method="POST" action="?/preferences" aria-labelledby="prefs-title">
		<div class="panel-heading">
			<h2 id="prefs-title">Quick settings</h2>
			<p>Saved here.</p>
		</div>

		<label class="setting-row">
			<span class="setting-icon sky"><Bell size={20} strokeWidth={2.2} aria-hidden="true" /></span>
			<span class="setting-copy">
				<strong>Daily reminder</strong>
				<small>Get a gentle care nudge.</small>
			</span>
			<input
				name="careReminders"
				type="checkbox"
				bind:checked={careReminders}
				onchange={savePreference}
				aria-label="Daily reminder"
			/>
		</label>

		<label class="setting-row">
			<span class="setting-icon peach">
				<ShieldCheck size={20} strokeWidth={2.2} aria-hidden="true" />
			</span>
			<span class="setting-copy">
				<strong>Sandbox mode</strong>
				<small>Test mode.</small>
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

	<nav class="menu" aria-label="Profile menu">
		<a class="menu-row" href={resolve('/profile/settings')}>
			<span class="menu-icon"><UserRound size={19} strokeWidth={2.2} aria-hidden="true" /></span>
			<span class="menu-copy">
				<strong>Profile settings</strong>
				<small>Name, picture, email</small>
			</span>
			<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
		</a>
		<a class="menu-row" href={resolve('/cats')}>
			<span class="menu-icon"><PawPrint size={19} strokeWidth={2.2} aria-hidden="true" /></span>
			<span class="menu-copy">
				<strong>My cats</strong>
				<small>{catsSubtitle}</small>
			</span>
			<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
		</a>
		<a class="menu-row" href={resolve('/profile/privacy')}>
			<span class="menu-icon"><ShieldCheck size={19} strokeWidth={2.2} aria-hidden="true" /></span>
			<span class="menu-copy">
				<strong>Privacy</strong>
				<small>Data and account</small>
			</span>
			<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
		</a>
		<a class="menu-row" href={resolve('/profile/help')}>
			<span class="menu-icon"><LifeBuoy size={19} strokeWidth={2.2} aria-hidden="true" /></span>
			<span class="menu-copy">
				<strong>Help</strong>
				<small>Tips and answers</small>
			</span>
			<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
		</a>
	</nav>

	{#if sandboxMode}
		<a class="dev-link" href={resolve('/dev')}>
			<span class="menu-icon"><FlaskConical size={19} strokeWidth={2.2} aria-hidden="true" /></span>
			<span class="menu-copy">
				<strong>Dev mode</strong>
				<small>Sandbox traces</small>
			</span>
			<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
		</a>
	{/if}
</div>

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
		color: var(--color-ink);
		font-size: 1.5rem;
	}

	.summary-card,
	.cat-card,
	.menu-row,
	.dev-link {
		display: grid;
		align-items: center;
		border: 1px solid var(--color-line);
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		text-decoration: none;
		box-shadow: var(--shadow-card);
	}

	.summary-card {
		grid-template-columns: 64px 1fr auto;
		gap: 14px;
		border-radius: 28px;
		padding: 16px;
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
		margin: 3px 0 8px;
		color: var(--color-ink);
		font-size: 1.12rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.progress-track {
		display: block;
		height: 9px;
		overflow: hidden;
		border-radius: var(--radius-pill);
		background: var(--color-paper-3);
	}

	.progress-track span {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, var(--color-sage), var(--color-sky));
	}

	.settings-panel {
		display: grid;
		gap: 10px;
		border: 1px solid var(--color-line);
		border-radius: 28px;
		background: var(--color-paper-2);
		padding: 18px;
		box-shadow: var(--shadow-card);
	}

	.panel-heading {
		display: grid;
		gap: 3px;
		margin-bottom: 2px;
	}

	.panel-heading h2 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.14rem;
	}

	.panel-heading p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 800;
	}

	.setting-row {
		display: grid;
		grid-template-columns: 46px 1fr auto;
		gap: 12px;
		align-items: center;
		border-radius: 20px;
		background: var(--color-paper);
		padding: 12px;
	}

	.setting-icon {
		display: grid;
		width: 46px;
		height: 46px;
		place-items: center;
		border-radius: 16px;
		color: var(--color-charcoal);
	}

	.setting-icon.sky {
		background: var(--color-sky-soft);
	}

	.setting-icon.peach {
		background: var(--color-peach-soft);
	}

	.setting-copy {
		min-width: 0;
	}

	.setting-copy strong,
	.menu-copy strong {
		display: block;
		margin-bottom: 2px;
		color: var(--color-ink);
		font-size: 0.92rem;
	}

	.setting-copy small,
	.menu-copy small {
		display: block;
		overflow: hidden;
		color: var(--color-muted);
		font-size: 0.76rem;
		font-weight: 650;
		text-overflow: ellipsis;
		white-space: nowrap;
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

	.menu {
		display: grid;
		gap: 10px;
	}

	.menu-row,
	.dev-link {
		grid-template-columns: 46px 1fr auto;
		gap: 12px;
		border-radius: 22px;
		padding: 13px 14px;
	}

	.dev-link {
		border-style: dashed;
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
