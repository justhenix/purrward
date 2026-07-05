import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const task = sqliteTable('task', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	googleSub: text('google_sub').unique(),
	email: text('email').unique().notNull(),
	displayName: text('display_name'),
	avatarUrl: text('avatar_url'),
	purrpoints: integer('purrpoints').default(0),
	// Active_Cat pointer — server-owned, persists across sessions (nullable self/cat reference).
	activeCatId: text('active_cat_id'),
	createdAt: integer('created_at').notNull()
});

// Cat_Profile: one cat (owned or community) cared for by a user; owns habit completions.
export const cats = sqliteTable(
	'cats',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		name: text('name').notNull(),
		careMode: text('care_mode').notNull(), // 'owned' | 'community'
		avatarId: text('avatar_id').notNull(),
		purrpoints: integer('purrpoints').notNull().default(0), // per-cat attribution
		// Per-cat equip pointers. Null accessory = none; null background reads as 'bg_home'.
		equippedAccessoryId: text('equipped_accessory_id'),
		backgroundId: text('background_id'),
		createdAt: integer('created_at').notNull()
	},
	(table) => [
		index('cats_user_idx').on(table.userId),
		index('cats_user_created_idx').on(table.userId, table.createdAt)
	]
);

// ---------------------------------------------------------------------------
// Reward-economy roadmap tickets (shorthand used across the economy code):
//   T1 — economy schema + unified catalog + allowlists.  ← DONE (tables below + catalog.ts)
//   T2 — persist redemptions to reward_redemptions + rate-limit the redeem endpoint.
//   T3 — gacha pull endpoint: spend points, grant an unowned item into user_inventory.
//   T4 — inventory + equip endpoint: equip an owned item onto a specific cat.
// The two tables below plus the cats equip fields are the T1 foundation T2–T4 build on.
// ---------------------------------------------------------------------------

// Account-wide item ownership: a user owns each catalog item id at most once.
export const userInventory = sqliteTable(
	'user_inventory',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		itemId: text('item_id').notNull(), // allowlisted catalog id (accessory/background)
		kind: text('kind').notNull(), // 'accessory' | 'background'
		source: text('source').notNull(), // 'gacha' | 'purchase'
		acquiredAt: integer('acquired_at').notNull()
	},
	(table) => [
		// SECURITY: enforces single ownership per item and doubles as the duplicate-gacha guard.
		uniqueIndex('user_inventory_user_item_idx').on(table.userId, table.itemId),
		index('user_inventory_user_idx').on(table.userId)
	]
);

// Redeemed coupons/vet/donations that produce a server-owned code (not owned items).
export const rewardRedemptions = sqliteTable(
	'reward_redemptions',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		rewardId: text('reward_id').notNull(), // allowlisted catalog id
		code: text('code').notNull().unique(), // SECURITY: server-generated, unpredictable
		cost: integer('cost').notNull(), // point cost captured at redemption time
		status: text('status').notNull().default('active'), // room for P1 expiry/used states
		createdAt: integer('created_at').notNull()
	},
	(table) => [index('reward_redemptions_user_idx').on(table.userId)]
);

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(), // 32-byte hex secure token
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	googleSub: text('google_sub'),
	email: text('email').notNull(),
	authMethod: text('auth_method').notNull().default('google'),
	displayName: text('display_name'),
	avatarUrl: text('avatar_url'),
	createdAt: integer('created_at').notNull(),
	expiresAt: integer('expires_at').notNull()
});

export const emailCredentials = sqliteTable('email_credentials', {
	userId: text('user_id')
		.primaryKey()
		.references(() => users.id),
	passwordHash: text('password_hash').notNull(),
	passwordSalt: text('password_salt').notNull(),
	iterations: integer('iterations').notNull(),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull()
});

export const passwordResetTokens = sqliteTable(
	'password_reset_tokens',
	{
		tokenHash: text('token_hash').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		email: text('email').notNull(),
		createdAt: integer('created_at').notNull(),
		expiresAt: integer('expires_at').notNull(),
		usedAt: integer('used_at')
	},
	(table) => [
		index('password_reset_tokens_user_idx').on(table.userId),
		index('password_reset_tokens_expires_idx').on(table.expiresAt)
	]
);

export const authRateLimits = sqliteTable(
	'auth_rate_limits',
	{
		id: text('id').primaryKey(),
		scope: text('scope').notNull(),
		keyHash: text('key_hash').notNull(),
		attempts: integer('attempts').notNull(),
		resetAt: integer('reset_at').notNull(),
		updatedAt: integer('updated_at').notNull()
	},
	(table) => [index('auth_rate_limits_reset_idx').on(table.resetAt)]
);

export const habitCompletions = sqliteTable(
	'habit_completions',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		// Nullable for a safe migration of pre-cat rows; application writes always set it.
		catId: text('cat_id').references(() => cats.id),
		taskType: text('task_type').notNull(),
		verified: integer('verified').notNull(),
		pointsAwarded: integer('points_awarded').notNull().default(0),
		reason: text('reason').notNull(),
		dayStart: integer('day_start').notNull().default(0),
		createdAt: integer('created_at').notNull()
	},
	(table) => [
		index('habit_completions_user_created_idx').on(table.userId, table.createdAt),
		index('habit_completions_user_task_created_idx').on(
			table.userId,
			table.taskType,
			table.createdAt
		),
		index('habit_completions_user_day_idx').on(table.userId, table.dayStart),
		index('habit_completions_user_task_day_idx').on(table.userId, table.taskType, table.dayStart),
		index('habit_completions_cat_created_idx').on(table.catId, table.createdAt),
		index('habit_completions_user_cat_task_day_idx').on(
			table.userId,
			table.catId,
			table.taskType,
			table.dayStart
		)
	]
);

// SECURITY: app-level rate limit counters keyed by hashed IP/user + action window.
export const rateLimits = sqliteTable(
	'rate_limits',
	{
		id: text('id').primaryKey(),
		key: text('key').notNull(),
		action: text('action').notNull(),
		windowStart: integer('window_start').notNull(),
		count: integer('count').notNull(),
		updatedAt: integer('updated_at').notNull()
	},
	(table) => [index('rate_limits_action_window_idx').on(table.action, table.windowStart)]
);
