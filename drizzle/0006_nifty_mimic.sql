CREATE TABLE `partners` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`address` text NOT NULL,
	`map_x` integer NOT NULL,
	`map_y` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `partners_category_idx` ON `partners` (`category`);--> statement-breakpoint
ALTER TABLE `reward_redemptions` ADD `used_at` integer;--> statement-breakpoint
ALTER TABLE `reward_redemptions` ADD `partner_id` text;
--> statement-breakpoint
INSERT INTO `partners` (`id`, `name`, `category`, `address`, `map_x`, `map_y`, `created_at`) VALUES
	(lower(hex(randomblob(16))), 'Whiskers Veterinary Clinic', 'vet', '12 Tabby Lane', 210, 170, (unixepoch() * 1000)),
	(lower(hex(randomblob(16))), 'Paws & Claws Animal Hospital', 'vet', '88 Meadow Road', 640, 300, (unixepoch() * 1000)),
	(lower(hex(randomblob(16))), 'The Treat Nook', 'treat', '5 Biscuit Street', 340, 560, (unixepoch() * 1000)),
	(lower(hex(randomblob(16))), 'Feline Fine Cafe', 'treat', '27 Cream Avenue', 780, 620, (unixepoch() * 1000)),
	(lower(hex(randomblob(16))), 'Pounce Toy Emporium', 'toy', '9 Feather Court', 150, 720, (unixepoch() * 1000)),
	(lower(hex(randomblob(16))), 'Happy Tails Toy Shop', 'toy', '61 Yarn Way', 500, 440, (unixepoch() * 1000)),
	(lower(hex(randomblob(16))), 'Cozy Haven Cat Shelter', 'shelter', '3 Rescue Row', 860, 140, (unixepoch() * 1000));
