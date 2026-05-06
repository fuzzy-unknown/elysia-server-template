CREATE TABLE `units` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`parent_id` text,
	`status` integer NOT NULL,
	`remark` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`id_card` text,
	`unit_id` text,
	`level` text,
	`status` integer NOT NULL,
	`remark` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_username` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_id_card` ON `users` (`id_card`);--> statement-breakpoint
CREATE INDEX `idx_users_unit_id` ON `users` (`unit_id`);