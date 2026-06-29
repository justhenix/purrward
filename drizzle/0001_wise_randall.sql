CREATE TABLE `habit_completions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`task_type` text NOT NULL,
	`verified` integer NOT NULL,
	`points_awarded` integer DEFAULT 0 NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `habit_completions_user_created_idx` ON `habit_completions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `habit_completions_user_task_created_idx` ON `habit_completions` (`user_id`,`task_type`,`created_at`);