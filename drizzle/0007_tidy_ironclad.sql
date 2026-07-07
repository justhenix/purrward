CREATE TABLE `cat_equipped_cosmetics` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`cat_id` text NOT NULL,
	`slot` text NOT NULL,
	`item_id` text NOT NULL,
	`equipped_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cat_id`) REFERENCES `cats`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cat_equipped_cosmetics_cat_slot_idx` ON `cat_equipped_cosmetics` (`cat_id`,`slot`);--> statement-breakpoint
CREATE INDEX `cat_equipped_cosmetics_user_cat_idx` ON `cat_equipped_cosmetics` (`user_id`,`cat_id`);