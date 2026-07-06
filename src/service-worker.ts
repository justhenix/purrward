/// <reference types="@sveltejs/kit" />
// Minimal PWA service worker: precache the app shell + static assets, never cache API/auth responses.
import { build, files, version } from '$service-worker';

const CACHE = `purrward-cache-${version}`;
// App shell + immutable build assets and static files (icons, robots, manifest).
const PRECACHE = [...build, ...files];

// SECURITY: never cache authenticated/dynamic responses.
const NO_CACHE_PREFIXES = ['/api/', '/auth/'];

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
	sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
			)
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== location.origin) return;
	if (NO_CACHE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return;

	// Cache-first for precached build/static assets.
	if (PRECACHE.includes(url.pathname)) {
		event.respondWith(
			caches.open(CACHE).then(async (cache) => (await cache.match(request)) ?? fetch(request))
		);
		return;
	}

	// SECURITY: never intercept page navigations. Re-issuing fetch(event.request) from the
	// service worker drops the just-set SameSite=Strict `session` cookie on the post-login
	// redirect, so the landing page renders as a guest until a manual refresh. Page HTML is
	// also per-user and auth-dependent, so it must never be cached. Let the browser handle
	// navigations natively so the session cookie is sent correctly.
	if (request.mode === 'navigate') return;

	// Network-first for other same-origin GET assets, falling back to cache when offline.
	event.respondWith(
		fetch(request)
			.then((response) => {
				if (response.ok && response.type === 'basic') {
					const clone = response.clone();
					caches.open(CACHE).then((cache) => cache.put(request, clone));
				}
				return response;
			})
			.catch(async () => (await caches.match(request)) ?? Response.error())
	);
});
