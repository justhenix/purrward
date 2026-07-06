// Dev-only route sweep: records 500s and short menus into a report.
import {
	flagShortMenus,
	type MenuDescriptor,
	type MenuFlag
} from '../src/lib/server/menu-audit.ts';

// A navigable destination. Vet sub-modes share the /vet path (client-side mode switch),
// so they are listed with distinct labels but resolve to the same route.
type Route = { label: string; path: string };

// Every navigable route reachable from the bottom nav plus the new reward
// sub-pages and the vet sub-modes (Req 10.1).
const ROUTES: readonly Route[] = [
	{ label: 'Home', path: '/' },
	{ label: 'Rewards', path: '/rewards' },
	{ label: 'Reward history', path: '/rewards/history' },
	{ label: 'Partner map', path: '/rewards/partners' },
	{ label: 'Care proof (Scan)', path: '/care-proof' },
	{ label: 'Vet', path: '/vet' },
	{ label: 'Vet — AI triage mode', path: '/vet' },
	{ label: 'Vet — in-person help mode', path: '/vet' },
	{ label: 'Profile', path: '/profile' }
] as const;

// Declared inventory of the app's menus and submenus, audited for short menus (Req 10.3).
const MENU_INVENTORY: readonly MenuDescriptor[] = [
	{ name: 'Bottom navigation', itemCount: 5 },
	{ name: 'Rewards category chips', itemCount: 5 },
	{ name: 'Vet mode switch', itemCount: 2 },
	{ name: 'Reward history status tabs', itemCount: 2 }
] as const;

type RouteError = { label: string; path: string; status: number };
type SweepResult = { errors: RouteError[]; flags: MenuFlag[] };

function baseUrl(): string {
	const fromEnv = process.env.QA_BASE_URL;
	const raw = fromEnv && fromEnv.length > 0 ? fromEnv : 'http://localhost:5173';
	return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

// Issue a GET against the running dev server and record any 500 (Req 10.2).
async function sweepRoutes(base: string): Promise<RouteError[]> {
	const errors: RouteError[] = [];
	for (const route of ROUTES) {
		const url = `${base}${route.path}`;
		try {
			const response = await fetch(url, { method: 'GET', redirect: 'manual' });
			if (response.status === 500) {
				errors.push({ label: route.label, path: route.path, status: response.status });
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`Failed to reach ${url}: ${message}`);
		}
	}
	return errors;
}

// Print a single consolidated report of every recorded 500 and flagged menu (Req 10.4).
function printReport(base: string, result: SweepResult): void {
	console.log('\n=== Purrward QA Sweep ===');
	console.log(`Base URL: ${base}`);
	console.log(`Routes checked: ${ROUTES.length}`);
	console.log(`Menus audited: ${MENU_INVENTORY.length}\n`);

	console.log(`500 errors (${result.errors.length}):`);
	if (result.errors.length === 0) {
		console.log('  none');
	} else {
		for (const err of result.errors) {
			console.log(`  [500] ${err.label} -> ${err.path}`);
		}
	}

	console.log(`\nShort menus (${result.flags.length}):`);
	if (result.flags.length === 0) {
		console.log('  none');
	} else {
		for (const flag of result.flags) {
			console.log(`  [${flag.reason}] ${flag.name} (${flag.itemCount} item(s))`);
		}
	}
	console.log('\n=========================\n');
}

async function main(): Promise<void> {
	const base = baseUrl();
	const errors = await sweepRoutes(base);
	const flags = flagShortMenus([...MENU_INVENTORY]);
	printReport(base, { errors, flags });
}

// Manual runner only: `bun run scripts/qa-sweep.ts` against a running `bun run dev`.
// Never invoked in the request path.
void main();
