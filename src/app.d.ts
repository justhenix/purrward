// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		// interface Error {}
		interface Locals {
			user: {
				id: string;
				googleSub: string | null;
				email: string;
				displayName: string | null;
				avatarUrl: string | null;
				purrpoints: number;
			} | null;
			session: {
				id: string;
				userId: string;
				googleSub: string | null;
				email: string;
				authMethod: 'google' | 'email';
				expiresAt: number;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
