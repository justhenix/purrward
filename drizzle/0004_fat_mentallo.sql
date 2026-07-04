CREATE TABLE `cats` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`care_mode` text NOT NULL,
	`avatar_id` text NOT NULL,
	`purrpoints` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cats_user_idx` ON `cats` (`user_id`);--> statement-breakpoint
CREATE INDEX `cats_user_created_idx` ON `cats` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`action` text NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_limits_action_window_idx` ON `rate_limits` (`action`,`window_start`);--> statement-breakpoint
ALTER TABLE `habit_completions` ADD `cat_id` text REFERENCES cats(id);--> statement-breakpoint
CREATE INDEX `habit_completions_cat_created_idx` ON `habit_completions` (`cat_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `habit_completions_user_cat_task_day_idx` ON `habit_completions` (`user_id`,`cat_id`,`task_type`,`day_start`);--> statement-breakpoint
ALTER TABLE `users` ADD `active_cat_id` text;

--> statement-breakpoint
INSERT INTO `cats` (`id`, `user_id`, `name`, `care_mode`, `avatar_id`, `purrpoints`, `created_at`)
SELECT lower(hex(randomblob(16))), `id`, 'Mochi', 'owned', 'orange', COALESCE(`purrpoints`, 0), `created_at`
FROM `users`
WHERE NOT EXISTS (SELECT 1 FROM `cats` WHERE `cats`.`user_id` = `users`.`id`);--> statement-breakpoint
UPDATE `users` SET `active_cat_id` = (
	SELECT `c`.`id` FROM `cats` `c` WHERE `c`.`user_id` = `users`.`id` ORDER BY `c`.`created_at` DESC LIMIT 1
) WHERE `active_cat_id` IS NULL;--> statement-breakpoint
UPDATE `habit_completions` SET `cat_id` = (
	SELECT `c`.`id` FROM `cats` `c` WHERE `c`.`user_id` = `habit_completions`.`user_id` ORDER BY `c`.`created_at` ASC LIMIT 1
) WHERE `cat_id` IS NULL;
