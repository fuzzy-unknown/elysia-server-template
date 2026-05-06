CREATE TABLE `approval_records` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`step` integer NOT NULL,
	`target_unit_id` text NOT NULL,
	`approver_id` text,
	`status` text NOT NULL,
	`comment` text,
	`approved_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`application_id`) REFERENCES `housing_applications`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_approval_records_application_id` ON `approval_records` (`application_id`);--> statement-breakpoint
CREATE INDEX `idx_approval_records_target_unit_id` ON `approval_records` (`target_unit_id`);--> statement-breakpoint
CREATE INDEX `idx_approval_records_approver_id` ON `approval_records` (`approver_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_approval_records_app_step` ON `approval_records` (`application_id`,`step`);--> statement-breakpoint
CREATE TABLE `housing_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`applicant_id` text NOT NULL,
	`reason` text NOT NULL,
	`check_in_date` integer NOT NULL,
	`check_out_date` integer NOT NULL,
	`room_id` text,
	`status` text NOT NULL,
	`remark` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`applicant_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_housing_applications_applicant_id` ON `housing_applications` (`applicant_id`);--> statement-breakpoint
CREATE INDEX `idx_housing_applications_room_id` ON `housing_applications` (`room_id`);--> statement-breakpoint
CREATE INDEX `idx_housing_applications_status` ON `housing_applications` (`status`);