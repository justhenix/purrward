ALTER TABLE `habit_completions` ADD `day_start` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `habit_completions` SET `day_start` = CAST(strftime('%s', `created_at` / 1000, 'unixepoch', 'start of day') AS integer) * 1000;--> statement-breakpoint
CREATE INDEX `habit_completions_user_day_idx` ON `habit_completions` (`user_id`,`day_start`);--> statement-breakpoint
CREATE INDEX `habit_completions_user_task_day_idx` ON `habit_completions` (`user_id`,`task_type`,`day_start`);
