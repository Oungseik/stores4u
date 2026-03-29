ALTER TABLE `purchase_invoice_ocr_result` ADD `rejection_reason` text;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_purchase_invoice_ocr_result` (
	`id` text PRIMARY KEY,
	`photo_url` text NOT NULL,
	`invoice_file_id` text,
	`raw_json` text NOT NULL,
	`extracted_text` text,
	`extracted_data` text,
	`confidence_score` real,
	`rejection_reason` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_purchase_invoice_ocr_result_invoice_file_id_purchase_invoice_file_id_fk` FOREIGN KEY (`invoice_file_id`) REFERENCES `purchase_invoice_file`(`id`),
	CONSTRAINT "purchase_invoice_ocr_result_confidence_score_check" CHECK("confidence_score" IS NULL OR ("confidence_score" >= 0 AND "confidence_score" <= 1)),
	CONSTRAINT "purchase_invoice_ocr_result_status_check" CHECK("status" IN ('PENDING', 'PROCESSED', 'FAILED', 'REJECTED', 'LINKED'))
);
--> statement-breakpoint
INSERT INTO `__new_purchase_invoice_ocr_result`(`id`, `photo_url`, `invoice_file_id`, `raw_json`, `extracted_text`, `extracted_data`, `confidence_score`, `status`, `created_at`) SELECT `id`, `photo_url`, `invoice_file_id`, `raw_json`, `extracted_text`, `extracted_data`, `confidence_score`, `status`, `created_at` FROM `purchase_invoice_ocr_result`;--> statement-breakpoint
DROP TABLE `purchase_invoice_ocr_result`;--> statement-breakpoint
ALTER TABLE `__new_purchase_invoice_ocr_result` RENAME TO `purchase_invoice_ocr_result`;--> statement-breakpoint
PRAGMA foreign_keys=ON;