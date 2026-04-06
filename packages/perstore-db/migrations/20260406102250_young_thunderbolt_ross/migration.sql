ALTER TABLE `purchase_invoice` ADD `invoice_file_id` text REFERENCES purchase_invoice_file(id);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_purchase_invoice` (
	`id` text PRIMARY KEY,
	`invoice_number` text NOT NULL,
	`supplier_id` text NOT NULL,
	`invoice_file_id` text UNIQUE,
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
	CONSTRAINT `fk_purchase_invoice_supplier_id_supplier_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`),
	CONSTRAINT `fk_purchase_invoice_invoice_file_id_purchase_invoice_file_id_fk` FOREIGN KEY (`invoice_file_id`) REFERENCES `purchase_invoice_file`(`id`),
	CONSTRAINT `fk_purchase_invoice_ocr_result_id_purchase_invoice_ocr_result_id_fk` FOREIGN KEY (`ocr_result_id`) REFERENCES `purchase_invoice_ocr_result`(`id`),
	CONSTRAINT `purchase_invoice_supplier_invoice_number_unique` UNIQUE(`supplier_id`,`invoice_number`)
);
--> statement-breakpoint
INSERT INTO `__new_purchase_invoice`(`id`, `invoice_number`, `supplier_id`, `ocr_result_id`, `invoice_date`, `photo_url`, `subtotal_cents`, `vat_cents`, `discount_cents`, `freight_cents`, `total_cents`, `status`, `validated_by`, `validated_at`, `notes`, `created_at`, `updated_at`) SELECT `id`, `invoice_number`, `supplier_id`, `ocr_result_id`, `invoice_date`, `photo_url`, `subtotal_cents`, `vat_cents`, `discount_cents`, `freight_cents`, `total_cents`, `status`, `validated_by`, `validated_at`, `notes`, `created_at`, `updated_at` FROM `purchase_invoice`;--> statement-breakpoint
DROP TABLE `purchase_invoice`;--> statement-breakpoint
ALTER TABLE `__new_purchase_invoice` RENAME TO `purchase_invoice`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_inventory_movement` (
	`id` text PRIMARY KEY,
	`product_id` text NOT NULL,
	`purchase_invoice_item_id` text,
	`movement_type` text NOT NULL,
	`qty` real NOT NULL,
	`unit_cost_cents` integer,
	`reference_type` text NOT NULL,
	`reference_id` text,
	`reason` text,
	`occurred_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_inventory_movement_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`),
	CONSTRAINT `fk_inventory_movement_purchase_invoice_item_id_purchase_invoice_item_id_fk` FOREIGN KEY (`purchase_invoice_item_id`) REFERENCES `purchase_invoice_item`(`id`)
);
--> statement-breakpoint
INSERT INTO `__new_inventory_movement`(`id`, `product_id`, `purchase_invoice_item_id`, `movement_type`, `qty`, `unit_cost_cents`, `reference_type`, `reference_id`, `reason`, `occurred_at`, `created_at`) SELECT `id`, `product_id`, `purchase_invoice_item_id`, `movement_type`, `qty`, `unit_cost_cents`, `reference_type`, `reference_id`, `reason`, `occurred_at`, `created_at` FROM `inventory_movement`;--> statement-breakpoint
DROP TABLE `inventory_movement`;--> statement-breakpoint
ALTER TABLE `__new_inventory_movement` RENAME TO `inventory_movement`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `purchase_invoice_status_created_at_idx` ON `purchase_invoice` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `purchase_invoice_invoice_date_idx` ON `purchase_invoice` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `inventory_movement_product_occurred_at_idx` ON `inventory_movement` (`product_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `inventory_movement_reference_idx` ON `inventory_movement` (`reference_type`,`reference_id`);--> statement-breakpoint
CREATE INDEX `inventory_movement_purchase_invoice_item_id_idx` ON `inventory_movement` (`purchase_invoice_item_id`);