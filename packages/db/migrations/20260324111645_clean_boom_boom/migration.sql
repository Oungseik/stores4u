ALTER TABLE `invoice` RENAME TO `purchase_invoice`;--> statement-breakpoint
ALTER TABLE `invoice_item` RENAME TO `purchase_invoice_item`;--> statement-breakpoint
ALTER TABLE `invoice_ocr_result` RENAME TO `purchase_invoice_ocr_result`;--> statement-breakpoint
ALTER TABLE `purchase_invoice_item` RENAME COLUMN `invoice_id` TO `purchase_invoice_id`;--> statement-breakpoint
ALTER TABLE `inventory_movement` RENAME COLUMN `invoice_item_id` TO `purchase_invoice_item_id`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_purchase_invoice_ocr_result` (
	`id` text PRIMARY KEY,
	`photo_url` text NOT NULL,
	`raw_json` text NOT NULL,
	`extracted_text` text,
	`extracted_data` text,
	`confidence_score` real,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "purchase_invoice_ocr_result_confidence_score_check" CHECK("confidence_score" IS NULL OR ("confidence_score" >= 0 AND "confidence_score" <= 1)),
	CONSTRAINT "purchase_invoice_ocr_result_status_check" CHECK("status" IN ('PENDING', 'PROCESSED', 'FAILED', 'LINKED'))
);
--> statement-breakpoint
INSERT INTO `__new_purchase_invoice_ocr_result`(`id`, `photo_url`, `raw_json`, `extracted_text`, `extracted_data`, `confidence_score`, `status`, `created_at`) SELECT `id`, `photo_url`, `raw_json`, `extracted_text`, `extracted_data`, `confidence_score`, `status`, `created_at` FROM `purchase_invoice_ocr_result`;--> statement-breakpoint
DROP TABLE `purchase_invoice_ocr_result`;--> statement-breakpoint
ALTER TABLE `__new_purchase_invoice_ocr_result` RENAME TO `purchase_invoice_ocr_result`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_purchase_invoice` (
	`id` text PRIMARY KEY,
	`invoice_number` text NOT NULL,
	`supplier_id` text NOT NULL,
	`ocr_result_id` text UNIQUE,
	`invoice_date` text NOT NULL,
	`photo_url` text NOT NULL,
	`subtotal_cents` integer DEFAULT 0 NOT NULL,
	`vat_cents` integer DEFAULT 0 NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`freight_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`validated_by` text,
	`validated_at` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_invoice_supplier_id_supplier_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`),
	CONSTRAINT `fk_invoice_ocr_result_id_invoice_ocr_result_id_fk` FOREIGN KEY (`ocr_result_id`) REFERENCES `purchase_invoice_ocr_result`(`id`),
	CONSTRAINT `purchase_invoice_supplier_invoice_number_unique` UNIQUE(`supplier_id`,`invoice_number`)
);
--> statement-breakpoint
INSERT INTO `__new_purchase_invoice`(`id`, `invoice_number`, `supplier_id`, `ocr_result_id`, `invoice_date`, `photo_url`, `subtotal_cents`, `vat_cents`, `discount_cents`, `freight_cents`, `total_cents`, `status`, `validated_by`, `validated_at`, `notes`, `created_at`, `updated_at`) SELECT `id`, `invoice_number`, `supplier_id`, `ocr_result_id`, `invoice_date`, `photo_url`, `subtotal_cents`, `vat_cents`, `discount_cents`, `freight_cents`, `total_cents`, `status`, `validated_by`, `validated_at`, `notes`, `created_at`, `updated_at` FROM `purchase_invoice`;--> statement-breakpoint
DROP TABLE `purchase_invoice`;--> statement-breakpoint
ALTER TABLE `__new_purchase_invoice` RENAME TO `purchase_invoice`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `invoice_status_created_at_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `invoice_invoice_date_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `invoice_item_invoice_id_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `invoice_item_product_id_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `inventory_movement_invoice_item_id_idx`;--> statement-breakpoint
CREATE INDEX `purchase_invoice_status_created_at_idx` ON `purchase_invoice` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `purchase_invoice_invoice_date_idx` ON `purchase_invoice` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `purchase_invoice_item_purchase_invoice_id_idx` ON `purchase_invoice_item` (`purchase_invoice_id`);--> statement-breakpoint
CREATE INDEX `purchase_invoice_item_product_id_idx` ON `purchase_invoice_item` (`product_id`);--> statement-breakpoint
CREATE INDEX `inventory_movement_purchase_invoice_item_id_idx` ON `inventory_movement` (`purchase_invoice_item_id`);