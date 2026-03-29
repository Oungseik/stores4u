CREATE TABLE `product_alias` (
	`id` text PRIMARY KEY,
	`product_id` text NOT NULL,
	`alias` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_product_alias_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE CASCADE,
	CONSTRAINT `product_alias_product_id_alias_unique` UNIQUE(`product_id`,`alias`)
);
--> statement-breakpoint
ALTER TABLE `purchase_invoice_item` ADD `invoice_item_name` text;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_purchase_invoice_item` (
	`id` text PRIMARY KEY,
	`purchase_invoice_id` text NOT NULL,
	`product_id` text,
	`invoice_item_name` text,
	`qty` real NOT NULL,
	`unit_cost_cents` integer NOT NULL,
	`line_subtotal_cents` integer NOT NULL,
	`vat_cents` integer DEFAULT 0 NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`freight_cents` integer DEFAULT 0 NOT NULL,
	`line_total_cents` integer NOT NULL,
	`expiry_date` text,
	`batch_number` text,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_invoice_item_invoice_id_invoice_id_fk` FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoice`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_invoice_item_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`)
);
--> statement-breakpoint
INSERT INTO `__new_purchase_invoice_item`(`id`, `purchase_invoice_id`, `product_id`, `qty`, `unit_cost_cents`, `line_subtotal_cents`, `vat_cents`, `discount_cents`, `freight_cents`, `line_total_cents`, `expiry_date`, `batch_number`, `created_at`) SELECT `id`, `purchase_invoice_id`, `product_id`, `qty`, `unit_cost_cents`, `line_subtotal_cents`, `vat_cents`, `discount_cents`, `freight_cents`, `line_total_cents`, `expiry_date`, `batch_number`, `created_at` FROM `purchase_invoice_item`;--> statement-breakpoint
DROP TABLE `purchase_invoice_item`;--> statement-breakpoint
ALTER TABLE `__new_purchase_invoice_item` RENAME TO `purchase_invoice_item`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `purchase_invoice_item_purchase_invoice_id_idx` ON `purchase_invoice_item` (`purchase_invoice_id`);--> statement-breakpoint
CREATE INDEX `purchase_invoice_item_product_id_idx` ON `purchase_invoice_item` (`product_id`);--> statement-breakpoint
CREATE INDEX `product_alias_product_id_idx` ON `product_alias` (`product_id`);