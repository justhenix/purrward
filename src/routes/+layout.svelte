<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { preloadCode, preloadData } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { resolve } from '$app/paths';
	import Camera from '@lucide/svelte/icons/camera';
	import Gift from '@lucide/svelte/icons/gift';
	import Home from '@lucide/svelte/icons/home';
	import Stethoscope from '@lucide/svelte/icons/stethoscope';
	import UserRound from '@lucide/svelte/icons/user-round';
	import type { LayoutProps } from './$types';

	const NAV_ROUTES = ['/', '/rewards', '/care-proof', '/vet', '/profile'] as const;

	let { children, data }: LayoutProps = $props();
	let isAuthRoute = $derived(page.url.pathname.startsWith('/auth/'));
	// Onboarding is a pre-app welcome flow: no bottom nav or app chrome until a cat exists.
	let isOnboardingRoute = $derived(page.url.pathname === '/onboarding');
	let hideChrome = $derived(isAuthRoute || isOnboardingRoute);
	let sandboxMode = $derived(data.preferences.sandboxMode);
	let tappedPath = $state<string | null>(null);
	let tapTimer: number | null = null;
	let skeletonTimer: number | null = null;
	let showSkeleton = $state(false);
	let pendingPath = $derived(navigating.to?.url.pathname ?? tappedPath);
	let isNavigating = $derived(!hideChrome && pendingPath !== null);

	function warmRoute(href: string) {
		void preloadCode(href).catch(() => undefined);
		void preloadData(href).catch(() => undefined);
	}

	function cueRoute(href: string) {
		warmRoute(href);
		if (href === page.url.pathname) return;

		tappedPath = href;
		if (tapTimer) window.clearTimeout(tapTimer);
		tapTimer = window.setTimeout(() => {
			tappedPath = null;
			tapTimer = null;
		}, 220);
	}

	onMount(() => {
		if (hideChrome) return;

		const timer = window.setTimeout(() => {
			for (const route of NAV_ROUTES) {
				const href = resolve(route);
				if (href !== page.url.pathname) warmRoute(href);
			}
		}, 120);

		return () => window.clearTimeout(timer);
	});

	$effect(() => {
		void page.url.pathname;
		tappedPath = null;
		if (tapTimer) {
			window.clearTimeout(tapTimer);
			tapTimer = null;
		}
	});

	$effect(() => {
		if (isNavigating) {
			if (!skeletonTimer) {
				skeletonTimer = window.setTimeout(() => {
					showSkeleton = true;
					skeletonTimer = null;
				}, 90);
			}
			return;
		}

		showSkeleton = false;
		if (skeletonTimer) {
			window.clearTimeout(skeletonTimer);
			skeletonTimer = null;
		}
	});
</script>

<!-- Mobile app shell and primary navigation for Purrward. -->

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
</svelte:head>

