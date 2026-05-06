CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`room_number` text NOT NULL,
	`room_type` text NOT NULL,
	`room_status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_rooms_room_number` ON `rooms` (`room_number`);