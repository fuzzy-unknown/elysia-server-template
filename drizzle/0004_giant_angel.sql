CREATE TABLE `groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_by` text NOT NULL,
	`status` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_groups_name` ON `groups` (`name`);--> statement-breakpoint
CREATE INDEX `idx_groups_created_by` ON `groups` (`created_by`);--> statement-breakpoint
CREATE TABLE `user_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`group_id` text NOT NULL,
	`role` text,
	`joined_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_user_groups_user_group` ON `user_groups` (`user_id`,`group_id`);--> statement-breakpoint
CREATE INDEX `idx_user_groups_user_id` ON `user_groups` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_groups_group_id` ON `user_groups` (`group_id`);