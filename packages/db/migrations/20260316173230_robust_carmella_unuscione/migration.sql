ALTER TABLE `product` ADD `low_stock_threshold` integer;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_order` (
	`id` text PRIMARY KEY,
	`customer_name` text,
	`customer_phone` text,
	`subtotal_cents` integer DEFAULT 0 NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_order`(`id`, `customer_name`, `customer_phone`, `subtotal_cents`, `discount_cents`, `total_cents`, `notes`, `created_at`, `updated_at`) SELECT `id`, `customer_name`, `customer_phone`, `subtotal_cents`, `discount_cents`, `total_cents`, `notes`, `created_at`, `updated_at` FROM `order`;--> statement-breakpoint
DROP TABLE `order`;--> statement-breakpoint
ALTER TABLE `__new_order` RENAME TO `order`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `order_created_at_idx` ON `order` (`created_at`);--> statement-breakpoint
ALTER TABLE `product` DROP COLUMN `stock`;