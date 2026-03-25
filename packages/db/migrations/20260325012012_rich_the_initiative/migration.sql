CREATE TABLE `purchase_invoice_file` (
	`id` text PRIMARY KEY,
	`object_path` text NOT NULL,
	`filename` text NOT NULL,
	`file_type` text NOT NULL,
	`size` integer NOT NULL,
	`status` text DEFAULT 'UPLOADED' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "invoice_file_status_check" CHECK("status" IN ('UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED', 'REVIEWED'))
);
--> statement-breakpoint
ALTER TABLE `purchase_invoice_ocr_result` ADD `invoice_file_id` text REFERENCES purchase_invoice_file(id);--> statement-breakpoint
CREATE INDEX `invoice_file_status_created_at_idx` ON `purchase_invoice_file` (`status`,`created_at`);