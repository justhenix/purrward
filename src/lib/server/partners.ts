// Server-owned partner directory queries + seed data.
import { eq } from 'drizzle-orm';
import { partners } from './db/schema';

type Database = typeof import('./db').db;

export type Partner = {
	id: string;
	name: string;
	category: string;
	address: string;
	mapX: number;
	mapY: number;
};

// Lists every partner for the map mockup, omitting createdAt from the returned shape.
export async function listPartners(database: Database): Promise<Partner[]> {
	const rows = await database
		.select({
			id: partners.id,
			name: partners.name,
			category: partners.category,
			address: partners.address,
			mapX: partners.mapX,
			mapY: partners.mapY
		})
		.from(partners);
	return rows;
}

// Resolves a single partner by id, narrowing the untrusted id (null when not a string or not found).
export async function findPartner(database: Database, id: unknown): Promise<Partner | null> {
	if (typeof id !== 'string') return null;
	const rows = await database
		.select({
			id: partners.id,
			name: partners.name,
			category: partners.category,
			address: partners.address,
			mapX: partners.mapX,
			mapY: partners.mapY
		})
		.from(partners)
		.where(eq(partners.id, id))
		.limit(1);
	return rows[0] ?? null;
}
