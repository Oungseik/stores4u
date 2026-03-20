CREATE TABLE `refund` (
	`id` text PRIMARY KEY,
	`order_id` text NOT NULL,
	`refund_total_cents` integer NOT NULL,
	`reason` text NOT NULL,
	`notes` text,
	`refunded_by` text,
	`refunded_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_refund_order_id_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `order`(`id`)
);
--> statement-breakpoint
CREATE TABLE `refund_item` (
	`id` text PRIMARY KEY,
	`refund_id` text NOT NULL,
	`order_item_id` text NOT NULL,
	CONSTRAINT `fk_refund_item_refund_id_refund_id_fk` FOREIGN KEY (`refund_id`) REFERENCES `refund`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_refund_item_order_item_id_order_item_id_fk` FOREIGN KEY (`order_item_id`) REFERENCES `order_item`(`id`)
);
--> statement-breakpoint
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
	`stock` integer DEFAULT 0 NOT NULL,
	`low_stock_threshold` integer DEFAULT 10,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_product`(`id`, `sku`, `name`, `image`, `barcode`, `description`, `uom`, `price_cents`, `stock`, `low_stock_threshold`, `created_at`, `updated_at`) SELECT `id`, `sku`, `name`, `image`, `barcode`, `description`, `uom`, `price_cents`, `stock`, `low_stock_threshold`, `created_at`, `updated_at` FROM `product`;--> statement-breakpoint
DROP TABLE `product`;--> statement-breakpoint
ALTER TABLE `__new_product` RENAME TO `product`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `product_sku_idx` ON `product` (`sku`);--> statement-breakpoint
CREATE INDEX `product_name_idx` ON `product` (`name`);--> statement-breakpoint
CREATE INDEX `refund_order_id_idx` ON `refund` (`order_id`);--> statement-breakpoint
CREATE INDEX `refund_refunded_at_idx` ON `refund` (`refunded_at`);--> statement-breakpoint
CREATE INDEX `refund_item_refund_id_idx` ON `refund_item` (`refund_id`);--> statement-breakpoint
CREATE INDEX `refund_item_order_item_id_idx` ON `refund_item` (`order_item_id`);