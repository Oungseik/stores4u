ALTER TABLE `product` ADD `stock` real DEFAULT 0 NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_inventory_movement` (
	`id` text PRIMARY KEY,
	`product_id` text NOT NULL,
	`invoice_item_id` text,
	`movement_type` text NOT NULL,
	`qty` real NOT NULL,
	`unit_cost_cents` integer,
	`reference_type` text,
	`reference_id` text,
	`reason` text,
	`occurred_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_inventory_movement_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`),
	CONSTRAINT `fk_inventory_movement_invoice_item_id_invoice_item_id_fk` FOREIGN KEY (`invoice_item_id`) REFERENCES `invoice_item`(`id`)
);
--> statement-breakpoint
INSERT INTO `__new_inventory_movement`(`id`, `product_id`, `invoice_item_id`, `movement_type`, `qty`, `unit_cost_cents`, `reference_type`, `reference_id`, `reason`, `occurred_at`, `created_at`) SELECT `id`, `product_id`, `invoice_item_id`, `movement_type`, `qty`, `unit_cost_cents`, `reference_type`, `reference_id`, `reason`, `occurred_at`, `created_at` FROM `inventory_movement`;--> statement-breakpoint
DROP TABLE `inventory_movement`;--> statement-breakpoint
ALTER TABLE `__new_inventory_movement` RENAME TO `inventory_movement`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_product` (
	`id` text PRIMARY KEY,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`barcode` text UNIQUE,
	`description` text,
	`uom` text NOT NULL,
	`price_cents` integer NOT NULL,
	`stock` real DEFAULT 0 NOT NULL,
	`low_stock_threshold` real DEFAULT 10,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_product`(`id`, `sku`, `name`, `image`, `barcode`, `description`, `uom`, `price_cents`, `low_stock_threshold`, `created_at`, `updated_at`) SELECT `id`, `sku`, `name`, `image`, `barcode`, `description`, `uom`, `price_cents`, `low_stock_threshold`, `created_at`, `updated_at` FROM `product`;--> statement-breakpoint
DROP TABLE `product`;--> statement-breakpoint
ALTER TABLE `__new_product` RENAME TO `product`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `inventory_batch_product_expiry_created_available_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `inventory_batch_product_remaining_qty_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `inventory_batch_invoice_item_id_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `inventory_movement_batch_id_idx`;--> statement-breakpoint
CREATE INDEX `inventory_movement_product_occurred_at_idx` ON `inventory_movement` (`product_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `inventory_movement_reference_idx` ON `inventory_movement` (`reference_type`,`reference_id`);--> statement-breakpoint
CREATE INDEX `inventory_movement_invoice_item_id_idx` ON `inventory_movement` (`invoice_item_id`);--> statement-breakpoint
CREATE INDEX `product_sku_idx` ON `product` (`sku`);--> statement-breakpoint
CREATE INDEX `product_name_idx` ON `product` (`name`);--> statement-breakpoint
DROP TABLE `inventory_batch`;