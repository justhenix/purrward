<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let developerMode = $state(false);
</script>

<!-- Profile and settings screen with hidden developer access. -->

<svelte:head>
	<title>Purrward | Profile</title>
</svelte:head>

<div class="settings-screen">
	<header class="settings-header">
		<a class="back-button" href={resolve('/')} aria-label="Back to home">
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="m15 18-6-6 6-6" />
			</svg>
		</a>
		<div>
			<p>Profile</p>
			<h1>Settings</h1>
		</div>
	</header>

	<section class="profile-summary">
		<div class="profile-avatar" aria-hidden="true">
			{data.user?.displayName?.slice(0, 1) ?? 'P'}
		</div>
		<div>
			<h2>{data.user?.displayName ?? 'Cat Parent'}</h2>
			<p>{data.user ? `${data.user.purrpoints} Purrpoints` : 'Sign in to save care progress'}</p>
		</div>
	</section>

	<section class="settings-card" aria-labelledby="cat-settings-title">
		<h2 id="cat-settings-title">Cat profile</h2>
		<a href={resolve('/care')}>
			<span>Mochi care settings</span>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
		</a>
		<a href={resolve('/rewards')}>
			<span>Rewards preferences</span>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
		</a>
	</section>

	<section class="settings-card" aria-labelledby="app-preferences-title">
		<h2 id="app-preferences-title">App preferences</h2>
		<label class="toggle-row">
			<span>Gentle care reminders</span>
			<input type="checkbox" checked />
		</label>
		<label class="toggle-row">
			<span>Developer Mode</span>
			<input type="checkbox" bind:checked={developerMode} />
		</label>
		<div class="developer-note">
			<div>
				<strong>Developer Mode</strong>
				<p>For demo and technical inspection.</p>
			</div>
			<a class={['dev-link', developerMode && 'enabled']} href={resolve('/dev')}>Open</a>
		</div>
	</section>
</div>

<style>
	.settings-screen {
		display: grid;
		gap: 18px;
	}

	.settings-header {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.back-button {
		display: grid;
		width: 44px;
		height: 44px;
		place-items: center;
		border: 1px solid var(--color-line);
		border-radius: 50%;
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		box-shadow: 0 10px 24px rgba(36, 38, 38, 0.06);
	}

	.back-button svg,
	.settings-card svg {
		width: 20px;
		height: 20px;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 2.2;
	}

	.settings-header p,
	.profile-summary p,
	.developer-note p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.84rem;
		font-weight: 600;
	}

	.settings-header h1,
	.profile-summary h2,
	.settings-card h2 {
		margin: 0;
		color: var(--color-ink);
	}

	.settings-header h1 {
		font-size: 1.48rem;
	}

	.profile-summary,
	.settings-card {
		border: 1px solid var(--color-line);
		border-radius: 30px;
		background: var(--color-paper-2);
		box-shadow: var(--shadow-card);
	}

	.profile-summary {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 18px;
		background:
			radial-gradient(circle at 90% 0%, rgba(244, 191, 168, 0.22), transparent 34%),
			var(--color-paper-2);
	}

	.profile-avatar {
		display: grid;
		width: 62px;
		height: 62px;
		place-items: center;
		border-radius: 22px;
		background: var(--color-peach-soft);
		color: var(--color-charcoal);
		font-size: 1.3rem;
		font-weight: 800;
	}

	.settings-card {
		display: grid;
		gap: 8px;
		padding: 18px;
	}

	.settings-card h2 {
		font-size: 1.08rem;
	}

	.settings-card a,
	.toggle-row,
	.developer-note {
		display: flex;
		min-height: 48px;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		border-radius: 18px;
		background: var(--color-paper);
		padding: 0 14px;
		color: var(--color-charcoal);
		font-size: 0.9rem;
		font-weight: 700;
		text-decoration: none;
	}

	.toggle-row input {
		width: 22px;
		height: 22px;
		accent-color: var(--color-charcoal);
	}

	.developer-note {
		min-height: auto;
		align-items: flex-start;
		padding-block: 14px;
	}

	.developer-note strong {
		display: block;
		margin-bottom: 3px;
		color: var(--color-ink);
	}

	.dev-link {
		min-height: 34px;
		border-radius: var(--radius-pill);
		background: var(--color-paper-3);
		padding: 8px 12px;
		color: var(--color-muted);
		pointer-events: none;
	}

	.dev-link.enabled {
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		pointer-events: auto;
	}
</style>
