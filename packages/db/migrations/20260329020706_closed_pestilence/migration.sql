PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_purchase_invoice_file` (
	`id` text PRIMARY KEY,
	`object_path` text NOT NULL,
	`filename` text NOT NULL,
	`file_type` text NOT NULL,
	`size` integer NOT NULL,
	`status` text DEFAULT 'UPLOADED' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "invoice_file_status_check" CHECK("status" IN ('UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED', 'REJECTED', 'REVIEWED'))
);
--> statement-breakpoint
INSERT INTO `__new_purchase_invoice_file`(`id`, `object_path`, `filename`, `file_type`, `size`, `status`, `created_at`, `updated_at`) SELECT `id`, `object_path`, `filename`, `file_type`, `size`, `status`, `created_at`, `updated_at` FROM `purchase_invoice_file`;--> statement-breakpoint
DROP TABLE `purchase_invoice_file`;--> statement-breakpoint
ALTER TABLE `__new_purchase_invoice_file` RENAME TO `purchase_invoice_file`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `invoice_file_status_created_at_idx` ON `purchase_invoice_file` (`status`,`created_at`);