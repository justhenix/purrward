<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { onNavigate, preloadCode, preloadData, invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { getOfflineProofs, deleteOfflineProof } from '$lib/offline-db';
	import blueSplash from '$lib/assets/paint_splash/blue_splash.webp';
	import pinkSplash from '$lib/assets/paint_splash/pink_splash.webp';
	import yellowSplash from '$lib/assets/paint_splash/yellow_splash.webp';
	import pawBlue from '$lib/assets/paw/paw_blue.webp';
	import Camera from '@lucide/svelte/icons/camera';
	import Gift from '@lucide/svelte/icons/gift';
	import Home from '@lucide/svelte/icons/home';
	import Stethoscope from '@lucide/svelte/icons/stethoscope';
	import UserRound from '@lucide/svelte/icons/user-round';
	import type { LayoutProps } from './$types';

	const NAV_ROUTES = ['/', '/rewards', '/care-proof', '/vet', '/profile'] as const;

	type ViewTransition = {
		finished: Promise<void>;
		ready: Promise<void>;
		updateCallbackDone: Promise<void>;
		skipTransition: () => void;
	};
	type ViewTransitionDocument = Document & {
		startViewTransition?: (callback: () => Promise<void> | void) => ViewTransition;
	};

	let { children, data }: LayoutProps = $props();
	let isAuthRoute = $derived(page.url.pathname.startsWith('/auth/'));
	// Onboarding is a pre-app welcome flow: no bottom nav or app chrome until a cat exists.
	let isOnboardingRoute = $derived(page.url.pathname === '/onboarding');
	let isDocsRoute = $derived(
		page.url.pathname.startsWith('/docs') || page.url.pathname.startsWith('/dev-docs')
	);
	let isHomeRoute = $derived(page.url.pathname === '/');
	let isCareProofRoute = $derived(page.url.pathname.startsWith('/care-proof'));
	let isDevRoute = $derived(page.url.pathname.startsWith('/dev'));
	let isRewardsRoute = $derived(page.url.pathname.startsWith('/rewards'));
	let isVetRoute = $derived(page.url.pathname.startsWith('/vet'));
	let hideChrome = $derived(isAuthRoute || isOnboardingRoute || isDocsRoute);
	let showDecor = $derived(!isHomeRoute && !isCareProofRoute && !isDevRoute);
	let sandboxMode = $derived(data.preferences.sandboxMode);
	let isHomeNavActive = $derived(
		page.url.pathname === '/' ||
			(page.url.pathname.startsWith('/care') && !page.url.pathname.startsWith('/care-proof'))
	);
	let isRewardsNavActive = $derived(page.url.pathname.startsWith('/rewards'));
	let isCareNavActive = $derived(page.url.pathname.startsWith('/care-proof'));
	let isVetNavActive = $derived(page.url.pathname.startsWith('/vet'));
	let isProfileNavActive = $derived(
		page.url.pathname.startsWith('/profile') || page.url.pathname.startsWith('/cats')
	);

	$effect(() => {
		if (typeof document !== 'undefined') {
			if (isDocsRoute) {
				document.documentElement.setAttribute('data-is-docs', 'true');
				document.body.setAttribute('data-is-docs', 'true');
			} else {
				document.documentElement.removeAttribute('data-is-docs');
				document.body.removeAttribute('data-is-docs');
			}
		}
	});

	function warmRoute(href: string) {
		void preloadCode(href).catch(() => undefined);
		void preloadData(href).catch(() => undefined);
	}

	function cueRoute(href: string) {
		warmRoute(href);
	}

	onNavigate((navigation) => {
		if (typeof document === 'undefined') return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const transitionDocument = document as ViewTransitionDocument;
		if (!transitionDocument.startViewTransition) return;

		return new Promise<void>((resolveTransition) => {
			transitionDocument.startViewTransition(async () => {
				resolveTransition();
				await navigation.complete;
			});
		});
	});

	onMount(() => {
		void syncOfflineProofs();
		window.addEventListener('online', syncOfflineProofs);

		if (hideChrome) {
			return () => {
				window.removeEventListener('online', syncOfflineProofs);
			};
		}

		const timer = window.setTimeout(() => {
			for (const route of NAV_ROUTES) {
				const href = resolve(route);
				if (href !== page.url.pathname) warmRoute(href);
			}
		}, 120);

		return () => {
			window.clearTimeout(timer);
			window.removeEventListener('online', syncOfflineProofs);
		};
	});

	let globalToast = $state<string | null>(null);
	let syncTimer: number | null = null;

	async function syncOfflineProofs() {
		if (typeof window === 'undefined' || !navigator.onLine) return;
		try {
			const proofs = await getOfflineProofs(data.user?.id ?? 'sandbox');
			if (proofs.length === 0) return;

			globalToast = 'Syncing offline care...';

			let successCount = 0;
			for (const proof of proofs) {
				const body = new FormData();
				body.set('taskType', proof.taskType);
				body.set('photo', proof.photo, `${proof.taskType}-proof.jpg`);

				try {
					const response = await fetch(`/api/verify?catId=${proof.catId}`, {
						method: 'POST',
						body
					});
					if (response.ok) {
						const json = (await response.json()) as { verified?: boolean };
						if (json.verified) {
							if (proof.id !== undefined) {
								await deleteOfflineProof(proof.id);
								successCount++;
							}
						}
					}
				} catch (err) {
					console.error('Failed to sync offline proof:', err);
				}
			}

			if (successCount > 0) {
				globalToast = `Synced ${successCount} offline care tasks!`;
				await invalidate('app:cat');
			} else {
				globalToast = null;
			}

			if (syncTimer) window.clearTimeout(syncTimer);
			syncTimer = window.setTimeout(() => {
				globalToast = null;
				syncTimer = null;
			}, 3000);
		} catch (err) {
			console.error('Offline sync failed:', err);
			globalToast = null;
		}
	}
</script>

<!-- Mobile app shell and primary navigation for Purrward. -->

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
</svelte:head>

{#if isDocsRoute}
	<div class="docs-root">
		{@render children()}
	</div>
{:else}
	<div
		class="app-shell paper-texture"
		style={`--splash-blue: url(${blueSplash}); --splash-pink: url(${pinkSplash}); --splash-yellow: url(${yellowSplash}); --paw-blue: url(${pawBlue});`}
	>
		{#if sandboxMode && !hideChrome}
			<div class="sandbox-strip" role="status">Sandbox mode</div>
		{/if}
		{#if showDecor}
			<div
				class={[
					'page-decor',
					isOnboardingRoute ? 'page-decor-playful' : 'page-decor-soft',
					isAuthRoute && 'page-decor-auth',
					isRewardsRoute && 'page-decor-rewards',
					isVetRoute && 'page-decor-vet'
				]}
				aria-hidden="true"
			></div>
		{/if}
		<main class={['app-content', hideChrome && 'auth-content', isVetRoute && 'vet-content']}>
			{@render children()}
		</main>
	</div>
{/if}

{#if !hideChrome}
	<nav class="bottom-nav" aria-label="Main navigation" data-sveltekit-preload-data="tap">
		<a
			aria-current={isHomeNavActive ? 'page' : undefined}
			href={resolve('/')}
			data-sveltekit-preload-code="viewport"
			onpointerdown={() => cueRoute(resolve('/'))}
		>
			<span class="nav-icon" aria-hidden="true">
				<Home
					size={23}
					strokeWidth={isHomeNavActive ? 2.7 : 2.15}
					fill={isHomeNavActive ? 'currentColor' : 'none'}
				/>
			</span>
			<span>Home</span>
		</a>
		<a
			aria-current={isRewardsNavActive ? 'page' : undefined}
			href={resolve('/rewards')}
			data-sveltekit-preload-code="viewport"
			onpointerdown={() => cueRoute(resolve('/rewards'))}
		>
			<span class="nav-icon" aria-hidden="true">
				<Gift
					size={23}
					strokeWidth={isRewardsNavActive ? 2.7 : 2.15}
					fill={isRewardsNavActive ? 'currentColor' : 'none'}
				/>
			</span>
			<span>Rewards</span>
		</a>
		<a
			aria-current={isCareNavActive ? 'page' : undefined}
			href={resolve('/care-proof')}
			data-sveltekit-preload-code="viewport"
			onpointerdown={() => cueRoute(resolve('/care-proof'))}
		>
			<span class="nav-icon" aria-hidden="true">
				<Camera
					size={23}
					strokeWidth={isCareNavActive ? 2.7 : 2.15}
					fill={isCareNavActive ? 'currentColor' : 'none'}
				/>
			</span>
			<span>Care</span>
		</a>
		<a
			aria-current={isVetNavActive ? 'page' : undefined}
			href={resolve('/vet')}
			data-sveltekit-preload-code="viewport"
			onpointerdown={() => cueRoute(resolve('/vet'))}
		>
			<span class="nav-icon" aria-hidden="true">
				<Stethoscope
					size={23}
					strokeWidth={isVetNavActive ? 2.7 : 2.15}
					fill={isVetNavActive ? 'currentColor' : 'none'}
				/>
			</span>
			<span>Vet</span>
		</a>
		<a
			aria-current={isProfileNavActive ? 'page' : undefined}
			href={resolve('/profile')}
			data-sveltekit-preload-code="viewport"
			onpointerdown={() => cueRoute(resolve('/profile'))}
		>
			<span class="nav-icon" aria-hidden="true">
				<UserRound
					size={23}
					strokeWidth={isProfileNavActive ? 2.7 : 2.15}
					fill={isProfileNavActive ? 'currentColor' : 'none'}
				/>
			</span>
			<span>Profile</span>
		</a>
	</nav>
{/if}

{#if globalToast}
	<div class="toast" role="status" aria-live="polite">
		{globalToast}
	</div>
{/if}

<style>
	.app-shell {
		width: min(100%, 430px);
		min-height: 100svh;
		margin: 0 auto;
		background: var(--color-paper);
		position: relative;
		overflow-x: hidden;
		isolation: isolate;
	}

	.docs-root {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: var(--color-paper, #fdf8ef);
	}

	:global(html[data-is-docs='true']),
	:global(body[data-is-docs='true']) {
		height: 100% !important;
		width: 100% !important;
		margin: 0 !important;
		padding: 0 !important;
		overflow: hidden !important;
		display: block !important;
		background: var(--color-paper, #fdf8ef) !important;
	}

	.page-decor {
		position: absolute;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.page-decor::before,
	.page-decor::after {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background-repeat: no-repeat;
		content: '';
	}

	.page-decor::before {
		background-image: var(--splash-blue), var(--splash-yellow), var(--splash-pink);
		background-position:
			left -120px top 150px,
			right -130px top 72px,
			right -122px bottom 128px;
		background-size:
			clamp(200px, 58vw, 300px) auto,
			clamp(160px, 46vw, 240px) auto,
			clamp(220px, 64vw, 320px) auto;
		opacity: 0.07;
	}

	.page-decor::after {
		display: none;
	}

	.page-decor-auth::before {
		background-position:
			left -124px top 84px,
			right -136px top 18px,
			right -128px bottom 64px;
		opacity: 0.065;
	}

	.page-decor-rewards::before {
		opacity: 0.065;
	}

	.page-decor-vet::before {
		background-image: var(--splash-blue), var(--splash-yellow);
		background-position:
			left -130px top 116px,
			right -132px top 48px;
		background-size:
			clamp(180px, 50vw, 260px) auto,
			clamp(160px, 42vw, 220px) auto;
		opacity: 0.045;
	}

	.page-decor-playful::before {
		background-image: var(--splash-blue), var(--splash-yellow);
		background-position:
			left -136px bottom 36px,
			right -132px top 8px;
		background-size:
			clamp(190px, 50vw, 260px) auto,
			clamp(160px, 42vw, 220px) auto;
		opacity: 0.055;
	}

	.page-decor-playful::after {
		display: block;
		background-image: var(--paw-blue), var(--paw-blue);
		background-position:
			left 18px top 122px,
			right 28px bottom 44px;
		background-size:
			clamp(24px, 7vw, 36px) auto,
			clamp(24px, 6vw, 32px) auto;
		opacity: 0.1;
	}

	.app-content {
		position: relative;
		z-index: 1;
		box-sizing: border-box;
		min-height: 100svh;
		padding: 18px 20px var(--app-page-bottom);
		-webkit-overflow-scrolling: touch;
	}

	.app-content.auth-content {
		padding-bottom: 18px;
	}

	.app-content.vet-content {
		height: 100dvh;
		overflow: hidden;
		padding-bottom: var(--app-safe-bottom);
	}

	@supports (height: 100dvh) {
		.app-shell,
		.app-content {
			min-height: 100dvh;
		}
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

	.bottom-nav {
		position: fixed;
		left: 50%;
		bottom: max(12px, env(safe-area-inset-bottom));
		z-index: 50;
		display: grid;
		width: min(calc(100vw - 32px), 386px);
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 0;
		min-height: 76px;
		padding: 8px 8px calc(8px + env(safe-area-inset-bottom));
		transform: translateX(-50%);
		border: 1px solid color-mix(in srgb, var(--nav-text) 10%, transparent);
		border-radius: 30px;
		background: color-mix(in srgb, var(--nav-surface) 96%, transparent);
		box-shadow: 0 6px 16px color-mix(in srgb, var(--color-charcoal) 10%, transparent);
		isolation: isolate;
	}

	.bottom-nav a {
		position: relative;
		display: grid;
		grid-template-rows: 24px auto;
		align-items: center;
		justify-content: center;
		justify-items: center;
		gap: 4px;
		min-width: 0;
		min-height: 56px;
		padding: 6px 2px 8px;
		border-radius: var(--radius-pill);
		color: color-mix(in srgb, var(--nav-text) 62%, transparent);
		font-size: 0.7rem;
		font-weight: 500;
		line-height: 1;
		text-decoration: none;
		transition:
			color 180ms ease,
			opacity 180ms ease,
			transform 180ms ease;
		will-change: transform;
	}

	.bottom-nav a::after {
		position: absolute;
		bottom: 2px;
		left: 50%;
		width: 14px;
		height: 2px;
		border-radius: var(--radius-pill);
		background: var(--nav-active-chip);
		content: '';
		opacity: 0;
		transform: translateX(-50%);
		transition: opacity 180ms ease;
	}

	.bottom-nav a:active {
		transform: translateY(1px);
	}

	.bottom-nav a:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--nav-active-chip) 52%, transparent);
		outline-offset: 2px;
	}

	.nav-icon {
		display: grid;
		width: 24px;
		height: 24px;
		place-items: center;
		color: inherit;
	}

	.nav-icon :global(svg) {
		display: block;
	}

	.bottom-nav a[aria-current='page'] {
		color: var(--nav-active-chip);
		font-weight: 700;
	}

	.bottom-nav a[aria-current='page']::after {
		opacity: 0.82;
	}

	@media (prefers-reduced-motion: reduce) {
		.bottom-nav a::after {
			transition: none;
		}

		.bottom-nav a {
			transition:
				color 180ms ease,
				opacity 180ms ease;
		}
	}

	:global(:root[data-theme='dark']) .page-decor::before {
		opacity: 0.045;
	}

	:global(:root[data-theme='dark']) .page-decor-auth::before,
	:global(:root[data-theme='dark']) .page-decor-rewards::before {
		opacity: 0.04;
	}

	:global(:root[data-theme='dark']) .page-decor-vet::before,
	:global(:root[data-theme='dark']) .page-decor-playful::before {
		opacity: 0.03;
	}

	:global(:root[data-theme='dark']) .page-decor-playful::after {
		opacity: 0.065;
	}

	@media (prefers-color-scheme: dark) {
		:global(:root[data-theme='system']) .page-decor::before {
			opacity: 0.045;
		}

		:global(:root[data-theme='system']) .page-decor-auth::before,
		:global(:root[data-theme='system']) .page-decor-rewards::before {
			opacity: 0.04;
		}

		:global(:root[data-theme='system']) .page-decor-vet::before,
		:global(:root[data-theme='system']) .page-decor-playful::before {
			opacity: 0.03;
		}

		:global(:root[data-theme='system']) .page-decor-playful::after {
			opacity: 0.065;
		}
	}

	@media (min-width: 768px) {
		:global(body:not([data-is-docs='true'])) {
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

	.toast {
		position: fixed;
		left: 50%;
		bottom: var(--app-safe-bottom);
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
</style>
