<script lang="ts">
	import { resolve } from '$app/paths';
	import Bell from '@lucide/svelte/icons/bell';
	import Cat from '@lucide/svelte/icons/cat';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import CircleDollarSign from '@lucide/svelte/icons/circle-dollar-sign';
	import Heart from '@lucide/svelte/icons/heart';
	import LogOut from '@lucide/svelte/icons/log-out';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let careReminders = $derived(data.preferences.careReminders);
	let developerMode = $derived(data.preferences.developerMode);

	let profileInitial = $derived(data.user?.displayName?.slice(0, 1).toUpperCase() ?? 'P');
	let carePercent = $derived(
		Math.round((data.careStats.completedCount / data.careStats.totalCount) * 100)
	);
	let lastVerifiedText = $derived(
		data.careStats.lastVerifiedAt
			? new Date(data.careStats.lastVerifiedAt).toLocaleTimeString([], {
					hour: '2-digit',
					minute: '2-digit'
				})
			: 'No proof yet today'
	);

	function savePreference(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		input.form?.requestSubmit();
	}
</script>

<!-- Profile and settings screen for account, care stats, and preferences. -->

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
			{#if data.user?.avatarUrl}
				<img src={data.user.avatarUrl} alt="" />
			{:else}
				<span>{profileInitial}</span>
			{/if}
		</div>
		<div class="identity-copy">
			<span>{data.user ? 'Signed in' : 'Guest mode'}</span>
			<h2>{data.user?.displayName ?? 'Cat Parent'}</h2>
			<p>{data.user ? data.user.email : 'Sign in to keep care progress and rewards saved.'}</p>
		</div>
		{#if data.user}
			<form method="POST" action={resolve('/auth/logout')}>
				<button class="icon-action" type="submit" aria-label="Sign out">
					<LogOut size={19} strokeWidth={2.2} aria-hidden="true" />
				</button>
			</form>
		{:else}
			<a class="signin-link" href={resolve('/auth/google')}>Sign in</a>
		{/if}
	</section>

	<section class="cat-card" aria-labelledby="cat-card-title">
		<div class="cat-art" aria-hidden="true">
			<Cat size={42} strokeWidth={1.8} />
		</div>
		<div class="cat-copy">
			<p>Mochi</p>
			<h2 id="cat-card-title">
				{data.careStats.completedCount} of {data.careStats.totalCount} routines verified
			</h2>
			<div class="progress-track" aria-label={`Daily care ${carePercent}% complete`}>
				<span style={`width: ${carePercent}%`}></span>
			</div>
			<small>Last proof: {lastVerifiedText}</small>
		</div>
	</section>

	<section class="quick-grid" aria-label="Profile shortcuts">
		<a class="quick-card" href={resolve('/care')}>
			<span class="quick-icon sage"><Heart size={20} strokeWidth={2.2} aria-hidden="true" /></span>
			<span>
				<strong>Care plan</strong>
				<small>Review daily routines</small>
			</span>
			<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
		</a>
		<a class="quick-card" href={resolve('/rewards')}>
			<span class="quick-icon butter">
				<CircleDollarSign size={20} strokeWidth={2.2} aria-hidden="true" />
			</span>
			<span>
				<strong>{data.user?.purrpoints ?? 0} Purrpoints</strong>
				<small>Redeem care rewards</small>
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
				<strong>Gentle care reminders</strong>
				<small>Show soft prompts for daily care.</small>
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
				<strong>Developer mode</strong>
				<small>Show judge-facing technical notes.</small>
			</span>
			<input
				name="developerMode"
				type="checkbox"
				bind:checked={developerMode}
				onchange={savePreference}
				aria-label="Developer mode"
			/>
		</label>

		{#if developerMode}
			<a class="dev-card" href={resolve('/dev')}>
				<span class="setting-icon butter"
					><Sparkles size={20} strokeWidth={2.2} aria-hidden="true" /></span
				>
				<span>
					<strong>Open developer notes</strong>
					<small>Security checks and verification trace.</small>
				</span>
				<ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
			</a>
		{/if}
	</form>
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
		border: 1px solid rgba(36, 38, 38, 0.08);
		border-radius: 50%;
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		box-shadow: 0 10px 24px rgba(36, 38, 38, 0.06);
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
		border: 1px solid rgba(232, 222, 203, 0.9);
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
			radial-gradient(circle at 92% 0%, rgba(244, 191, 168, 0.24), transparent 34%),
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
		grid-template-columns: 86px 1fr;
		gap: 16px;
		align-items: center;
		border-radius: 34px;
		padding: 18px;
		background:
			radial-gradient(circle at 8% 8%, rgba(196, 237, 243, 0.34), transparent 34%),
			radial-gradient(circle at 92% 92%, rgba(204, 226, 198, 0.32), transparent 34%),
			var(--color-paper-2);
	}

	.cat-art {
		display: grid;
		width: 86px;
		height: 86px;
		place-items: center;
		border: 1px solid rgba(36, 38, 38, 0.08);
		border-radius: 30px;
		background:
			radial-gradient(circle at 36% 24%, rgba(248, 207, 187, 0.44), transparent 42%),
			var(--color-paper);
		color: var(--color-charcoal);
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
	.setting-copy small,
	.dev-card small {
		color: var(--color-muted);
		font-size: 0.74rem;
		font-weight: 650;
		line-height: 1.3;
	}

	.quick-grid {
		display: grid;
		gap: 10px;
	}

	.quick-card,
	.dev-card,
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
	.setting-copy strong,
	.dev-card strong {
		display: block;
		margin-bottom: 2px;
		color: var(--color-ink);
		font-size: 0.92rem;
		line-height: 1.15;
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

	.panel-heading {
		display: grid;
		gap: 4px;
		margin-bottom: 2px;
	}

	.panel-heading h2 {
		font-size: 1.14rem;
	}

	.setting-row,
	.dev-card {
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
		border: 1px solid rgba(36, 38, 38, 0.14);
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
		box-shadow: 0 2px 8px rgba(36, 38, 38, 0.18);
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

		.cat-art {
			width: 72px;
			height: 72px;
			border-radius: 26px;
		}
	}
</style>
