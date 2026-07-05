CREATE TABLE `reward_redemptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`reward_id` text NOT NULL,
	`code` text NOT NULL,
	`cost` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reward_redemptions_code_unique` ON `reward_redemptions` (`code`);--> statement-breakpoint
CREATE INDEX `reward_redemptions_user_idx` ON `reward_redemptions` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`kind` text NOT NULL,
	`source` text NOT NULL,
	`acquired_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_inventory_user_item_idx` ON `user_inventory` (`user_id`,`item_id`);--> statement-breakpoint
CREATE INDEX `user_inventory_user_idx` ON `user_inventory` (`user_id`);--> statement-breakpoint
ALTER TABLE `cats` ADD `equipped_accessory_id` text;--> statement-breakpoint
ALTER TABLE `cats` ADD `background_id` text;