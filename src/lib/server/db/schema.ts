import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const task = sqliteTable('task', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	googleSub: text('google_sub').unique().notNull(),
	email: text('email').notNull(),
	displayName: text('display_name'),
	avatarUrl: text('avatar_url'),
	purrpoints: integer('purrpoints').default(0),
	createdAt: integer('created_at').notNull()
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(), // 32-byte hex secure token
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	googleSub: text('google_sub').notNull(),
	email: text('email').notNull(),
	displayName: text('display_name'),
	avatarUrl: text('avatar_url'),
	createdAt: integer('created_at').notNull(),
	expiresAt: integer('expires_at').notNull()
});

