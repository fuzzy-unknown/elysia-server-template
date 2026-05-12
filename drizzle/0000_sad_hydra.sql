CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text,
	`phone` text,
	`email` text,
	`password` text,
	`nickname` text,
	`avatar` text,
	`gender` integer NOT NULL,
	`birthday` text,
	`device_type` text NOT NULL,
	`device_model` text,
	`app_version` text,
	`os_version` text,
	`last_login_at` integer,
	`last_login_ip` text,
	`status` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_username` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_phone` ON `users` (`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_last_login` ON `users` (`last_login_at`);