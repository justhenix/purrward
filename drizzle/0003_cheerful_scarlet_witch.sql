PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`google_sub` text,
	`email` text NOT NULL,
	`display_name` text,
	`avatar_url` text,
	`purrpoints` integer DEFAULT 0,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users` (`id`, `google_sub`, `email`, `display_name`, `avatar_url`, `purrpoints`, `created_at`)
SELECT `id`, `google_sub`, lower(`email`), `display_name`, `avatar_url`, `purrpoints`, `created_at` FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_sub_unique` ON `users` (`google_sub`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`google_sub` text,
	`email` text NOT NULL,
	`auth_method` text DEFAULT 'google' NOT NULL,
	`display_name` text,
	`avatar_url` text,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sessions` (`id`, `user_id`, `google_sub`, `email`, `auth_method`, `display_name`, `avatar_url`, `created_at`, `expires_at`)
SELECT `id`, `user_id`, `google_sub`, lower(`email`), 'google', `display_name`, `avatar_url`, `created_at`, `expires_at` FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `auth_rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`key_hash` text NOT NULL,
	`attempts` integer NOT NULL,
	`reset_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_rate_limits_reset_idx` ON `auth_rate_limits` (`reset_at`);--> statement-breakpoint
CREATE TABLE `email_credentials` (
	`user_id` text PRIMARY KEY NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`iterations` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `password_reset_tokens_user_idx` ON `password_reset_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `password_reset_tokens_expires_idx` ON `password_reset_tokens` (`expires_at`);
