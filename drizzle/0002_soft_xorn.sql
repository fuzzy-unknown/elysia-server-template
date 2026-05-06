CREATE TABLE `unit_leaders` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`user_id` text NOT NULL,
	`sort` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_unit_leaders_unit_user` ON `unit_leaders` (`unit_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_unit_leaders_unit_id` ON `unit_leaders` (`unit_id`);--> statement-breakpoint
CREATE INDEX `idx_unit_leaders_user_id` ON `unit_leaders` (`user_id`);