<div class="app-shell paper-texture">
	{#if sandboxMode && !hideChrome}
		<div class="sandbox-strip" role="status">Sandbox mode</div>
	{/if}
	<main class={['app-content', hideChrome && 'auth-content']}>
		{@render children()}
	</main>
	{#if showSkeleton}
		<div class="route-skeleton" aria-hidden="true">
			<div class="skeleton-top">
				<span class="skeleton-line short"></span>
				<span class="skeleton-avatar"></span>
			</div>
			<div class="skeleton-hero">
				<span class="skeleton-cat"></span>
				<span class="skeleton-line title"></span>
				<span class="skeleton-line medium"></span>
				<span class="skeleton-button"></span>
			</div>
			<div class="skeleton-list">
				<span class="skeleton-line medium"></span>
				<span class="skeleton-row"></span>
				<span class="skeleton-row"></span>
				<span class="skeleton-row"></span>
			</div>
		</div>
	{/if}
</div>

{#if !hideChrome}
	<nav
		class="bottom-nav"
		aria-label="Main navigation"
		aria-busy={isNavigating}
		data-sveltekit-preload-data="tap"
	>
		<a
			aria-current={page.url.pathname === '/' ||
			(page.url.pathname.startsWith('/care') && !page.url.pathname.startsWith('/care-proof'))
				? 'page'
				: undefined}
			href={resolve('/')}
			data-sveltekit-preload-code="viewport"
			onpointerdown={() => cueRoute(resolve('/'))}
		>
			<span class="nav-icon" aria-hidden="true">
				<Home size={18} strokeWidth={2.15} />
			</span>
			<span>Home</span>
		</a>
		<a
			aria-current={page.url.pathname.startsWith('/rewards') ? 'page' : undefined}
			href={resolve('/rewards')}
			data-sveltekit-preload-code="viewport"
			onpointerdown={() => cueRoute(resolve('/rewards'))}
		>
			<span class="nav-icon" aria-hidden="true">
				<Gift size={18} strokeWidth={2.15} />
			</span>
			<span>Rewards</span>
		</a>
		<a
			class="nav-cta"
			aria-current={page.url.pathname.startsWith('/care-proof') ? 'page' : undefined}
			href={resolve('/care-proof')}
			data-sveltekit-preload-code="viewport"
			onpointerdown={() => cueRoute(resolve('/care-proof'))}
		>
			<span class="nav-cta-icon" aria-hidden="true">
				<Camera size={20} strokeWidth={2.35} />
			</span>
			<span>Scan</span>
		</a>
		<a
			aria-current={page.url.pathname.startsWith('/vet') ? 'page' : undefined}
			href={resolve('/vet')}
			data-sveltekit-preload-code="viewport"
			onpointerdown={() => cueRoute(resolve('/vet'))}
		>
			<span class="nav-icon" aria-hidden="true">
				<Stethoscope size={18} strokeWidth={2.15} />
			</span>
			<span>Vet</span>
		</a>
		<a
			aria-current={page.url.pathname.startsWith('/profile') ||
			page.url.pathname.startsWith('/cats')
				? 'page'
				: undefined}
			href={resolve('/profile')}
			data-sveltekit-preload-code="viewport"
			onpointerdown={() => cueRoute(resolve('/profile'))}
		>
			<span class="nav-icon" aria-hidden="true">
				<UserRound size={18} strokeWidth={2.15} />
			</span>
			<span>Profile</span>
		</a>
	</nav>
{/if}

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
		padding: 18px 20px 168px;
	}

	.app-content.auth-content {
		padding-bottom: 18px;
	}

	.sandbox-strip {
		position: sticky;
		top: 0;
		z-index: 45;
		background: var(--color-butter);
		color: var(--color-charcoal);
		padding: 7px 14px;
		text-align: center;
		font-size: 0.72rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		box-shadow: 0 8px 18px color-mix(in srgb, var(--color-charcoal) 8%, transparent);
	}

	.route-skeleton {
		position: absolute;
		inset: 0;
		z-index: 40;
		display: grid;
		align-content: start;
		gap: 18px;
		padding: 18px 20px 168px;
		background: color-mix(in srgb, var(--color-paper) 94%, transparent);
		backdrop-filter: blur(2px);
		pointer-events: none;
	}

	.skeleton-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.skeleton-hero,
	.skeleton-list {
		display: grid;
		gap: 13px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-card-lg);
		background: var(--color-paper-2);
		padding: 18px;
		box-shadow: var(--shadow-card);
	}

	.skeleton-hero {
		justify-items: center;
		min-height: 250px;
		align-content: center;
		background:
			radial-gradient(
				circle at 50% 20%,
				color-mix(in srgb, var(--color-peach-soft) 44%, transparent),
				transparent 56%
			),
			var(--color-paper-2);
	}

	.skeleton-list {
		border-radius: var(--radius-card);
	}

	.skeleton-line,
	.skeleton-avatar,
	.skeleton-cat,
	.skeleton-button,
	.skeleton-row {
		position: relative;
		overflow: hidden;
		background: color-mix(in srgb, var(--color-line) 58%, var(--color-paper-2));
	}

	.skeleton-line::after,
	.skeleton-avatar::after,
	.skeleton-cat::after,
	.skeleton-button::after,
	.skeleton-row::after {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			100deg,
			transparent 0%,
			color-mix(in srgb, var(--color-paper-2) 72%, transparent) 46%,
			transparent 78%
		);
		animation: skeleton-shimmer 1.15s ease-in-out infinite;
		content: '';
		transform: translateX(-100%);
	}

	.skeleton-line {
		display: block;
		width: 72%;
		height: 13px;
		border-radius: var(--radius-pill);
	}

	.skeleton-line.short {
		width: 46%;
		height: 28px;
	}

	.skeleton-line.title {
		width: 68%;
		height: 24px;
	}

	.skeleton-line.medium {
		width: 54%;
	}

	.skeleton-avatar {
		width: 50px;
		height: 50px;
		border-radius: 50%;
	}

	.skeleton-cat {
		width: 118px;
		height: 118px;
		border-radius: 36px;
		background:
			radial-gradient(circle at 50% 34%, var(--color-peach-soft), transparent 48%),
			color-mix(in srgb, var(--color-line) 48%, var(--color-paper-2));
	}

	.skeleton-button {
		width: 100%;
		height: 52px;
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--color-charcoal) 12%, var(--color-paper-2));
	}

	.skeleton-row {
		height: 48px;
		border-radius: 18px;
	}

	.bottom-nav {
		position: fixed;
		left: 50%;
		bottom: max(14px, env(safe-area-inset-bottom));
		z-index: 50;
		display: grid;
		width: min(calc(100vw - 32px), 382px);
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 3px;
		min-height: 68px;
		padding: 6px 7px calc(6px + env(safe-area-inset-bottom));
		transform: translateX(-50%);
		border: 1px solid color-mix(in srgb, var(--color-paper-2) 10%, transparent);
		border-radius: 36px;
		background: color-mix(in srgb, var(--color-charcoal) 86%, var(--color-paper-2));
		box-shadow:
			0 12px 28px color-mix(in srgb, var(--color-charcoal) 14%, transparent),
			0 2px 8px color-mix(in srgb, var(--color-charcoal) 8%, transparent);
	}

	.bottom-nav a {
		display: grid;
		grid-template-rows: 31px auto;
		align-items: center;
		justify-content: center;
		justify-items: center;
		gap: 2px;
		min-width: 0;
		min-height: 52px;
		border-radius: var(--radius-pill);
		color: color-mix(in srgb, var(--color-paper-2) 72%, transparent);
		font-size: 0.62rem;
		font-weight: 800;
		line-height: 1;
		text-decoration: none;
		transition:
			background 160ms ease,
			color 160ms ease,
			transform 160ms var(--ease-mobile);
		will-change: transform;
	}

	.bottom-nav a:active {
		transform: translateY(1px) scale(0.96);
	}

	.nav-icon {
		display: grid;
		width: 26px;
		height: 26px;
		place-items: center;
		border-radius: 50%;
		color: inherit;
	}

	.nav-icon :global(svg),
	.nav-cta-icon :global(svg) {
		display: block;
	}

	.bottom-nav a[aria-current='page'] {
		background: transparent;
		color: var(--color-paper-2);
		box-shadow: none;
	}

	.bottom-nav a[aria-current='page'] .nav-icon {
		width: 34px;
		height: 34px;
		background: color-mix(in srgb, var(--color-paper-2) 96%, transparent);
		color: var(--color-charcoal);
		box-shadow: 0 5px 12px color-mix(in srgb, var(--color-charcoal) 9%, transparent);
		animation: nav-pop 170ms var(--ease-bounce) both;
	}

	.bottom-nav .nav-cta {
		position: relative;
		margin-top: -18px;
		min-height: 68px;
		color: var(--color-paper-2);
		transform: translateY(-2px);
	}

	.nav-cta-icon {
		display: grid;
		width: 50px;
		height: 50px;
		place-items: center;
		border: 1px solid color-mix(in srgb, var(--color-line) 84%, transparent);
		border-radius: 50%;
		background:
			radial-gradient(
				circle at 50% 28%,
				color-mix(in srgb, var(--color-peach-soft) 86%, transparent),
				transparent 62%
			),
			var(--color-paper-2);
		color: var(--color-charcoal);
		box-shadow:
			0 10px 18px color-mix(in srgb, var(--color-charcoal) 14%, transparent),
			0 1px 0 color-mix(in srgb, var(--color-paper-2) 60%, transparent) inset;
		transition: transform 180ms var(--ease-mobile);
	}

	.bottom-nav .nav-cta:active .nav-cta-icon {
		transform: scale(0.92);
	}

	@keyframes nav-pop {
		0% {
			transform: scale(0.82);
		}
		100% {
			transform: scale(1);
		}
	}

	@keyframes skeleton-shimmer {
		100% {
			transform: translateX(100%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.bottom-nav a[aria-current='page'] .nav-icon {
			animation: none;
		}

		.skeleton-line::after,
		.skeleton-avatar::after,
		.skeleton-cat::after,
		.skeleton-button::after,
		.skeleton-row::after {
			animation: none;
		}

		.bottom-nav a,
		.nav-cta-icon {
			transition: none;
		}
	}

	.bottom-nav .nav-cta span:last-child {
		margin-top: 3px;
		color: color-mix(in srgb, var(--color-paper-2) 86%, transparent);
	}

	@media (min-width: 768px) {
		:global(body) {
			display: flex;
			min-height: 100vh;
			justify-content: center;
			background:
				radial-gradient(
					circle at 20% 14%,
					color-mix(in srgb, var(--color-sky) 18%, transparent),
					transparent 28%
				),
				radial-gradient(
					circle at 78% 20%,
					color-mix(in srgb, var(--color-peach) 14%, transparent),
					transparent 30%
				),
				var(--color-paper-3);
		}

		.app-shell {
			min-height: 100vh;
			border-inline: 1px solid color-mix(in srgb, var(--color-charcoal) 6%, transparent);
			box-shadow: 0 24px 70px color-mix(in srgb, var(--color-charcoal) 12%, transparent);
		}
	}
</style>
