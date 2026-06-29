<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import Home from '@lucide/svelte/icons/home';
	import Stethoscope from '@lucide/svelte/icons/stethoscope';
	import UserRound from '@lucide/svelte/icons/user-round';

	let { children } = $props();
</script>

<!-- Mobile app shell and primary navigation for Purrward. -->

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-shell paper-texture">
	<main class="app-content">
		{@render children()}
	</main>
</div>

<nav class="bottom-nav" aria-label="Main navigation">
	<a
		aria-current={$page.url.pathname.startsWith('/vet') ? 'page' : undefined}
		href={resolve('/vet')}
	>
		<span class="nav-icon" aria-hidden="true">
			<Stethoscope size={20} strokeWidth={2.2} />
		</span>
		<span>Vet</span>
	</a>
	<a aria-current={$page.url.pathname === '/' ? 'page' : undefined} href={resolve('/')}>
		<span class="nav-icon" aria-hidden="true">
			<Home size={20} strokeWidth={2.2} />
		</span>
		<span>Home</span>
	</a>
	<a
		aria-current={$page.url.pathname.startsWith('/profile') ? 'page' : undefined}
		href={resolve('/profile')}
	>
		<span class="nav-icon" aria-hidden="true">
			<UserRound size={20} strokeWidth={2.2} />
		</span>
		<span>Profile</span>
	</a>
</nav>

<style>
	.app-shell {
		width: min(100%, 430px);
		min-height: 100dvh;
		margin: 0 auto;
		background: var(--color-paper);
		position: relative;
		overflow: hidden;
	}

	.app-content {
		min-height: 100dvh;
		overflow-y: auto;
		padding: 18px 20px 156px;
	}

	.bottom-nav {
		position: fixed;
		left: 50%;
		bottom: 8px;
		z-index: 50;
		display: grid;
		width: min(calc(100vw - 40px), 390px);
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
		height: 68px;
		padding: 7px;
		transform: translateX(-50%);
		border: 1px solid rgba(255, 253, 248, 0.08);
		border-radius: 36px;
		background: var(--color-charcoal);
		box-shadow:
			0 18px 46px rgba(36, 38, 38, 0.22),
			0 3px 12px rgba(36, 38, 38, 0.14);
	}

	.bottom-nav a {
		display: grid;
		grid-template-rows: 34px 1fr;
		align-items: center;
		justify-content: center;
		justify-items: center;
		gap: 3px;
		min-width: 0;
		border-radius: var(--radius-pill);
		color: rgba(255, 253, 248, 0.66);
		font-size: 0.7rem;
		font-weight: 800;
		line-height: 1;
		text-decoration: none;
		transition:
			opacity 160ms ease,
			color 160ms ease;
	}

	.nav-icon {
		display: grid;
		width: 34px;
		height: 34px;
		place-items: center;
		border-radius: 50%;
		color: inherit;
	}

	.nav-icon :global(svg) {
		display: block;
	}

	.bottom-nav a[aria-current='page'] {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 6px;
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
		padding: 0 16px;
		height: 100%;
	}

	.bottom-nav a[aria-current='page'] .nav-icon {
		background: transparent;
		color: inherit;
		box-shadow: none;
	}

	@media (min-width: 768px) {
		:global(body) {
			display: flex;
			min-height: 100vh;
			justify-content: center;
			background:
				radial-gradient(circle at 20% 14%, rgba(169, 217, 232, 0.18), transparent 28%),
				radial-gradient(circle at 78% 20%, rgba(244, 191, 168, 0.14), transparent 30%),
				var(--color-paper-3);
		}

		.app-shell {
			min-height: 100vh;
			border-inline: 1px solid rgba(36, 38, 38, 0.06);
			box-shadow: 0 24px 70px rgba(36, 38, 38, 0.12);
		}
	}
</style>
